"use client"

import { useUser } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Edit, Plus, Trash2, Users } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { InviteMemberDialog } from "@/components/invite-member-dialog"
import { ListMembersList } from "@/components/list-members-list"
import { ListDetailPageSkeleton } from "@/components/skeletons/list-detail-page-skeleton"
import { ListItemsSkeleton } from "@/components/skeletons/list-items-skeleton"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApiListItems, useRemoveApiListItem } from "@/hooks/api/useListItems"
import { useListMembers } from "@/hooks/api/useListMembers"
import {
  useApiList,
  useDeleteApiList,
  useUpdateApiList,
} from "@/hooks/api/useLists"

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

const editListSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
})

type EditListFormData = z.infer<typeof editListSchema>

const formatAddedAt = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("pt-BR").format(date)
}

export function ListPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useUser()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRemovingItemFromList, setIsRemovingItemFromList] = useState(false)
  const [itemToRemoveFromList, setItemToRemoveFromList] = useState<
    string | null
  >(null)

  // Queries
  const { data: list, isLoading: isLoadingList } = useApiList(id!)
  const { data: items, isLoading: isLoadingItems } = useApiListItems(id!)
  const { data: members } = useListMembers(id!)

  // Mutations
  const { mutate: updateList, isPending: isUpdating } = useUpdateApiList()
  const { mutate: deleteList, isPending: isDeleting } = useDeleteApiList()
  const { mutate: removeItem, isPending: isRemovingItem } =
    useRemoveApiListItem(id!)
  const currentUserMember = members?.find((m) => m.userId === user?.id)
  const isOwner = currentUserMember?.role === "owner"

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
      },
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
    setIsRemovingItemFromList(false)
    removeItem(itemId, {
      onSuccess: () => {
        setIsRemovingItemFromList(false)
        setItemToRemoveFromList(null)
      },
    })
  }

  if (isLoadingList || isDeleting) {
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
            {isOwner && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Tabs: Items and Members */}
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="items">
              Itens ({items?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              Membros ({members?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            {/* Items Count and Add Button */}
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
                {items.map((item) => {
                  const canRemoveItem = isOwner || item.addedBy === user?.id
                  const itemHref =
                    item.mediaType === "movie"
                      ? `/movie/${item.movieId}`
                      : `/tv/${item.movieId}`

                  return (
                    <Card
                      key={item.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow pt-0 h-full flex flex-col group relative"
                    >
                      <CardHeader className="p-0 relative">
                        <Link href={itemHref} className="block">
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
                        </Link>
                        <Button
                          size="icon"
                          variant="destructive"
                          className={`absolute top-2 right-2 transition-opacity shadow-lg ${
                            canRemoveItem
                              ? "md:opacity-0 md:group-hover:opacity-100"
                              : "opacity-50"
                          }`}
                          disabled={!canRemoveItem || isRemovingItem}
                          onClick={() => {
                            if (!canRemoveItem) {
                              return
                            }

                            setIsRemovingItemFromList(true)
                            setItemToRemoveFromList(item.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <Link href={itemHref} className="contents">
                        <CardContent className="pt-4 grow flex flex-col">
                          <CardTitle className="line-clamp-2 text-base min-h-12">
                            {item.movieTitle}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {item.movieReleaseDate && (
                              <>{item.movieReleaseDate.split("-")[0]} • </>
                            )}
                            {item.movieVoteAverage && (
                              <>⭐ {item.movieVoteAverage}</>
                            )}
                          </CardDescription>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Por {item.addedByName} •{" "}
                            {formatAddedAt(item.addedAt)}
                          </p>
                        </CardContent>
                      </Link>
                    </Card>
                  )
                })}
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
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Gerencie quem tem acesso a esta lista
              </p>
              {isOwner && <InviteMemberDialog listId={id!} />}
            </div>

            <ListMembersList listId={id!} isOwner={isOwner} />
          </TabsContent>
        </Tabs>
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
