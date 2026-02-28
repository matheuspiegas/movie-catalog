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

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase()
  const finalHeaders = new Headers(options.headers)
  const hasBody = options.body !== undefined

  if (hasBody && !finalHeaders.has("Content-Type") && method !== "GET") {
    finalHeaders.set("Content-Type", "application/json")
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: finalHeaders,
    credentials: options.credentials ?? "include",
  })

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get("content-type")
  const isJson = contentType?.includes("application/json")
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.error || "Erro na requisicao"

    throw new ApiError(message, response.status, data)
  }

  return data as T
}
