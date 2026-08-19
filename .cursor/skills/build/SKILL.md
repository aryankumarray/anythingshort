---
name: build
description: >-
  Builds the AnythingShort core redirection engine — Base62 slugs, Redis cache-aside,
  redirect route, and async click analytics. Use when the user invokes /build or asks
  to implement Phase 2 redirect/analytics for AnythingShort.
disable-model-invocation: true
---

# /build — Core Redirection Engine

Act as the lead backend architect. Build the core redirection engine — this is the highest-traffic, most performance-critical path in the app.

**Before starting:** Read `.cursorrules` and follow it exactly. Prerequisite: `/plan` data layer must exist (`lib/prisma.ts`, `lib/env.ts`, Prisma schema).

## Task Progress

```
- [ ] 1. lib/base62.ts + SlugCounter (schema migration if needed)
- [ ] 2. lib/redis.ts
- [ ] 3. lib/services/links.ts (cache-aside + invalidate)
- [ ] 4. app/[slug]/route.ts (302 redirect + after() analytics)
- [ ] 5. lib/services/analytics.ts (trackClick + transaction)
- [ ] 6. app/[slug]/not-found.tsx
- [ ] Verify: npx tsc --noEmit
```

---

## TASKS

### 1. lib/base62.ts

- Alphabet: 0-9a-zA-Z (62 chars).
- encode(num: bigint | number): string — convert an auto-increment-style numeric ID into a Base62 string.
- decode(str: string): bigint — reverse operation.
- Since we use cuid() for primary keys (not sequential ints), implement slug generation via a separate lightweight counter: add a `SlugCounter` table (id auto-increment) OR use a Postgres sequence. Generate the sequence value, Base62-encode it, and use THAT as the Link.slug for auto-generated (non-custom) links. Explain this design choice in a comment: cuid()s are for internal IDs (unguessable, collision-safe); Base62(sequence) is for public-facing short slugs (short, sequential, no collisions to check).
- Write 3 inline test cases as comments showing encode/decode round-trips.

### 2. lib/redis.ts

Single Upstash Redis client via @upstash/redis, reading from lib/env.ts.

### 3. lib/services/links.ts

- getLinkBySlug(slug: string): cache-aside pattern —
  a. Check Redis key `link:{slug}` (store as JSON: {longUrl, isActive, expiresAt, passwordHash, linkId}).
  b. On cache miss, query Prisma for the Link by slug.
  c. If found and active and not expired, populate Redis with a TTL of 1 hour (expired/inactive links should NOT be cached, or cached with a short negative TTL to avoid repeated DB hits on dead slugs).
  d. Return null if not found/expired/inactive so the route can 404.
- invalidateLinkCache(slug): del the Redis key — call this from the update/delete link service so cache never goes stale after edits.

### 4. app/[slug]/route.ts — the redirect handler

- GET handler, params: { slug }.
- Call getLinkBySlug. If null -> return a 404 page (not a JSON error — this is a user-facing route).
- If passwordHash is set, redirect to /verify/[slug] instead of the longUrl (implemented in Phase 6) — for Phase 2, just check the flag and stub the redirect target.
- If clear, issue a 302 redirect to longUrl IMMEDIATELY — do not await analytics before responding.
- AFTER constructing the redirect response, fire an async (non-blocking) call to a trackClick function — do NOT `await` it in a way that delays the response. Use Next.js's `after()` API (from `next/server`) to schedule the analytics write to run after the response is sent. Explain in a comment why `after()` is preferred over a bare unawaited promise (Vercel serverless functions can freeze/terminate once the response is sent, killing unawaited async work — `after()` guarantees it runs to completion).

### 5. lib/services/analytics.ts

- trackClick(linkId, request): extract IP from request headers (x-forwarded-for), hash it with a salt (never store raw IP — privacy + GDPR hygiene), extract User-Agent, referrer.
- Call a GeoIP lookup (use a free-tier provider — ip-api.com for no-signup free use, or ipgeolocation.io if a key is configured) to resolve country/city from the IP. Wrap in try/catch — geo lookup failure must never throw and break click tracking.
- Parse User-Agent with a lightweight library (ua-parser-js) to derive deviceType/browser/os.
- Write the Click row AND atomically increment Link.clickCount in a single Prisma transaction ($transaction) so the counter never drifts from actual click rows.

### 6. Add a not-found.tsx for the [slug] route scope

A clean branded "This link doesn't exist or has expired" page.

---

## Constraints

- The redirect response time is the KPI here — nothing analytics-related may add latency to the 302.
- Follow `.cursorrules`.
- Run `npx tsc --noEmit` when done.

## Additional Resources

- Implementation patterns, cache TTLs, and code templates: [reference.md](reference.md)
