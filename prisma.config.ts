import { defineConfig, env } from 'prisma/config'

// Prisma 7 no longer auto-loads .env, so the CLI needs it loaded explicitly.
// (Next.js loads .env by itself, so this is only for `prisma migrate`/`seed`.)
// On Vercel/CI the vars are already in the environment and there is no file.
try {
  process.loadEnvFile('.env') // Node >= 20.12
} catch {
  // no .env file — fall through to real environment variables
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
