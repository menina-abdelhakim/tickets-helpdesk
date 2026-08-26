import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

// Relative imports on purpose: this runs under tsx, outside Next's "@/" alias.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

/**
 * Empties the ticket table for a clean start. Users are kept: deleting them
 * would leave nobody able to sign in. Comments cascade from tickets.
 */
async function main() {
  const { count } = await prisma.ticket.deleteMany()
  const users = await prisma.user.count()
  console.log(`${count} ticket(s) supprimé(s). ${users} compte(s) conservé(s).`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
