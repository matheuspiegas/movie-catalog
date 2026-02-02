/**
 * Service para gerenciar itens de listas via API separada
 * Endpoints: /api/lists/:listId/items
 */

import { apiClient } from "./client"

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
  async getListItems(token: string, listId: string): Promise<ListItem[]> {
    const response = await apiClient<GetListItemsResponse>(
      `/lists/${listId}/items`,
      token,
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
    token: string,
    listId: string,
    input: AddListItemInput
  ): Promise<ListItem> {
    return await apiClient<ListItem>(
      `/lists/${listId}/items`,
      token,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    )
  },

  /**
   * Remover item da lista
   * DELETE /api/lists/:listId/items/:itemId
   * Retorna 204 No Content
   */
  async removeListItem(
    token: string,
    listId: string,
    itemId: string
  ): Promise<void> {
    await apiClient<void>(
      `/lists/${listId}/items/${itemId}`,
      token,
      {
        method: "DELETE",
      }
    )
  },
}
