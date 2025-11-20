// Serviço de listas - versão mockada
// Substitua por integração real com Supabase quando tiver as credenciais

export interface List {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  user_id: string
  items_count: number
}

export interface CreateListInput {
  name: string
  description?: string
}

export interface UpdateListInput {
  name?: string
  description?: string
}

// Simulação de dados mockados
let mockLists: List[] = []

// Simula delay de rede
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const listsService = {
  // Buscar todas as listas do usuário
  async getLists(): Promise<List[]> {
    await delay(800)
    return [...mockLists]
  },

  // Buscar lista por ID
  async getListById(id: string): Promise<List | null> {
    await delay(500)
    return mockLists.find((list) => list.id === id) || null
  },

  // Criar nova lista
  async createList(input: CreateListInput): Promise<List> {
    await delay(600)
    const newList: List = {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "mock-user-id",
      items_count: 0,
    }
    mockLists.push(newList)
    return newList
  },

  // Atualizar lista
  async updateList(id: string, input: UpdateListInput): Promise<List> {
    await delay(600)
    const index = mockLists.findIndex((list) => list.id === id)
    if (index === -1) {
      throw new Error("Lista não encontrada")
    }
    mockLists[index] = {
      ...mockLists[index],
      ...input,
      updated_at: new Date().toISOString(),
    }
    return mockLists[index]
  },

  // Deletar lista
  async deleteList(id: string): Promise<void> {
    await delay(500)
    mockLists = mockLists.filter((list) => list.id !== id)
  },
}
