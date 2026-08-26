/**
 * Guard for the `:prod` scripts.
 *
 * They are pointed at whatever `.env.production.local` contains, so a leftover
 * localhost URL would silently seed the development database while the operator
 * believes they are touching production. Refuse loudly instead.
 */
const url = process.env.DATABASE_URL ?? ''

function fail(reason: string): never {
  console.error(`\n✗ ${reason}\n`)
  console.error('  Renseignez l’URL Neon directe dans .env.production.local :')
  console.error('  DATABASE_URL="postgresql://…@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"\n')
  process.exit(1)
}

if (!url) fail('DATABASE_URL est vide — .env.production.local est absent ou incomplet.')

if (url.includes('COLLEZ') || url.includes('<') || url.includes('…')) {
  fail('DATABASE_URL contient encore le texte d’exemple.')
}

if (/localhost|127\.0\.0\.1/.test(url)) {
  fail('DATABASE_URL pointe sur votre base locale, pas sur la production.')
}

const host = (() => {
  try {
    return new URL(url).hostname
  } catch {
    fail('DATABASE_URL n’est pas une URL valide (des chevrons < > oubliés ?).')
  }
})()

if (host.includes('-pooler')) {
  console.warn(
    `\n⚠ ${host} est l’endpoint « pooled ». Pour un script ponctuel, l’endpoint direct\n` +
      '  (sans -pooler) est préférable. On continue quand même.\n',
  )
}

console.log(`→ Cible : ${host}\n`)
