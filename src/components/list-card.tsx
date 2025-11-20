import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Edit } from "lucide-react"
import type { List } from "@/services/lists"
import { useNavigate } from "react-router-dom"

interface ListCardProps {
  list: List
  onDelete?: (id: string) => void
  onEdit?: (list: List) => void
}

export function ListCard({ list, onDelete, onEdit }: ListCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/list/${list.id}`)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle
            className="text-lg font-semibold line-clamp-1 flex-1"
            onClick={handleClick}
          >
            {list.name}
          </CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(list)
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(list.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {list.description && (
          <p
            className="text-sm text-muted-foreground line-clamp-2"
            onClick={handleClick}
          >
            {list.description}
          </p>
        )}
      </CardHeader>
      <CardContent onClick={handleClick}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {list.items_count} {list.items_count === 1 ? "item" : "itens"}
          </span>
          <span className="text-xs text-muted-foreground">
            Criada em {new Date(list.created_at).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
