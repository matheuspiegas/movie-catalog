/**
 * Service para gerenciar itens de listas via API separada
 * Endpoints: /api/lists/:listId/items
 */

import { apiRequest } from "./request"

/**
 * Interface do item de lista retornado pela API
 * Nota: addedAt é string ISO (diferente do Netlify que usa Date)
 */
export interface ListItem {
  id: string
  listId: string
  movieId: number
  movieTitle: string
  moviePosterPath: string | null
  movieReleaseDate: string | null
  movieVoteAverage: string | null
  mediaType: string // "movie" | "tv"
  addedAt: string // ISO string
}

/**
 * Input para adicionar item à lista
 */
export interface AddListItemInput {
  movieId: number
  movieTitle: string
  moviePosterPath?: string | null
  movieReleaseDate?: string | null
  movieVoteAverage?: string | null
  mediaType: "movie" | "tv"
}

/**
 * Resposta da API ao buscar itens de uma lista
 */
interface GetListItemsResponse {
  items: ListItem[]
}

/**
 * Service de itens de lista
 */
export const apiListItemsService = {
  /**
   * Buscar todos os itens de uma lista
   * GET /api/lists/:listId/items
   */
  async getListItems(listId: string): Promise<ListItem[]> {
    const response = await apiRequest<GetListItemsResponse>(
      `/lists/${listId}/items`,
      {
        method: "GET",
      }
    )
    return response.items
  },

  /**
   * Adicionar item à lista
   * POST /api/lists/:listId/items
   */
  async addListItem(
    listId: string,
    input: AddListItemInput
  ): Promise<ListItem> {
    const response = await apiRequest<{ item: ListItem }>(
      `/lists/${listId}/items`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    )
    return response.item
  },

  /**
   * Remover item da lista
   * DELETE /api/lists/:listId/items/:itemId
   * Retorna 204 No Content
   */
  async removeListItem(listId: string, itemId: string): Promise<void> {
    await apiRequest<void>(`/lists/${listId}/items/${itemId}`, {
      method: "DELETE",
    })
  },
}
