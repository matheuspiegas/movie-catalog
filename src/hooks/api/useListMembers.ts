import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiListMembersService } from "@/services/api/list-members"

export const apiListMembersKeys = {
  all: ["api", "list-members"] as const,
  byList: (listId: string) => ["api", "list-members", listId] as const,
}

export function useListMembers(listId: string) {
  return useQuery({
    queryKey: apiListMembersKeys.byList(listId),
    queryFn: async () => {
      return apiListMembersService.getListMembers(listId)
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    enabled: !!listId,
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ listId, memberId }: { listId: string; memberId: string }) => {
      return apiListMembersService.removeMember(listId, memberId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: apiListMembersKeys.byList(variables.listId) 
      })
      toast.success("Membro removido com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover membro: ${error.message}`)
    },
  })
}
