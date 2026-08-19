# /build Reference — Implementation Patterns

## SlugCounter schema addition

Add to `prisma/schema.prisma` and run `npx prisma migrate dev`:

```prisma
model SlugCounter {
  id Int @id @default(autoincrement())
}
```

Service pattern for generating a slug:

```typescript
const counter = await prisma.slugCounter.create({ data: {} });
const slug = encode(counter.id);
```

Alternative: raw Postgres sequence via `$queryRaw` — prefer SlugCounter table for Prisma-native simplicity.

---

## lib/base62.ts sketch

```typescript
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = BigInt(62);

// cuid()s are for internal IDs (unguessable, collision-safe).
// Base62(sequence) is for public-facing short slugs (short, sequential, no collisions to check).

export function encode(num: bigint | number): string { /* ... */ }
export function decode(str: string): bigint { /* ... */ }

// Round-trip tests (comments):
// encode(0) === "0", decode("0") === 0n
// encode(61) === "Z", decode("Z") === 61n
// encode(3844) === "100", decode("100") === 3844n
```

---

## lib/redis.ts

```typescript
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});
```

Install: `npm install @upstash/redis`

---

## Cached link shape

```typescript
type CachedLink = {
  longUrl: string;
  isActive: boolean;
  expiresAt: string | null; // ISO string
  passwordHash: string | null;
  linkId: string;
};
```

- Active, valid links: TTL **3600** seconds (1 hour)
- Dead slugs (not found / inactive / expired): optional short TTL (**60** s) with sentinel value to prevent DB hammering

---

## app/[slug]/route.ts pattern

```typescript
import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { getLinkBySlug } from "@/lib/services/links";
import { trackClick } from "@/lib/services/analytics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);

  if (!link) {
    return new NextResponse(null, { status: 404 });
  }

  if (link.passwordHash) {
    return NextResponse.redirect(new URL(`/verify/${slug}`, request.url), 302);
  }

  const response = NextResponse.redirect(link.longUrl, 302);

  // after() is preferred over a bare unawaited promise because Vercel serverless
  // functions can freeze/terminate once the response is sent, killing unawaited
  // async work — after() guarantees it runs to completion.
  after(() => trackClick(link.linkId, request));

  return response;
}
```

Use `notFound()` from `next/navigation` if returning the branded not-found page instead of empty 404.

---

## lib/services/analytics.ts

Dependencies: `npm install ua-parser-js` + `npm install -D @types/ua-parser-js`

- IP: first entry in `x-forwarded-for` header, fallback `x-real-ip`
- Hash: `crypto.createHash("sha256").update(ip + env.IP_HASH_SALT).digest("hex")` — add `IP_HASH_SALT` to `lib/env.ts` and `.env.example` if not present
- GeoIP: try ipgeolocation.io when `IPGEOLOCATION_API_KEY` set; else ip-api.com (no key). Always try/catch, return null country/city on failure.
- Transaction:

```typescript
await prisma.$transaction([
  prisma.click.create({ data: { linkId, ipHash, country, city, referrer, userAgent, deviceType, browser, os } }),
  prisma.link.update({ where: { id: linkId }, data: { clickCount: { increment: 1 } } }),
]);
```

---

## not-found.tsx

Place at `app/[slug]/not-found.tsx`. Branded message: **"This link doesn't exist or has expired"**. Server Component (no `"use client"` unless needed).

---

## New env vars (if adding IP_HASH_SALT)

Add to `lib/env.ts`, `.env.example`:

```bash
# openssl rand -base64 32 — salt for hashing visitor IPs before storage
IP_HASH_SALT=""
```

---

## Verification checklist

```bash
npx prisma migrate dev   # if SlugCounter added
npx prisma generate
npx tsc --noEmit
```
