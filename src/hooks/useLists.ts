import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  listsService,
  type CreateListInput,
  type UpdateListInput,
} from "@/services/lists"

// Query key factory
export const listsKeys = {
  all: ["lists"] as const,
  detail: (id: string) => ["lists", id] as const,
}

// Hook para buscar todas as listas
export function useLists() {
  return useQuery({
    queryKey: listsKeys.all,
    queryFn: () => listsService.getLists(),
  })
}

// Hook para buscar uma lista específica
export function useList(id: string) {
  return useQuery({
    queryKey: listsKeys.detail(id),
    queryFn: () => listsService.getListById(id),
    enabled: !!id,
  })
}

// Hook para criar lista
export function useCreateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateListInput) => listsService.createList(input),
    onSuccess: () => {
      // Invalida o cache para recarregar a lista
      queryClient.invalidateQueries({ queryKey: listsKeys.all })
    },
  })
}

// Hook para atualizar lista
export function useUpdateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateListInput }) =>
      listsService.updateList(id, input),
    onSuccess: (data) => {
      // Invalida tanto a lista geral quanto o detalhe da lista
      queryClient.invalidateQueries({ queryKey: listsKeys.all })
      queryClient.invalidateQueries({ queryKey: listsKeys.detail(data.id) })
    },
  })
}

// Hook para deletar lista
export function useDeleteList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => listsService.deleteList(id),
    onSuccess: () => {
      // Invalida o cache para recarregar a lista
      queryClient.invalidateQueries({ queryKey: listsKeys.all })
    },
  })
}
