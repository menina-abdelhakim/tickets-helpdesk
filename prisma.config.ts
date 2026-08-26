import { defineConfig } from 'prisma/config'

// Prisma 7 no longer auto-loads .env, so the CLI needs it loaded explicitly.
// (Next.js loads .env by itself, so this is only for `prisma migrate`/`seed`.)
// On Vercel/CI the vars are already in the environment and there is no file.
try {
  process.loadEnvFile('.env') // Node >= 20.12
} catch {
  // no .env file — fall through to real environment variables
}

/*
 * Migrations must not go through a connection pooler.
 *
 * Neon (like Supabase) exposes two endpoints: a pooled one for the application,
 * and a direct one. PgBouncer in transaction mode cannot hold the session-level
 * locks and advisory locks that `prisma migrate deploy` needs, so migrations run
 * against DIRECT_URL when it is present and fall back to DATABASE_URL locally,
 * where a single Postgres serves both roles.
 */
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!migrationUrl) {
  throw new Error('DATABASE_URL (or DIRECT_URL) must be set to run Prisma commands.')
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: migrationUrl,
  },
})
