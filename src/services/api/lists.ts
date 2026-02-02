import { apiClient } from "./client"

/**
 * Interface da lista conforme retornada pelo backend
 */
export interface List {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  userId: string
}

/**
 * Input para criar uma nova lista
 */
export interface CreateListInput {
  name: string
  description?: string
}

/**
 * Input para atualizar uma lista existente
 */
export interface UpdateListInput {
  name?: string
  description?: string
}

/**
 * Resposta do backend ao buscar listas
 */
interface GetListsResponse {
  lists: List[]
}

/**
 * Busca todas as listas do usuário autenticado
 */
async function getLists(token: string): Promise<List[]> {
  const response = await apiClient<GetListsResponse>("/lists", token, {
    method: "GET",
  })
  return response.lists
}

/**
 * Cria uma nova lista
 */
async function createList(token: string, input: CreateListInput): Promise<List> {
  return await apiClient<List>("/lists", token, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

/**
 * Atualiza uma lista existente
 */
async function updateList(
  token: string,
  id: string,
  input: UpdateListInput
): Promise<List> {
  return await apiClient<List>(`/lists/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

/**
 * Deleta uma lista
 */
async function deleteList(token: string, id: string): Promise<void> {
  await apiClient<void>(`/lists/${id}`, token, {
    method: "DELETE",
  })
}

/**
 * Service de listas - agrupa todas as operações
 */
export const apiListsService = {
  getLists,
  createList,
  updateList,
  deleteList,
}
