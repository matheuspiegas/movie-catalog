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
import { useNavigate } from "react-router-dom"
import { useQueryState } from "nuqs"

const searchSchema = z.object({
  query: z.string().optional(),
})

export function GlobalSearchInput() {
  const navigate = useNavigate()
  const [query] = useQueryState("query")

  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: query || "",
    },
  })

  function onSubmit(data: z.infer<typeof searchSchema>) {
    if (!data.query || data.query.trim() === "") {
      return
    }
    navigate(`/search?query=${encodeURIComponent(data.query.trim())}`)
  }

  function handleClear() {
    form.reset({ query: "" })
    navigate("/")
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
