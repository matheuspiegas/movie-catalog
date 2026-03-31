import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  apiInvitationsService,
  type CreateInvitationInput,
} from "@/services/api/invitations"

export const apiInvitationsKeys = {
  all: ["api", "invitations"] as const,
  pending: () => ["api", "invitations", "pending"] as const,
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: apiInvitationsKeys.pending(),
    queryFn: async () => {
      return apiInvitationsService.getPendingInvitations()
    },
    staleTime: 1000 * 60, // 1 minuto
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateInvitationInput) => {
      return apiInvitationsService.createInvitation(input)
    },
    onSuccess: () => {
      toast.success("Convite enviado com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar convite: ${error.message}`)
    },
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      return apiInvitationsService.acceptInvitation(invitationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiInvitationsKeys.pending() })
      queryClient.invalidateQueries({ queryKey: ["api", "lists"] })
      toast.success("Convite aceito!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aceitar convite: ${error.message}`)
    },
  })
}

export function useRejectInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      return apiInvitationsService.rejectInvitation(invitationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiInvitationsKeys.pending() })
      toast.success("Convite recusado")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao recusar convite: ${error.message}`)
    },
  })
}
