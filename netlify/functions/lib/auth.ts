import { createClerkClient } from "@clerk/backend"
import type { Context } from "@netlify/functions"

export interface AuthenticatedRequest extends Request {
  userId: string
}

/**
 * Autentica uma requisição usando Clerk JWT
 * Busca token automaticamente de cookies ou headers
 * @param request Request object do Netlify
 * @returns userId se autenticado, null caso contrário
 */
export async function authenticate(
  request: Request
): Promise<{ userId: string } | null> {
  try {
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
      publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY!,
    })
    const isAuthenticated = await clerkClient.authenticateRequest(request, {
      authorizedParties: [
        "http://localhost:8888",
        "https://moviecatalog.com.br",
        "https://www.moviecatalog.com.br",
        "https://catalogmovieapp.netlify.app",
      ],
    })
    if (!isAuthenticated) {
      return null
    }
    const auth = isAuthenticated.toAuth()
    if (!auth?.userId) {
      return null
    }

    return { userId: auth.userId }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

/**
 * HOC para proteger functions com autenticação
 * @param handler Function handler que requer autenticação
 * @returns Protected handler
 */
export function requireAuth(
  handler: (req: AuthenticatedRequest, context: Context) => Promise<Response>
) {
  return async (req: Request, context: Context): Promise<Response> => {
    const auth = await authenticate(req)

    if (!auth) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Valid authentication required",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    // Adiciona userId ao request
    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.userId = auth.userId

    return handler(authenticatedReq, context)
  }
}

/**
 * Headers CORS padrão para as functions
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Content-Type": "application/json",
}

/**
 * Handler para CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }
  return null
}
