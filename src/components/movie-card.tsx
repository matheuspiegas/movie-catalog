import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getImageUrl } from "@/services/tmdb"

interface MovieCardProps {
  id: number
  title: string
  poster_path: string | null
  vote_average: number
  release_date?: string
  showYear?: boolean
}

export function MovieCard({
  id,
  title,
  poster_path,
  vote_average,
  release_date,
  showYear = true,
}: MovieCardProps) {
  return (
    <Link to={`/movie/${id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow pt-0 h-full flex flex-col">
        <CardHeader className="p-0">
          <img
            src={getImageUrl(poster_path, "w500")}
            alt={title}
            className="w-full h-auto aspect-2/3 object-cover"
          />
        </CardHeader>
        <CardContent className="pt-4 grow flex flex-col">
          <CardTitle className="line-clamp-2 text-base min-h-12">
            {title}
          </CardTitle>
          <CardDescription className="mt-2">
            {showYear && release_date && (
              <>{new Date(release_date).getFullYear()} • </>
            )}
            ⭐ {vote_average.toFixed(1)}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}
