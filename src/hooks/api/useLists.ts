import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  apiListsService,
  type CreateListInput,
  type List,
  type UpdateListInput,
} from "@/services/api/lists"

/**
 * Query Keys Factory para listas da API
 */
export const apiListsKeys = {
  all: ["api", "lists"] as const,
  detail: (id: string) => ["api", "lists", id] as const,
}

/**
 * Hook para buscar todas as listas do usuário autenticado
 */
export function useApiLists() {
  return useQuery({
    queryKey: apiListsKeys.all,
    queryFn: async () => {
      return apiListsService.getLists()
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

/**
 * Hook para buscar lista em visualização
 */
export function useApiList(listId: string) {
  return useQuery({
    queryKey: apiListsKeys.detail(listId),
    queryFn: async () => {
      return apiListsService.getList(listId)
    },
    enabled: !!listId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

/**
 * Hook para criar uma nova lista
 */
export function useCreateApiList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateListInput) => {
      return apiListsService.createList(input)
    },
    onSuccess: () => {
      // Invalida o cache para recarregar a lista
      queryClient.invalidateQueries({ queryKey: apiListsKeys.all })
      toast.success("Lista criada com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar lista: ${error.message}`)
    },
  })
}

/**
 * Hook para atualizar uma lista existente
 */
export function useUpdateApiList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: UpdateListInput
    }) => {
      return apiListsService.updateList(id, input)
    },
    onSuccess: (list) => {
      queryClient.setQueryData(apiListsKeys.detail(list.id), list)
      queryClient.invalidateQueries({ queryKey: apiListsKeys.all })
      queryClient.invalidateQueries({ queryKey: apiListsKeys.detail(list.id) })
      toast.success("Lista atualizada com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar lista: ${error.message}`)
    },
  })
}

/**
 * Hook para deletar uma lista
 */
export function useDeleteApiList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return apiListsService.deleteList(id)
    },
    async onMutate(listId, context) {
      await context.client.cancelQueries({ queryKey: apiListsKeys.all })
      await context.client.cancelQueries({
        queryKey: apiListsKeys.detail(listId),
      })

      const previousLists = context.client.getQueryData<List[]>(
        apiListsKeys.all,
      )
      const previousList = context.client.getQueryData<List>(
        apiListsKeys.detail(listId),
      )

      context.client.setQueryData<List[]>(apiListsKeys.all, (current = []) => {
        return current.filter((list) => list.id !== listId)
      })

      context.client.setQueryData<List | undefined>(
        apiListsKeys.detail(listId),
        undefined,
      )

      return { previousLists, previousList }
    },
    onSettled: (_data, error, listId) => {
      queryClient.invalidateQueries({ queryKey: apiListsKeys.all })

      if (error) {
        queryClient.invalidateQueries({ queryKey: apiListsKeys.detail(listId) })
      }
    },
    onSuccess: (_data, listId) => {
      queryClient.removeQueries({ queryKey: apiListsKeys.detail(listId) })
      toast.success("Lista deletada com sucesso!")
    },
    onError: (error, listId, onMutateResult, context) => {
      toast.error(`Erro ao deletar lista: ${error.message}`)
      context.client.setQueryData(
        apiListsKeys.all,
        onMutateResult?.previousLists,
      )
      context.client.setQueryData(
        apiListsKeys.detail(listId),
        onMutateResult?.previousList,
      )
    },
  })
}
