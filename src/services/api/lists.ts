import { apiRequest } from "./request"

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
async function getLists(): Promise<List[]> {
  const response = await apiRequest<GetListsResponse>("/lists", {
    method: "GET",
  })
  return response.lists
}

/**
 * Cria uma nova lista
 */
async function createList(input: CreateListInput): Promise<List> {
  const response = await apiRequest<{ list: List }>("/lists", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return response.list
}

/**
 * Atualiza uma lista existente
 */
async function updateList(
  id: string,
  input: UpdateListInput
): Promise<List> {
  const response = await apiRequest<{ list: List }>(`/lists/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
  return response.list
}

/**
 * Deleta uma lista
 */
async function deleteList(id: string): Promise<void> {
  await apiRequest<void>(`/lists/${id}`, {
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
