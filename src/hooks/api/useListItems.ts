/**
 * Hooks TanStack Query para gerenciar itens de listas via API separada
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  apiListItemsService,
  type AddListItemInput,
} from "@/services/api/list-items"
import { apiListsKeys } from "./useLists"

/**
 * Query Keys Factory para itens de lista da API
 */
export const apiListItemsKeys = {
  all: (listId: string) => ["api", "list-items", listId] as const,
}

/**
 * Hook para buscar todos os itens de uma lista
 */
export function useApiListItems(listId: string) {
  return useQuery({
    queryKey: apiListItemsKeys.all(listId),
    queryFn: async () => {
      return apiListItemsService.getListItems(listId)
    },
    enabled: !!listId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

/**
 * Hook para adicionar item à lista
 */
export function useAddApiListItem(listId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddListItemInput) => {
      return apiListItemsService.addListItem(listId, input)
    },
    onSuccess: () => {
      // Invalida o cache para recarregar os itens
      queryClient.invalidateQueries({ queryKey: apiListItemsKeys.all(listId) })
      toast.success("Item adicionado à lista!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar item: ${error.message}`)
    },
  })
}

/**
 * Hook para remover item da lista
 */
export function useRemoveApiListItem(listId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      return apiListItemsService.removeListItem(listId, itemId)
    },
    onSuccess: () => {
      // Invalida o cache dos itens da lista
      queryClient.invalidateQueries({ queryKey: apiListItemsKeys.all(listId) })
      // Também invalida o cache de listas (para atualizar contadores, se houver)
      queryClient.invalidateQueries({ queryKey: apiListsKeys.all })
      toast.success("Item removido da lista!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover item: ${error.message}`)
    },
  })
}
