import { PageHeader } from '@/components/ui'
import { NewTicketForm } from './form'

export const metadata = { title: 'Nouveau ticket' }

export default function NewTicketPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Nouveau ticket"
        description="Décrivez votre problème avec précision : un agent le prendra en charge."
      />
      <NewTicketForm />
    </div>
  )
}
