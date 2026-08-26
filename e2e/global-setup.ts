import { execSync } from 'node:child_process'

/**
 * Reset the database to the seed before the suite runs.
 *
 * Without this the specs depend on whatever state the database happens to be
 * in — a status changed by hand in the browser is enough to break an assertion
 * on the dashboard counts. Owning the fixture is what makes the suite
 * deterministic, locally and in CI alike.
 */
export default function globalSetup() {
  execSync('npx prisma db seed', { stdio: 'inherit' })
}
