---
name: plan
description: >-
  Sets up the AnythingShort foundational data layer — Prisma schema (Postgres/Supabase),
  singleton client, Zod env validation, and .env.example. Use when the user invokes
  /plan or asks to initialize Phase 1 data layer for AnythingShort.
disable-model-invocation: true
---

# /plan — Foundational Data Layer

Act as the lead backend architect for AnythingShort. Set up the foundational data layer.

**Before starting:** Read `.cursorrules` and follow it exactly (strict TypeScript, single Prisma client in `lib/prisma.ts`, env vars via `lib/env.ts`, no hardcoded secrets).

## Task Progress

```
- [ ] 1. Initialize Prisma + schema.prisma
- [ ] 2. clickCount comment block in schema
- [ ] 3. lib/prisma.ts singleton
- [ ] 4. lib/env.ts (Zod, fail fast)
- [ ] 5. .env.example
- [ ] 6. npx prisma generate (no migrate)
- [ ] 7. README.md "Local Setup" section
- [ ] Verify: npx tsc --noEmit
```

---

## TASKS

### 1. Initialize Prisma with a Postgres provider pointed at Supabase

Create `prisma/schema.prisma` with these models:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  plan          Plan      @default(FREE)
  createdAt     DateTime  @default(now())
  links         Link[]
  accounts      Account[]   // NextAuth
  sessions      Session[]   // NextAuth
}

enum Plan {
  FREE
  PRO
}

model Link {
  id             String     @id @default(cuid())
  slug           String     @unique
  longUrl        String
  userId         String
  user           User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  customDomain   String?
  title          String?
  description    String?
  ogImageUrl     String?
  passwordHash   String?
  expiresAt      DateTime?
  isActive       Boolean    @default(true)
  clickCount     Int        @default(0)   // denormalized counter for fast dashboard reads
  createdAt      DateTime   @default(now())
  clicks         Click[]

  @@index([userId])
  @@index([slug])
}

model Click {
  id           String    @id @default(cuid())
  linkId       String
  link         Link      @relation(fields: [linkId], references: [id], onDelete: Cascade)
  ipHash       String     // store a hash, never raw IP (privacy)
  country      String?
  city         String?
  referrer     String?
  userAgent    String?
  deviceType   String?    // mobile/desktop/tablet, derived from UA
  browser      String?
  os           String?
  clickedAt    DateTime   @default(now())

  @@index([linkId])
  @@index([clickedAt])
}

// Standard NextAuth Account/Session/VerificationToken models per the
// official Prisma adapter schema — include these exactly as NextAuth's
// @auth/prisma-adapter documentation specifies, don't improvise fields.
```

**Datasource block (Supabase):**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

`DATABASE_URL` = Supabase connection pooler (port 6543, `?pgbouncer=true`).  
`DIRECT_URL` = direct Postgres connection (port 5432) for migrations.

**NextAuth models:** Copy Account, Session, and VerificationToken exactly from [reference.md](reference.md). Extend the User model above with NextAuth-required fields (`emailVerified DateTime?`) while keeping the user's fields (`email` required, `plan`, `links`, etc.).

If not already installed: `npm install @prisma/client` and `npm install prisma --save-dev`, then `npx prisma init` if `prisma/` does not exist.

---

### 2. clickCount comment block

Add a comment block at the **top** of `schema.prisma` explaining:

- **Why denormalized:** Avoids a `COUNT(*)` aggregation on every dashboard load.
- **Sync strategy:** Incremented atomically in the async analytics write (Phase 2).

---

### 3. lib/prisma.ts

Standard Next.js singleton to prevent hot-reload connection exhaustion in dev:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Never instantiate `new PrismaClient()` anywhere else.

---

### 4. lib/env.ts

Use Zod to validate and export all required env vars:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `IPGEOLOCATION_API_KEY` (or chosen free GeoIP provider)

Fail fast with a clear thrown error listing **which var is missing** if any is undefined. Export a typed `env` object consumed by the rest of the app — never read `process.env` directly outside this file.

---

### 5. .env.example

Committed file with **no real values**. One-line comment per var on where to obtain it. See [reference.md](reference.md) for the full template.

---

### 6. Generate (no migrate)

Run:

```bash
npx prisma generate
```

Confirm the schema compiles with no errors. **Do NOT run `migrate` yet.**

---

### 7. README.md — Local Setup

Add or update a section titled **Local Setup** documenting:

1. Clone the repo
2. `npm install`
3. Copy `.env.example` → `.env.local` and fill values
4. `npx prisma migrate dev`
5. `npm run dev`

---

## Constraints

- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `noImplicitAny` in tsconfig)
- No hardcoded connection strings or secrets
- Follow `.cursorrules` exactly
- After completion, run `npx tsc --noEmit` and fix all errors

## Additional Resources

- NextAuth Prisma adapter models and `.env.example` template: [reference.md](reference.md)
