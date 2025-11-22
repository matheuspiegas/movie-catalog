/**
 * Utilitário para chamar Netlify Functions
 * A autenticação é feita automaticamente pelo Clerk via cookies/headers
 */

const isDev = import.meta.env.DEV
const API_URL = isDev
  ? "http://localhost:8888/.netlify/functions"
  : "/.netlify/functions"

/**
 * Erro customizado para functions do Netlify
 */
export class NetlifyFunctionError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = "NetlifyFunctionError"
    this.status = status
    this.data = data
  }
}

/**
 * Chama uma Netlify Function
 * A autenticação acontece automaticamente:
 * - Same-origin: via cookie __session
 * - Cross-origin: via header Authorization (Clerk gerencia)
 *
 * @param functionName Nome da function (ex: 'hello', 'lists')
 * @param options Opções adicionais da request
 * @returns Promise com a resposta parseada
 */
export async function callNetlifyFunction<T = unknown>(
  functionName: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_URL}/${functionName}`, {
      credentials: "include", // Importante: envia cookies automaticamente
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    // Se for 204 No Content, retorna void
    if (response.status === 204) {
      return undefined as T
    }

    const data = await response.json()

    if (!response.ok) {
      throw new NetlifyFunctionError(
        data.message || data.error || "Function error",
        response.status,
        data
      )
    }

    return data as T
  } catch (error) {
    if (error instanceof NetlifyFunctionError) {
      throw error
    }
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network error: Could not reach the server")
    }
    throw new Error("Unexpected error calling Netlify function")
  }
}
