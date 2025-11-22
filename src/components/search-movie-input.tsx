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
import { useQueryState } from "nuqs"
import { Search, X } from "lucide-react"

const searchSchema = z.object({
  query: z.string().optional(),
})

interface SearchMovieInputProps {
  placeholder?: string
  title?: string
}

export function SearchMovieInput({
  placeholder = "Buscar filmes...",
  title = "Filmes Populares",
}: SearchMovieInputProps) {
  const [search, setSearch] = useQueryState("search")

  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: search || "",
    },
  })

  function onSubmit(data: z.infer<typeof searchSchema>) {
    if (!data.query || data.query.trim() === "") {
      setSearch(null) // Remove o parâmetro da URL
      return
    }
    setSearch(data.query.trim())
  }

  function handleClear() {
    setSearch(null)
    form.reset({ query: "" })
  }

  return (
    <div className="mb-12">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {search ? `Resultados para "${search}"` : title}
      </h1>
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
                      placeholder={placeholder}
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
            {search && (
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
    </div>
  )
}
