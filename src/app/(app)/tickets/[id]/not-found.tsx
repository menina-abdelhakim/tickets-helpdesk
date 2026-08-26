import Link from 'next/link'
import { Button, EmptyState } from '@/components/ui'

export default function TicketNotFound() {
  return (
    <div className="mx-auto max-w-lg py-12">
      <EmptyState
        title="Ticket introuvable"
        description="Ce ticket n’existe pas, ou il ne vous est pas accessible."
        action={
          <Link href="/tickets">
            <Button variant="primary">Retour aux tickets</Button>
          </Link>
        }
      />
    </div>
  )
}
