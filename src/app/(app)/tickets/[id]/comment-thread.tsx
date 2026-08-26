'use client'

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { describeEvent, type WireEvent } from '@/components/event-line'
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

type TimelineItem =
  | { kind: 'comment'; at: number; comment: WireComment }
  | { kind: 'event'; at: number; event: WireEvent }

/** Comments and audit entries are one story; interleave them by time. */
function buildTimeline(comments: WireComment[], events: WireEvent[]): TimelineItem[] {
  return [
    ...comments.map<TimelineItem>((comment) => ({
      kind: 'comment',
      at: new Date(comment.createdAt).getTime(),
      comment,
    })),
    ...events.map<TimelineItem>((event) => ({
      kind: 'event',
      at: new Date(event.createdAt).getTime(),
      event,
    })),
  ].sort((a, b) => {
    if (a.at !== b.at) return a.at - b.at
    // Same timestamp: the event caused the discussion, so it comes first.
    // "X a ouvert le ticket" must never appear below the first reply.
    if (a.kind === b.kind) return 0
    return a.kind === 'event' ? -1 : 1
  })
}

export function CommentThread({
  ticketId,
  currentUserId,
  initialComments,
  initialEvents,
}: {
  ticketId: string
  currentUserId: string
  initialComments: WireComment[]
  initialEvents: WireEvent[]
}) {
  const [data, setData] = useState({ comments: initialComments, events: initialEvents })
  const [draft, setDraft] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  /*
   * A server action (assign, change status) revalidates the page, so the server
   * sends fresher props — but `useState` ignores props after mount, and the
   * timeline would sit stale until the next poll, up to ten seconds later.
   *
   * This is React's documented "adjust state when a prop changes" pattern:
   * comparing during render and re-rendering immediately, rather than an effect
   * that would paint the stale list first.
   */
  const serverSignature = `${initialComments.length}:${initialComments.at(-1)?.id ?? ''}:${initialEvents.length}:${initialEvents.at(-1)?.id ?? ''}`
  const [seenSignature, setSeenSignature] = useState(serverSignature)

  if (seenSignature !== serverSignature) {
    setSeenSignature(serverSignature)
    setData({ comments: initialComments, events: initialEvents })
  }

  const { comments, events } = data

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, { cache: 'no-store' })
      if (!res.ok) return
      const fresh = (await res.json()) as { comments: WireComment[]; events: WireEvent[] }
      setData({ comments: fresh.comments, events: fresh.events })
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

  const timeline = buildTimeline(comments, events)

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
        {timeline.map((item, index) => {
          const last = index === timeline.length - 1

          if (item.kind === 'event') {
            return (
              <li key={`e-${item.event.id}`} className="relative flex gap-3">
                {!last && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[13px] top-7 bottom-[-1rem] w-px bg-border"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted"
                >
                  <span className="size-1.5 rounded-full bg-content-subtle" />
                </span>
                <p
                  data-testid="timeline-event"
                  className="pt-1 text-xs text-content-muted"
                >
                  {describeEvent(item.event)}
                  <time
                    dateTime={item.event.createdAt}
                    className="ml-2 text-content-subtle"
                  >
                    {new Date(item.event.createdAt).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </time>
                </p>
              </li>
            )
          }

          const comment = item.comment
          const mine = comment.author.id === currentUserId
          const date = new Date(comment.createdAt)

          return (
            <li key={`c-${comment.id}`} className="relative flex gap-3">
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

        {timeline.length === 0 && (
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
