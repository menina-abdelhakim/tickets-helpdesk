const RELATIVE = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
const ABSOLUTE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60_000],
  ['month', 30 * 24 * 60 * 60_000],
  ['day', 24 * 60 * 60_000],
  ['hour', 60 * 60_000],
  ['minute', 60_000],
]

/** "il y a 3 jours" — rendered on the server, so no hydration mismatch. */
export function relativeTime(date: Date): string {
  const diff = date.getTime() - Date.now()
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return RELATIVE.format(Math.round(diff / ms), unit)
  }
  return "à l'instant"
}

export function absoluteTime(date: Date): string {
  return ABSOLUTE.format(date)
}
