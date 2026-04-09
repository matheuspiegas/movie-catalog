"use client"

import { Button } from "@/components/ui/button"
import {
  useAcceptInvitation,
  useRejectInvitation,
} from "@/hooks/api/useInvitations"
import type { Invitation } from "@/services/api/invitations"

interface InvitationCardProps {
  invitation: Invitation
}

export function InvitationCard({ invitation }: InvitationCardProps) {
  const acceptMutation = useAcceptInvitation()
  const rejectMutation = useRejectInvitation()

  const handleAccept = () => {
    acceptMutation.mutate(invitation.id)
  }

  const handleReject = () => {
    rejectMutation.mutate(invitation.id)
  }

  const isLoading = acceptMutation.isPending || rejectMutation.isPending

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-lg">{invitation.listName}</h3>
          <p className="text-sm text-muted-foreground">
            Você foi convidado para participar desta lista
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            size="sm"
            className="flex-1"
          >
            {acceptMutation.isPending ? "Aceitando..." : "Aceitar"}
          </Button>
          <Button
            onClick={handleReject}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {rejectMutation.isPending ? "Recusando..." : "Recusar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
