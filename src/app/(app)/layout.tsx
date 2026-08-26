import { signOut } from '@/auth'
import type { Role } from '@/generated/prisma/enums'
import { DashboardIcon, InboxIcon, LogoutIcon, PlusIcon } from '@/components/icons'
import { Sidebar, type NavItem } from '@/components/sidebar'
import { Button } from '@/components/ui'
import { requireUser } from '@/lib/session'

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrateur',
  AGENT: 'Agent support',
  USER: 'Demandeur',
}

const NAV: NavItem[] = [
  { href: '/', label: 'Tableau de bord', icon: <DashboardIcon /> },
  { href: '/tickets', label: 'Tickets', icon: <InboxIcon /> },
  { href: '/tickets/new', label: 'Nouveau ticket', icon: <PlusIcon /> },
]

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const user = await requireUser()

  return (
    <div className="min-h-full">
      <Sidebar
        items={NAV}
        user={{ name: user.name, role: ROLE_LABELS[user.role] }}
        logout={
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <Button type="submit" variant="ghost" size="sm" aria-label="Déconnexion">
              <LogoutIcon />
            </Button>
          </form>
        }
      />

      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
