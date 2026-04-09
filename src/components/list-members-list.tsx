"use client"

import { useUser } from "@clerk/nextjs"
import { Crown, Trash2, User } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useListMembers, useRemoveMember } from "@/hooks/api/useListMembers"

interface ListMembersListProps {
  listId: string
  isOwner: boolean
}

export function ListMembersList({ listId, isOwner }: ListMembersListProps) {
  const { user } = useUser()
  const { data: members, isLoading, error } = useListMembers(listId)
  const removeMemberMutation = useRemoveMember()
  const [memberToRemove, setMemberToRemove] = useState<{
    userId: string
    userName: string
  } | null>(null)

  const handleRemove = () => {
    if (!memberToRemove) {
      return
    }

    removeMemberMutation.mutate(
      { listId, memberId: memberToRemove.userId },
      {
        onSuccess: () => {
          setMemberToRemove(null)
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 rounded-lg border bg-card animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Erro ao carregar membros: {error.message}
        </p>
      </div>
    )
  }

  if (!members || members.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum membro nesta lista
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const isCurrentUser = member.userId === user?.id
        const canRemove = isOwner && member.role !== "owner" && !isCurrentUser

        return (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border bg-card p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {member.role === "owner" ? (
                  <Crown className="h-5 w-5 text-yellow-600" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {member.userName}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Você)
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {member.role === "owner" ? "Proprietário" : "Membro"}
                </p>
              </div>
            </div>

            {canRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setMemberToRemove({
                    userId: member.userId,
                    userName: member.userName,
                  })
                }
                disabled={removeMemberMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )
      })}
      <Dialog
        open={memberToRemove !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToRemove(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover
              {memberToRemove
                ? ` "${memberToRemove.userName}"`
                : " este membro"}
              ? Essa pessoa perdera o acesso a esta lista.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMemberToRemove(null)}
              disabled={removeMemberMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
