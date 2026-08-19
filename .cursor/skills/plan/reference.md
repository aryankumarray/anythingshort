# /plan Reference — NextAuth Models & .env.example

## NextAuth Prisma Adapter Models (PostgreSQL)

Include these **exactly** as specified by [@auth/prisma-adapter](https://authjs.dev/getting-started/adapters/prisma). Merge with the custom `User` model from SKILL.md (add `emailVerified`, keep `plan`, `links`, required `email`).

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Merged User model** (custom fields + NextAuth adapter requirement):

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  plan          Plan      @default(FREE)
  createdAt     DateTime  @default(now())
  links         Link[]
  accounts      Account[]
  sessions      Session[]
}
```

---

## schema.prisma top comment (clickCount)

```prisma
// clickCount on Link is denormalized to avoid COUNT(*) aggregations on every
// dashboard load. It is kept in sync by atomically incrementing it in the async
// analytics write path (Phase 2), not on the hot redirect path.
```

---

## .env.example template

```bash
# Supabase → Project Settings → Database → Connection string (URI)
# Use "Transaction" pooler for DATABASE_URL (port 6543, add ?pgbouncer=true)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase → Project Settings → Database → Direct connection (port 5432)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# openssl rand -base64 32
NEXTAUTH_SECRET=""

# http://localhost:3000 in dev; production URL in prod
NEXTAUTH_URL="http://localhost:3000"

# Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# GitHub → Settings → Developer settings → OAuth Apps
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Upstash Console → Redis database → REST API
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# ipgeolocation.io (or chosen GeoIP provider) → API key
IPGEOLOCATION_API_KEY=""
```

---

## lib/env.ts pattern

```typescript
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  IPGEOLOCATION_API_KEY: z.string().min(1),
});

function parseEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`Missing or invalid environment variables: ${missing}`);
  }
  return parsed.data;
}

export const env = parseEnv();
```

Install `zod` if not present: `npm install zod`.

---

## README Local Setup section

```markdown
## Local Setup

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and fill in all values
4. Run `npx prisma migrate dev` to apply the database schema
5. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000)
```
