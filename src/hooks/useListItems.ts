import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listItemsService, type AddListItemInput } from "@/services/list-items"

// Query key factory
export const listItemsKeys = {
  all: (listId: string) => ["list-items", listId] as const,
}

// Hook para buscar todos os itens de uma lista
export function useListItems(listId: string) {
  return useQuery({
    queryKey: listItemsKeys.all(listId),
    queryFn: () => listItemsService.getListItems(listId),
    enabled: !!listId,
  })
}

// Hook para adicionar item à lista
export function useAddListItem(listId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AddListItemInput) =>
      listItemsService.addListItem(listId, input),
    onSuccess: () => {
      // Invalida o cache para recarregar os itens
      queryClient.invalidateQueries({ queryKey: listItemsKeys.all(listId) })
    },
  })
}

// Hook para remover item da lista
export function useRemoveListItem(listId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) =>
      listItemsService.removeListItem(listId, itemId),
    onSuccess: () => {
      // Invalida o cache para recarregar os itens
      queryClient.invalidateQueries({ queryKey: listItemsKeys.all(listId) })
    },
    onError: (error) => {
      console.error("Error removing item:", error)
    },
  })
}
