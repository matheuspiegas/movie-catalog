import { ListPlus } from "lucide-react"
import { CreateListDialog } from "./create-list-dialog"
import { Button } from "./ui/button"

export function EmptyListsState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="mb-6 rounded-full bg-muted p-6">
        <ListPlus className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">
        Você não possui nenhuma lista!
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Crie listas personalizadas para organizar seus filmes e séries
        favoritos.
      </p>
      <CreateListDialog>
        <Button size="lg">
          <ListPlus className="mr-2 h-5 w-5" />
          Criar Primeira Lista
        </Button>
      </CreateListDialog>
    </div>
  )
}
