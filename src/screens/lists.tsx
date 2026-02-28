"use client"

import { useApiLists } from "@/hooks/api/useLists"
import { ListCard } from "@/components/list-card"
import { EmptyListsState } from "@/components/empty-lists-state"
import { CreateListDialog } from "@/components/create-list-dialog"
import { Button } from "@/components/ui/button"
import { ListsPageSkeleton } from "@/components/skeletons/lists-page-skeleton"
import { ListPlus, LogIn } from "lucide-react"
import { useUser, SignInButton } from "@clerk/nextjs"

export function ListsPage() {
  const { user, isLoaded } = useUser()
  const { data: lists, isLoading, isError, error } = useApiLists()

  // Aguardar carregamento do Clerk
  if (!isLoaded || isLoading) {
    return <ListsPageSkeleton />
  }

  // Usuário não autenticado
  if (!user) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ListPlus className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Crie suas listas personalizadas
              </h2>
              <p className="text-muted-foreground">
                Para criar listas você deve criar ou entrar em uma conta.
              </p>
            </div>
            <SignInButton mode="modal">
              <Button size="lg">
                <LogIn className="mr-2 h-5 w-5" />
                Fazer Login
              </Button>
            </SignInButton>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-8">
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
    <div className="py-8">
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
              <ListCard key={list.id} list={list} />
            ))}
          </div>
        </>
      ) : (
        <EmptyListsState />
      )}
    </div>
  )
}
