'use client'

import { useActionState } from 'react'
import { LogoMark } from '@/components/icons'
import { Button, Field, inputClass } from '@/components/ui'
import { login, type LoginState } from './actions'

const DEMO_ACCOUNTS = [
  { email: 'admin@tickets.dev', role: 'Administrateur' },
  { email: 'agent@tickets.dev', role: 'Agent support' },
  { email: 'claire@tickets.dev', role: 'Demandeur' },
]

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {})

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: the form. Kept first in the DOM so it is what a keyboard or
          screen-reader user reaches immediately. */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <LogoMark className="size-9" />
            <h1 className="text-2xl font-semibold tracking-tight text-content">Connexion</h1>
            <p className="text-sm text-content-muted">
              Accédez à l’espace de support interne.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <Field label="Email">
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue="admin@tickets.dev"
                className={inputClass}
              />
            </Field>

            <Field label="Mot de passe">
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                defaultValue="demo1234"
                className={inputClass}
              />
            </Field>

            {state.error && (
              <p
                role="alert"
                data-testid="login-error"
                className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
              >
                {state.error}
              </p>
            )}

            <Button type="submit" variant="primary" loading={pending} className="w-full">
              {pending ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          <div className="rounded-xl border border-border bg-surface-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-content-subtle">
              Comptes de démonstration
            </p>
            <ul className="mt-3 space-y-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email} className="flex justify-between gap-3 text-xs">
                  <code className="text-content">{account.email}</code>
                  <span className="text-content-subtle">{account.role}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-content-subtle">
              Mot de passe commun : <code className="text-content">demo1234</code>
            </p>
          </div>
        </div>
      </main>

      {/* Right: decorative panel, hidden on small screens. */}
      <aside className="relative hidden overflow-hidden border-l border-border lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(150deg, var(--accent) 0%, oklch(0.42 0.17 292) 55%, oklch(0.3 0.12 265) 100%)',
          }}
        />
        {/* Subtle grid, drawn with a repeating gradient so no asset is needed. */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="relative flex h-full flex-col justify-end p-12">
          <blockquote className="max-w-md space-y-4">
            <p className="text-2xl font-medium leading-snug text-white">
              Chaque demande suivie, assignée et résolue au même endroit.
            </p>
            <footer className="text-sm text-white/70">
              Support interne · {new Date().getFullYear()}
            </footer>
          </blockquote>
        </div>
      </aside>
    </div>
  )
}
