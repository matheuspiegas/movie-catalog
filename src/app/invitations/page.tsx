import { LayoutContainer } from "@/components/layout-container"
import { PendingInvitationsList } from "@/components/pending-invitations-list"

export default function InvitationsPage() {
  return (
    <LayoutContainer>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Convites</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus convites para listas compartilhadas
          </p>
        </div>

        <PendingInvitationsList />
      </div>
    </LayoutContainer>
  )
}
