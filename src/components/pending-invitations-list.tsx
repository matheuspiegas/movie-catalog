"use client"

import { InvitationCard } from "./invitation-card"
import { usePendingInvitations } from "@/hooks/api/useInvitations"

export function PendingInvitationsList() {
  const { data: invitations, isLoading, error } = usePendingInvitations()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Erro ao carregar convites: {error.message}
        </p>
      </div>
    )
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 p-8 text-center">
        <p className="text-muted-foreground">Você não tem convites pendentes</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation) => (
        <InvitationCard key={invitation.id} invitation={invitation} />
      ))}
    </div>
  )
}
