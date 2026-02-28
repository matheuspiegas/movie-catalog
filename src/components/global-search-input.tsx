import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "./ui/button"
import { Search, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useQueryState } from "nuqs"
import { useEffect } from "react"

const searchSchema = z.object({
  query: z.string().optional(),
})

export function GlobalSearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useQueryState("query")

  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: query || "",
    },
  })

  // Sincronizar o formulário quando a query mudar
  useEffect(() => {
    form.reset({ query: query || "" })
  }, [query, form])

  function onSubmit(data: z.infer<typeof searchSchema>) {
    if (!data.query || data.query.trim() === "") {
      return
    }
    const searchQuery = data.query.trim()

    // Se já estiver na página de busca, apenas atualiza a query
    if (pathname === "/search") {
      setQuery(searchQuery)
    } else {
      // Se não, navega para a página de busca
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`)
    }
  }

  function handleClear() {
    form.reset({ query: "" })
    router.push("/")
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="grow">
                <FormControl>
                  <Input
                    placeholder="Buscar filmes e séries..."
                    {...field}
                    className="h-12 text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="icon" className="h-12 w-12">
            <Search className="h-5 w-5" />
          </Button>
          {query && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleClear}
              className="h-12 w-12"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </form>
      </Form>
    </div>
  )
}
