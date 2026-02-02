/**
 * Cliente HTTP genérico para a API separada
 * Usa Clerk para autenticação via Bearer token
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"

/**
 * Erro customizado para requisições da API
 */
export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

/**
 * Cliente HTTP para fazer requisições autenticadas à API
 * 
 * @param endpoint - Endpoint da API (ex: '/lists', '/lists/123')
 * @param token - Token de autenticação do Clerk
 * @param options - Opções adicionais da requisição
 * @returns Promise com a resposta parseada
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    
    // Construir headers base
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }
    
    // Adicionar Content-Type apenas se não for DELETE
    const method = (options.method || "GET").toUpperCase()
    if (method !== "DELETE") {
      headers["Content-Type"] = "application/json"
    }
    
    // Mesclar com headers customizados
    const finalHeaders = {
      ...headers,
      ...(options.headers as Record<string, string>),
    }
    
    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
    })

    // Se for 204 No Content, retorna void
    if (response.status === 204) {
      return undefined as T
    }

    // Tenta fazer parse do JSON
    const data = await response.json()

    // Se a resposta não for ok, lança erro
    if (!response.ok) {
      throw new ApiError(
        data.message || data.error || "Erro na requisição",
        response.status,
        data
      )
    }

    return data as T
  } catch (error) {
    // Se já é um ApiError, repassa
    if (error instanceof ApiError) {
      throw error
    }
    
    // Erro de rede
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError("Erro de conexão: Não foi possível alcançar o servidor", 0)
    }
    
    // Outros erros
    throw new ApiError("Erro inesperado na requisição", 0)
  }
}
