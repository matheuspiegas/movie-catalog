import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@clerk/clerk-react"
import { callNetlifyFunction } from "@/lib/netlify"

interface HelloResponse {
  message: string
  userId: string
  timestamp: string
}

/**
 * Hook para testar a autenticação com Netlify Functions
 * A autenticação acontece automaticamente via cookies/headers do Clerk
 * Não é necessário passar token manualmente!
 */
export function useHelloFunction() {
  const { isSignedIn } = useAuth()
  return useQuery({
    queryKey: ["hello-function"],
    queryFn: () => callNetlifyFunction<HelloResponse>("hello"),
    enabled: isSignedIn,
    retry: false,
  })
}
