import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiLists } from "@/hooks/api/useLists"
import { Check, Plus } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { AddListItemInput } from "@/services/api/list-items"
import { apiListItemsService } from "@/services/api/list-items"
import { useQueryClient } from "@tanstack/react-query"
import { apiListItemsKeys } from "@/hooks/api/useListItems"

interface AddToListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movieData: AddListItemInput & { movieId: number }
}

export function AddToListDialog({
  open,
  onOpenChange,
  movieData,
}: AddToListDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: lists, isLoading } = useApiLists()
  const [addingToListId, setAddingToListId] = useState<string | null>(null)
  const [successListId, setSuccessListId] = useState<string | null>(null)

  const handleAddToList = async (listId: string) => {
    setAddingToListId(listId)

    try {
      await apiListItemsService.addListItem(listId, movieData)

      // Invalida o cache da lista
      queryClient.invalidateQueries({ queryKey: apiListItemsKeys.all(listId) })

      // Mostra feedback de sucesso
      setSuccessListId(listId)
      setAddingToListId(null)

      // Fecha o dialog após um delay
      setTimeout(() => {
        onOpenChange(false)
        setSuccessListId(null)
      }, 800)
    } catch (error) {
      setAddingToListId(null)

      // Mostra erro se já existir na lista
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      if (
        errorMessage.includes("already in list") ||
        errorMessage.includes("409")
      ) {
        alert("Este filme/série já está nesta lista!")
      } else {
        alert("Erro ao adicionar à lista. Tente novamente.")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar à Lista</DialogTitle>
          <DialogDescription>
            Escolha uma lista para adicionar "{movieData.movieTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : lists && lists.length > 0 ? (
            <div className="space-y-2">
              {lists.map((list) => {
                const isAdding = addingToListId === list.id
                const isSuccess = successListId === list.id

                return (
                  <button
                    key={list.id}
                    onClick={() => handleAddToList(list.id)}
                    disabled={addingToListId !== null || successListId !== null}
                    className="w-full text-left p-4 rounded-lg border hover:bg-accent hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{list.name}</p>
                      {list.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {list.description}
                        </p>
                      )}
                    </div>
                    {isAdding && (
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    )}
                    {isSuccess && <Check className="h-5 w-5 text-green-500" />}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Você ainda não tem listas
              </p>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  router.push("/lists")
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Lista
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addingToListId !== null || successListId !== null}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
