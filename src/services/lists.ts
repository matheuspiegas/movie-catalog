import { callNetlifyFunction } from "../lib/netlify"

export interface List {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface CreateListInput {
  name: string
  description?: string
}

export interface UpdateListInput {
  name?: string
  description?: string
}

export const listsService = {
  // Buscar todas as listas do usuário
  async getLists(): Promise<List[]> {
    return await callNetlifyFunction<List[]>("lists", {
      method: "GET",
    })
  },

  // Criar nova lista
  async createList(input: CreateListInput): Promise<List> {
    return await callNetlifyFunction<List>("lists", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  // Atualizar lista
  async updateList(id: string, input: UpdateListInput): Promise<List> {
    return await callNetlifyFunction<List>(`lists/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  },

  // Deletar lista
  async deleteList(id: string): Promise<void> {
    await callNetlifyFunction(`lists/${id}`, {
      method: "DELETE",
    })
  },
}
