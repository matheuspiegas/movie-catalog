import { callNetlifyFunction } from "../lib/netlify"

export interface ListItem {
  id: string
  listId: string
  movieId: number
  movieTitle: string
  moviePosterPath: string | null
  movieReleaseDate: string | null
  movieVoteAverage: string | null
  mediaType: "movie" | "tv"
  addedAt: Date
}

export interface AddListItemInput {
  movieId: number
  movieTitle: string
  moviePosterPath?: string
  movieReleaseDate?: string
  movieVoteAverage?: string
  mediaType: "movie" | "tv"
}

export const listItemsService = {
  // Buscar todos os itens de uma lista
  async getListItems(listId: string): Promise<ListItem[]> {
    return await callNetlifyFunction<ListItem[]>(`list-items/${listId}`, {
      method: "GET",
    })
  },

  // Adicionar item à lista
  async addListItem(
    listId: string,
    input: AddListItemInput
  ): Promise<ListItem> {
    console.log("Adding list item via service:", listId, input) // Debug log
    return await callNetlifyFunction<ListItem>(`list-items/${listId}`, {
      method: "POST",
      body: JSON.stringify({
        ...input,
        listId,
      }),
    })
  },

  // Remover item da lista
  async removeListItem(listId: string, itemId: string): Promise<void> {
    await callNetlifyFunction(`list-items/${listId}/${itemId}`, {
      method: "DELETE",
    })
  },
}
