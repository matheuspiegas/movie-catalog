import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/services/tmdb"
import { Heart } from "lucide-react"
import { useAddToList } from "@/contexts/add-to-list-context"

interface MovieCardProps {
  id: number
  title: string
  poster_path: string | null
  vote_average: number
  release_date?: string
  showYear?: boolean
  mediaType?: "movie" | "tv"
}

export function MovieCard({
  id,
  title,
  poster_path,
  vote_average,
  release_date,
  showYear = true,
  mediaType = "movie",
}: MovieCardProps) {
  const { openDialog } = useAddToList()

  const handleAddToList = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    openDialog({
      movieId: id,
      movieTitle: title,
      moviePosterPath: poster_path || undefined,
      movieReleaseDate: release_date,
      movieVoteAverage: vote_average.toString(),
      mediaType,
    })
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow pt-0 h-full flex flex-col group relative">
      <CardHeader className="p-0 relative">
        <Link href={`/${mediaType}/${id}`}>
          <img
            src={getImageUrl(poster_path, "w500")}
            alt={title}
            className="w-full h-auto aspect-2/3 object-cover"
          />
        </Link>
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"
          onClick={handleAddToList}
        >
          <Heart className="h-4 w-4" />
        </Button>
      </CardHeader>
      <Link href={`/${mediaType}/${id}`} className="contents">
        <CardContent className="pt-4 grow flex flex-col">
          <CardTitle className="line-clamp-2 text-base min-h-12">
            {title}
          </CardTitle>
          <CardDescription className="mt-2">
            {showYear && release_date && (
              <>{new Date(release_date).getFullYear()} • </>
            )}
            ⭐ {vote_average?.toFixed(1)}
          </CardDescription>
        </CardContent>
      </Link>
    </Card>
  )
}
