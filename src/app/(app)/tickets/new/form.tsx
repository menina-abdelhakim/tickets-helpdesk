'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { PRIORITY_LABELS } from '@/components/badges'
import { Button, Card, Field, inputClass } from '@/components/ui'
import { createTicket, type FormState } from '../actions'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

const PRIORITY_HINTS: Record<(typeof PRIORITIES)[number], string> = {
  LOW: 'Gênant mais contournable',
  MEDIUM: 'Ralentit le travail quotidien',
  HIGH: 'Bloque une partie de l’activité',
  URGENT: 'Interruption de service',
}

export function NewTicketForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createTicket, {})

  return (
    <Card>
      <form action={formAction} className="space-y-6 p-6">
        <Field label="Titre" hint="Une phrase qui résume le problème.">
          <input
            name="title"
            required
            minLength={5}
            maxLength={140}
            placeholder="Ex. : impossible de se connecter au VPN"
            className={inputClass}
          />
        </Field>

        <Field
          label="Description"
          hint="Ce que vous avez fait, ce qui était attendu, ce qui s’est passé."
        >
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={5000}
            rows={8}
            placeholder="Ajoutez les messages d’erreur exacts si vous en avez."
            className={`${inputClass} resize-y`}
          />
        </Field>

        <Field label="Priorité">
          <select name="priority" defaultValue="MEDIUM" className={inputClass}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]} — {PRIORITY_HINTS[priority]}
              </option>
            ))}
          </select>
        </Field>

        {state.error && (
          <p
            role="alert"
            data-testid="form-error"
            className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-border pt-5">
          <Button type="submit" variant="primary" loading={pending}>
            {pending ? 'Création…' : 'Créer le ticket'}
          </Button>
          <Link href="/tickets">
            <Button type="button" variant="ghost">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  )
}
