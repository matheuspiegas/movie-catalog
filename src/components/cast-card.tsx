import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { getImageUrl } from "@/services/tmdb"

interface CastCardProps {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export function CastCard({ id, name, character, profile_path }: CastCardProps) {
  return (
    <Link to={`/person/${id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow pt-0">
        <img
          src={getImageUrl(profile_path, "w500")}
          alt={name}
          className="w-full h-[250px] object-cover"
        />
        <CardContent className="p-3">
          <CardTitle className="text-sm line-clamp-1">{name}</CardTitle>
          <CardDescription className="text-xs line-clamp-1">
            {character}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}
