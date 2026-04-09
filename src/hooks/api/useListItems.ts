/**
 * Hooks TanStack Query para gerenciar itens de listas via API separada
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  type AddListItemInput,
  apiListItemsService,
  type ListItem,
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
  return useMutation({
    mutationFn: async (itemId: string) => {
      return apiListItemsService.removeListItem(listId, itemId)
    },
    // faz a remoção otimista do item da lista para melhor UX
    onMutate: async (variable, context) => {
      // cancela queries - porque?
      await context.client.cancelQueries({
        queryKey: apiListItemsKeys.all(listId),
      })

      // recupera itens anteriores - para caso precise fazer rollback
      const previousItems = context.client.getQueryData(
        apiListItemsKeys.all(listId),
      )

      // seta o estado dos cache - nesse caso removemos o item que queremos da lista.
      context.client.setQueryData(
        apiListItemsKeys.all(listId),
        (current: ListItem[]) => {
          return current?.filter((item) => {
            return item.id !== variable
          })
        },
      )

      // retorna os itens caso precise fazer rollback.
      return { previousItems }
    },
    // invalida os caches relacionados após a mutação, independentemente do sucesso ou falha (ele sempre roda, independente de sucesso ou falha)
    onSettled(_data, _error, _variables, _onMutateResult, context) {
      context?.client.invalidateQueries({
        queryKey: apiListItemsKeys.all(listId),
      })
    },
    onSuccess: () => {
      toast.success("Item removido da lista!")
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(`Erro ao remover item: ${error.message}`)
      context?.client.setQueryData(
        apiListItemsKeys.all(listId),
        onMutateResult?.previousItems,
      )
    },
  })
}
