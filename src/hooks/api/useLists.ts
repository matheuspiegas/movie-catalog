import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  apiListsService,
  type CreateListInput,
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
    onSuccess: () => {
      // Invalida o cache para refletir as mudanças
      queryClient.invalidateQueries({ queryKey: apiListsKeys.all })
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
    onSuccess: () => {
      // Invalida o cache para remover a lista deletada
      queryClient.invalidateQueries({ queryKey: apiListsKeys.all })
      toast.success("Lista deletada com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar lista: ${error.message}`)
    },
  })
}
