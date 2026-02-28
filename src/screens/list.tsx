"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ListDetailPageSkeleton } from "@/components/skeletons/list-detail-page-skeleton"
import { ListItemsSkeleton } from "@/components/skeletons/list-items-skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useParams, useRouter } from "next/navigation"
import { useApiListItems, useRemoveApiListItem } from "@/hooks/api/useListItems"
import { useApiLists, useUpdateApiList, useDeleteApiList } from "@/hooks/api/useLists"
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

const editListSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
})

type EditListFormData = z.infer<typeof editListSchema>

export function ListPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRemovingItemFromList, setIsRemovingItemFromList] = useState(false)
  const [itemToRemoveFromList, setItemToRemoveFromList] = useState<
    string | null
  >(null)

  // Queries
  const { data: lists, isLoading: isLoadingLists } = useApiLists()
  const { data: items, isLoading: isLoadingItems } = useApiListItems(id!)

  // Mutations
  const { mutate: updateList, isPending: isUpdating } = useUpdateApiList()
  const { mutate: deleteList, isPending: isDeleting } = useDeleteApiList()
  const { mutate: removeItem, isPending: isRemovingItem } = useRemoveApiListItem(
    id!
  )

  const list = lists?.find((l) => l.id === id)

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditListFormData>({
    resolver: zodResolver(editListSchema),
    values: list
      ? {
          name: list.name,
          description: list.description || "",
        }
      : undefined,
  })

  const onSubmitEdit = (data: EditListFormData) => {
    updateList(
      { id: id!, input: data },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false)
          reset()
        },
      }
    )
  }

  const handleDelete = () => {
    deleteList(id!, {
      onSuccess: () => {
        router.push("/lists")
      },
    })
  }

  const handleRemoveItem = (itemId: string | null) => {
    if (!itemId) return
    removeItem(itemId, {
      onSuccess: () => {
        setIsRemovingItemFromList(false)
        setItemToRemoveFromList(null)
      },
    })
  }

  if (isLoadingLists) {
    return <ListDetailPageSkeleton />
  }

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold mb-4">Lista não encontrada</h2>
        <Button onClick={() => router.push("/lists")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Minhas Listas
        </Button>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{list.name}</h1>
            </div>
            {list.description && (
              <p className="text-muted-foreground ">{list.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Items Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {items?.length || 0} {items?.length === 1 ? "item" : "itens"}
          </p>
          <Button size="sm" onClick={() => router.push("/")}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Filmes/Séries
          </Button>
        </div>

        {/* Items Grid */}
        {isLoadingItems ? (
          <ListItemsSkeleton />
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {items.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-shadow pt-0 h-full flex flex-col group relative"
              >
                <CardHeader className="p-0 relative">
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        item.mediaType === "movie"
                          ? `/movie/${item.movieId}`
                          : `/tv/${item.movieId}`
                      )
                    }
                  >
                    {item.moviePosterPath ? (
                      <img
                        src={`${IMAGE_BASE_URL}${item.moviePosterPath}`}
                        alt={item.movieTitle}
                        className="w-full h-auto aspect-2/3 object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-2/3 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          Sem imagem
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={() => {
                      setIsRemovingItemFromList(true)
                      setItemToRemoveFromList(item.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <div
                  className="contents cursor-pointer"
                  onClick={() =>
                  router.push(
                    item.mediaType === "movie"
                      ? `/movie/${item.movieId}`
                      : `/tv/${item.movieId}`
                  )
                  }
                >
                  <CardContent className="pt-4 grow flex flex-col">
                    <CardTitle className="line-clamp-2 text-base min-h-12">
                      {item.movieTitle}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {item.movieReleaseDate && (
                        <>{item.movieReleaseDate.split("-")[0]} • </>
                      )}
                      {item.movieVoteAverage && <>⭐ {item.movieVoteAverage}</>}
                    </CardDescription>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
            <Plus className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Lista vazia</h3>
            <p className="text-muted-foreground mb-6">
              Adicione filmes e séries à sua lista
            </p>
            <Button onClick={() => router.push("/")}>
              <Plus className="mr-2 h-4 w-4" />
              Buscar Filmes/Séries
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lista</DialogTitle>
            <DialogDescription>
              Altere o nome e a descrição da sua lista
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Lista</Label>
                <Input
                  id="name"
                  placeholder="Ex: Meus Favoritos"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  placeholder="Ex: Filmes que quero assistir em breve"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Lista</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar "{list.name}"? Todos os itens serão
              removidos e essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deletando..." : "Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove movie from list dialog */}
      <Dialog
        open={isRemovingItemFromList}
        onOpenChange={setIsRemovingItemFromList}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover item da lista?</DialogTitle>
            <DialogDescription>
              Deseja realmente remover este item da lista "{list.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemovingItemFromList(false)}
              disabled={isRemovingItem}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRemoveItem(itemToRemoveFromList)}
              disabled={isRemovingItem}
            >
              {isRemovingItem ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
