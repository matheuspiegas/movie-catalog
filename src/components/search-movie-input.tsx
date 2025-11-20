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

const searchSchema = z.object({
  query: z.string().optional(),
})

export function SearchMovieInput() {
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
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-4">
        {search ? `Resultados para "${search}"` : "Filmes Populares"}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="grow">
                <FormControl>
                  <Input placeholder="Buscar filmes..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Buscar</Button>
          {search && (
            <Button type="button" variant="outline" onClick={handleClear}>
              Limpar
            </Button>
          )}
        </form>
      </Form>
    </div>
  )
}
