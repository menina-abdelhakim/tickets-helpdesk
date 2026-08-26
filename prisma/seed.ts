import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

// Relative imports on purpose: this runs under tsx, outside Next's "@/" alias.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const DEMO_PASSWORD = 'demo1234'

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  // Wipe tickets so reseeding is idempotent; comments cascade from tickets.
  await prisma.ticket.deleteMany()

  const [admin, agent, claire, samir] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@tickets.dev' },
      update: {},
      create: { email: 'admin@tickets.dev', name: 'Nadia Bensalem', role: 'ADMIN', passwordHash },
    }),
    prisma.user.upsert({
      where: { email: 'agent@tickets.dev' },
      update: {},
      create: { email: 'agent@tickets.dev', name: 'Marc Lefèvre', role: 'AGENT', passwordHash },
    }),
    prisma.user.upsert({
      where: { email: 'claire@tickets.dev' },
      update: {},
      create: { email: 'claire@tickets.dev', name: 'Claire Fontaine', role: 'USER', passwordHash },
    }),
    prisma.user.upsert({
      where: { email: 'samir@tickets.dev' },
      update: {},
      create: { email: 'samir@tickets.dev', name: 'Samir Haddad', role: 'USER', passwordHash },
    }),
  ])

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

  const tickets = [
    {
      title: 'Impossible de se connecter au VPN depuis la mise à jour',
      description:
        "Depuis la mise à jour de mardi, le client VPN affiche « authentication failed » alors que mes identifiants sont corrects. Je peux me connecter au wifi du bureau sans problème.",
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      createdById: claire.id,
      assignedToId: agent.id,
      createdAt: daysAgo(3),
      comments: [
        { authorId: agent.id, body: "Bonjour Claire, quelle version du client VPN est installée ? (Aide > À propos)", createdAt: daysAgo(3) },
        { authorId: claire.id, body: 'La version 7.2.1. Je viens de redémarrer, même erreur.', createdAt: daysAgo(2) },
        { authorId: agent.id, body: "Merci. C'est un bug connu de la 7.2.1 avec le nouveau SSO. Je pousse la 7.2.4 sur votre poste ce soir.", createdAt: daysAgo(1) },
      ],
    },
    {
      title: 'Demande accès au dossier partagé Comptabilité',
      description: "J'ai rejoint l'équipe finance ce mois-ci et je n'ai pas accès au partage \\\\srv-01\\compta.",
      status: 'RESOLVED' as const,
      priority: 'MEDIUM' as const,
      createdById: samir.id,
      assignedToId: agent.id,
      createdAt: daysAgo(9),
      comments: [
        { authorId: agent.id, body: "Accès accordé en lecture/écriture. Merci de vous déconnecter puis reconnecter.", createdAt: daysAgo(8) },
        { authorId: samir.id, body: 'Ça fonctionne, merci beaucoup !', createdAt: daysAgo(8) },
      ],
    },
    {
      title: 'Écran externe non détecté sur la station d’accueil',
      description: "Le deuxième écran reste noir quand je branche le dock USB-C. Il fonctionne en HDMI direct sur le portable.",
      status: 'OPEN' as const,
      priority: 'LOW' as const,
      createdById: claire.id,
      assignedToId: null,
      createdAt: daysAgo(1),
      comments: [],
    },
    {
      title: 'Serveur de facturation inaccessible — production bloquée',
      description: "L'application de facturation renvoie une 502 depuis 9h15. Toute l'équipe est bloquée, on ne peut plus éditer de factures clients.",
      status: 'IN_PROGRESS' as const,
      priority: 'URGENT' as const,
      createdById: samir.id,
      assignedToId: admin.id,
      createdAt: daysAgo(0),
      comments: [
        { authorId: admin.id, body: "Incident confirmé, le pool applicatif est tombé. Redémarrage en cours, je tiens ce ticket à jour.", createdAt: daysAgo(0) },
      ],
    },
    {
      title: 'Réinitialisation du mot de passe de la messagerie',
      description: 'Compte verrouillé après plusieurs tentatives. Merci de réinitialiser.',
      status: 'CLOSED' as const,
      priority: 'MEDIUM' as const,
      createdById: claire.id,
      assignedToId: agent.id,
      createdAt: daysAgo(21),
      comments: [
        { authorId: agent.id, body: 'Mot de passe temporaire envoyé sur votre ligne mobile. À changer à la première connexion.', createdAt: daysAgo(21) },
      ],
    },
    {
      title: 'Licence Office expirée sur le poste de la salle de réunion',
      description: "Word affiche « produit sans licence » sur le PC de la salle Jaurès. Bloquant pour les présentations client.",
      status: 'OPEN' as const,
      priority: 'HIGH' as const,
      createdById: samir.id,
      assignedToId: null,
      createdAt: daysAgo(2),
      comments: [],
    },
    {
      title: 'Imprimante 2e étage : bourrage papier récurrent',
      description: 'Bourrage tous les 15-20 pages sur le bac 2. Le bac 1 fonctionne normalement.',
      status: 'RESOLVED' as const,
      priority: 'LOW' as const,
      createdById: claire.id,
      assignedToId: agent.id,
      createdAt: daysAgo(14),
      comments: [
        { authorId: agent.id, body: "Rouleau d'entraînement du bac 2 remplacé. Testé sur 60 pages sans incident.", createdAt: daysAgo(12) },
      ],
    },
    {
      title: 'Ajouter un nouveau collaborateur à l’annuaire interne',
      description: "Arrivée de Léa Marchand le 1er septembre, poste développeuse. Merci de créer le compte et la boîte mail.",
      status: 'OPEN' as const,
      priority: 'MEDIUM' as const,
      createdById: admin.id,
      assignedToId: agent.id,
      createdAt: daysAgo(4),
      comments: [
        { authorId: agent.id, body: 'Compte créé. En attente du matériel pour finaliser la configuration du poste.', createdAt: daysAgo(3) },
      ],
    },
  ]

  for (const { comments, ...ticket } of tickets) {
    // `@updatedAt` would stamp "now" on every row, making the whole list read
    // "à l'instant" and destroying the ordering. Set it explicitly to the last
    // activity on the ticket so the seeded history looks like real history.
    const lastActivity = comments.at(-1)?.createdAt ?? ticket.createdAt

    // Rebuild a plausible audit trail, so the demo timeline is not empty and
    // the recorded history matches the state the ticket ended up in.
    const events = [
      {
        type: 'CREATED' as const,
        actorId: ticket.createdById,
        createdAt: ticket.createdAt,
      },
      ...(ticket.assignedToId
        ? [
            {
              type: 'ASSIGNED' as const,
              actorId: ticket.assignedToId,
              targetUserId: ticket.assignedToId,
              createdAt: new Date(ticket.createdAt.getTime() + 30 * 60_000),
            },
          ]
        : []),
      ...(ticket.status !== 'OPEN' && ticket.assignedToId
        ? [
            {
              type: 'STATUS_CHANGED' as const,
              actorId: ticket.assignedToId,
              fromStatus: 'OPEN' as const,
              toStatus: ticket.status,
              createdAt: lastActivity,
            },
          ]
        : []),
    ]

    await prisma.ticket.create({
      data: {
        ...ticket,
        updatedAt: lastActivity,
        comments: { create: comments },
        events: { create: events },
      },
    })
  }

  const counts = await prisma.ticket.groupBy({ by: ['status'], _count: true })
  console.log(
    `Seeded ${await prisma.user.count()} users, ${await prisma.ticket.count()} tickets ` +
      `and ${await prisma.ticketEvent.count()} events`,
  )
  console.log(counts.map((c) => `  ${c.status}: ${c._count}`).join('\n'))
  console.log(`\nDemo login — admin@tickets.dev / ${DEMO_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
