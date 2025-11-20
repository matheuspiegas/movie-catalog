import { useLists, useDeleteList } from "@/hooks/useLists"
import { ListCard } from "@/components/list-card"
import { EmptyListsState } from "@/components/empty-lists-state"
import { CreateListDialog } from "@/components/create-list-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ListPlus } from "lucide-react"
import type { List } from "@/services/lists"

export function ListsPage() {
  const { data: lists, isLoading, isError, error } = useLists()
  const { mutate: deleteList } = useDeleteList()

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta lista?")) {
      deleteList(id)
    }
  }

  const handleEdit = (list: List) => {
    // TODO: Implementar dialog de edição
    console.log("Editar lista:", list)
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[150px] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg text-destructive mb-2">
              Erro ao carregar listas
            </p>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
          </div>
        </div>
      </div>
    )
  }

  const hasLists = lists && lists.length > 0

  return (
    <div className="container py-8">
      {hasLists ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Minhas Listas</h1>
              <p className="text-muted-foreground">
                Gerencie suas coleções personalizadas de filmes e séries
              </p>
            </div>
            <CreateListDialog>
              <Button>
                <ListPlus className="mr-2 h-4 w-4" />
                Nova Lista
              </Button>
            </CreateListDialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {lists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyListsState />
      )}
    </div>
  )
}
