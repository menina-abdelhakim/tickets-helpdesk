'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { CloseIcon, LogoMark, MenuIcon } from '@/components/icons'
import { Avatar } from '@/components/ui'

export type NavItem = { href: string; label: string; icon: ReactNode }

export function Sidebar({
  items,
  user,
  logout,
}: {
  items: NavItem[]
  user: { name: string; role: string }
  /** Rendered by the server layout so the sign-out server action stays server-side. */
  logout: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      {/* Compact bar shown only below `lg`, where the sidebar is off-canvas. */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="rounded-lg p-1.5 text-content-muted transition-colors hover:bg-surface-hover hover:text-content"
        >
          <MenuIcon />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="size-6" />
          <span className="text-sm font-semibold text-content">Tickets</span>
        </Link>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-[oklch(0.2_0.02_260_/_0.4)] lg:hidden"
        />
      )}

      {/*
        Toggled with display, not a transform: a translated-off panel stays
        focusable and reachable by screen readers, which would leak the whole
        navigation to keyboard users on mobile. `hidden` removes it outright.
      */}
      <aside
        className={`${open ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-border bg-surface lg:flex`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-sm font-semibold tracking-tight text-content">Tickets</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="rounded-lg p-1.5 text-content-muted hover:bg-surface-hover lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent-soft text-accent'
                    : 'text-content-muted hover:bg-surface-hover hover:text-content'
                }`}
              >
                <span className="[&_svg]:size-[1.15rem]">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-center gap-3">
            <div data-testid="current-user" className="flex min-w-0 flex-1 items-center gap-2.5">
              <Avatar name={user.name} size="sm" />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-medium text-content">{user.name}</span>
                <span className="block truncate text-xs text-content-subtle">{user.role}</span>
              </span>
            </div>
            {logout}
          </div>
        </div>
      </aside>
    </>
  )
}
