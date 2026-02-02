import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/clerk-react"
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
  const { getToken } = useAuth()

  return useQuery({
    queryKey: apiListsKeys.all,
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error("Não autenticado")
      return apiListsService.getLists(token)
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

/**
 * Hook para criar uma nova lista
 */
export function useCreateApiList() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateListInput) => {
      const token = await getToken()
      if (!token) throw new Error("Não autenticado")
      return apiListsService.createList(token, input)
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
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: UpdateListInput
    }) => {
      const token = await getToken()
      if (!token) throw new Error("Não autenticado")
      return apiListsService.updateList(token, id, input)
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
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      if (!token) throw new Error("Não autenticado")
      return apiListsService.deleteList(token, id)
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
