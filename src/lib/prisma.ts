import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

// Prisma 7 connects through a driver adapter instead of a URL in schema.prisma.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

// Next.js hot-reloads modules in dev, which would otherwise open a new pool on
// every save until Postgres refuses connections. Reuse one client via globalThis.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
