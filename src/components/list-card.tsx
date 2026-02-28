import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { List } from "@/services/api/lists"
import Link from "next/link"

interface ListCardProps {
  list: List
}

export function ListCard({ list }: ListCardProps) {
  return (
    <Link href={`/list/${list.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader className="min-h-18">
          <div className="flex flex-col gap-3 items-start justify-between">
            <CardTitle className="text-lg font-semibold line-clamp-1 flex-1">
              {list.name}
            </CardTitle>
            <CardDescription>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {list.description}
              </p>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-xs text-muted-foreground">
              Criada em {new Date(list.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
