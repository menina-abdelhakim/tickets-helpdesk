import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import type { Actor } from '@/lib/permissions'

export type CurrentUser = Actor & { name: string; email: string }

/**
 * The single entry point for "who is asking". Every protected page and server
 * action starts here, so there is no route that can forget the check.
 */
export async function requireUser(): Promise<CurrentUser> {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return {
    id: session.user.id,
    role: session.user.role,
    name: session.user.name ?? session.user.email ?? 'Utilisateur',
    email: session.user.email ?? '',
  }
}
