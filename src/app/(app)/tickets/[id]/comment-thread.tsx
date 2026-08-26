'use client'

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { SendIcon } from '@/components/icons'
import { Avatar, Button } from '@/components/ui'
import { addComment, type CommentFormState } from '../actions'

export type WireComment = {
  id: string
  body: string
  createdAt: string
  author: { id: string; name: string }
}

const POLL_INTERVAL_MS = 10_000

export function CommentThread({
  ticketId,
  currentUserId,
  initialComments,
}: {
  ticketId: string
  currentUserId: string
  initialComments: WireComment[]
}) {
  const [comments, setComments] = useState(initialComments)
  const [draft, setDraft] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as { comments: WireComment[] }
      setComments(data.comments)
    } catch {
      // A failed poll is not worth surfacing: the next tick will retry.
    }
  }, [ticketId])

  // Refreshing inside the action — rather than in an effect watching the result —
  // keeps the state update in an event, avoiding a cascading render.
  const [state, formAction, pending] = useActionState<CommentFormState, FormData>(
    async (previous, formData) => {
      const result = await addComment(previous, formData)
      if (result.ok) {
        setDraft('')
        await refresh()
      }
      return result
    },
    {},
  )

  // Poll for new messages. Skipped while the tab is hidden so a backgrounded
  // page does not keep hitting the server, and refreshed once on return.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const timer = setInterval(tick, POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [refresh])

  // Ctrl/Cmd + Enter sends, the way every messaging tool behaves.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && draft.trim()) {
      event.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-content">
        Discussion
        <span
          data-testid="comment-count"
          className="rounded-md bg-surface-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-content-muted"
        >
          ({comments.length})
        </span>
      </h2>

      <ul data-testid="comment-list" className="space-y-4">
        {comments.map((comment, index) => {
          const mine = comment.author.id === currentUserId
          const last = index === comments.length - 1
          const date = new Date(comment.createdAt)

          return (
            <li key={comment.id} className="relative flex gap-3">
              {/* Timeline rail, stopping at the last entry. */}
              {!last && (
                <span
                  aria-hidden="true"
                  className="absolute left-[13px] top-9 bottom-[-1rem] w-px bg-border"
                />
              )}

              <Avatar name={comment.author.name} size="sm" highlighted={mine} />

              <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-medium text-content">{comment.author.name}</span>
                  {mine && (
                    <span className="rounded bg-accent-soft px-1.5 text-[0.65rem] font-medium text-accent">
                      vous
                    </span>
                  )}
                  <time
                    dateTime={comment.createdAt}
                    title={date.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
                    className="text-xs text-content-subtle"
                  >
                    {date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </div>
                <p className="mt-1.5 max-w-[68ch] whitespace-pre-wrap text-sm leading-relaxed text-content">
                  {comment.body}
                </p>
              </div>
            </li>
          )
        })}

        {comments.length === 0 && (
          <li className="rounded-xl border border-dashed border-border-strong px-6 py-10 text-center text-sm text-content-muted">
            Aucun message pour l’instant. Lancez la discussion ci-dessous.
          </li>
        )}
      </ul>

      <form
        ref={formRef}
        action={formAction}
        className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition-colors focus-within:border-border-strong"
      >
        <input type="hidden" name="ticketId" value={ticketId} />
        <label className="block">
          <span className="sr-only">Votre message</span>
          <textarea
            name="body"
            required
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Répondre…"
            data-testid="comment-input"
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-subtle transition-colors hover:border-border-strong focus:border-accent focus:outline-none"
          />
        </label>

        {state.error && (
          <p role="alert" data-testid="comment-error" className="text-sm text-danger">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-content-subtle">
            <kbd className="rounded border border-border bg-surface-muted px-1 py-0.5 font-sans text-[0.65rem]">
              Ctrl
            </kbd>
            {' + '}
            <kbd className="rounded border border-border bg-surface-muted px-1 py-0.5 font-sans text-[0.65rem]">
              Entrée
            </kbd>{' '}
            pour envoyer · les nouveaux messages apparaissent automatiquement
          </p>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={pending}
            disabled={!draft.trim()}
          >
            {!pending && <SendIcon />}
            {pending ? 'Envoi…' : 'Envoyer'}
          </Button>
        </div>
      </form>
    </section>
  )
}
