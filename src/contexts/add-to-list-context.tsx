import { createContext, useContext, useState, type ReactNode } from "react"
import { AddToListDialog } from "@/components/add-to-list-dialog"
import type { AddListItemInput } from "@/services/api/list-items"

interface AddToListContextType {
  openDialog: (movieData: AddListItemInput & { movieId: number }) => void
}

const AddToListContext = createContext<AddToListContextType | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useAddToList() {
  const context = useContext(AddToListContext)
  if (!context) {
    throw new Error("useAddToList must be used within AddToListProvider")
  }
  return context
}

interface AddToListProviderProps {
  children: ReactNode
}

export function AddToListProvider({ children }: AddToListProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [movieData, setMovieData] = useState<
    (AddListItemInput & { movieId: number }) | null
  >(null)

  const openDialog = (data: AddListItemInput & { movieId: number }) => {
    setMovieData(data)
    setIsOpen(true)
  }

  return (
    <AddToListContext.Provider value={{ openDialog }}>
      {children}
      {movieData && (
        <AddToListDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          movieData={movieData}
        />
      )}
    </AddToListContext.Provider>
  )
}
