import type { ComponentProps, ReactNode } from 'react'

/* ---------------------------------------------------------------- buttons */

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55'

const BUTTON_VARIANTS = {
  primary: 'bg-accent text-content-inverse hover:bg-accent-hover shadow-[var(--shadow-card)]',
  secondary: 'border border-border bg-surface text-content hover:bg-surface-hover',
  ghost: 'text-content-muted hover:bg-surface-hover hover:text-content',
  danger: 'border border-border bg-surface text-danger hover:bg-danger-soft',
} as const

const BUTTON_SIZES = {
  sm: 'h-8 px-3',
  md: 'h-10 px-4',
} as const

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  )
}

export type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof BUTTON_VARIANTS
  size?: keyof typeof BUTTON_SIZES
  /** Shows a spinner and blocks further clicks while an action is in flight. */
  loading?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ cards */

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] ${className}`}
      {...props}
    />
  )
}

export function CardHeader({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-content-subtle">
      {children}
    </div>
  )
}

/* ----------------------------------------------------------------- fields */

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-content">{label}</span>
      {children}
      {hint && <span className="block text-xs text-content-subtle">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-subtle transition-colors hover:border-border-strong focus:border-accent focus:outline-none'

/* ---------------------------------------------------------------- avatars */

/** Deterministic hue per person, so the same name always gets the same chip. */
function hueFor(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 360
  return hash
}

export function Avatar({
  name,
  size = 'md',
  highlighted = false,
}: {
  name: string
  size?: 'sm' | 'md'
  highlighted?: boolean
}) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const dimensions = size === 'sm' ? 'size-7 text-[0.65rem]' : 'size-9 text-xs'
  const hue = hueFor(name)

  return (
    <span
      aria-hidden="true"
      className={`flex ${dimensions} shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset`}
      style={
        highlighted
          ? { background: 'var(--accent)', color: 'var(--content-inverse)', boxShadow: 'none' }
          : {
              background: `oklch(0.92 0.05 ${hue})`,
              color: `oklch(0.38 0.12 ${hue})`,
            }
      }
    >
      {initials}
    </span>
  )
}

/* ------------------------------------------------------------ page header */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-content sm:text-2xl">{title}</h1>
        {description && <p className="text-sm text-content-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------ empty state */

export function EmptyState({
  title,
  description,
  action,
  testId,
}: {
  title: string
  description?: string
  action?: ReactNode
  testId?: string
}) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong px-6 py-14 text-center"
    >
      <p className="text-sm font-medium text-content">{title}</p>
      {description && <p className="max-w-sm text-sm text-content-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
