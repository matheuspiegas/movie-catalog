import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCreateApiList } from "@/hooks/api/useLists"
import { Loader2 } from "lucide-react"

const createListSchema = z.object({
  name: z
    .string()
    .min(1, "O nome da lista é obrigatório")
    .max(50, "O nome deve ter no máximo 50 caracteres"),
  description: z
    .string()
    .max(200, "A descrição deve ter no máximo 200 caracteres")
    .optional(),
})

type CreateListFormData = z.infer<typeof createListSchema>

interface CreateListDialogProps {
  children?: React.ReactNode
}

export function CreateListDialog({ children }: CreateListDialogProps) {
  const [open, setOpen] = useState(false)
  const { mutate: createList, isPending } = useCreateApiList()

  const form = useForm<CreateListFormData>({
    resolver: zodResolver(createListSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const onSubmit = (data: CreateListFormData) => {
    createList(data, {
      onSuccess: () => {
        setOpen(false)
        form.reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>Criar Lista</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Lista</DialogTitle>
          <DialogDescription>
            Crie uma lista personalizada para organizar seus filmes e séries.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Lista</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Quero assistir, Favoritos..."
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descreva sua lista..."
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Lista
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
