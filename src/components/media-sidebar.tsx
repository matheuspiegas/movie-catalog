import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CircularRating } from "@/components/circular-rating"
import { WatchProviders } from "@/components/watch-providers"
import { Heart, Calendar, Clock, DollarSign, Tv } from "lucide-react"
import type {
  MovieDetails,
  TVShowDetails,
  CountryWatchProviders,
} from "@/services/tmdb"

interface MediaSidebarProps {
  media: MovieDetails | TVShowDetails
  mediaType: "movie" | "tv"
  watchProviders?: CountryWatchProviders
  onAddToList: () => void
}

export function MediaSidebar({
  media,
  mediaType,
  watchProviders,
  onAddToList,
}: MediaSidebarProps) {
  const isMovie = mediaType === "movie"
  const movie = isMovie ? (media as MovieDetails) : null
  const tvShow = !isMovie ? (media as TVShowDetails) : null

  return (
    <div className="lg:w-1/3 space-y-6">
      {/* Rating Card */}
      <div className="backdrop-blur-md bg-card/50 border border-border/50 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-center gap-6">
          <CircularRating rating={media.vote_average} size="lg" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-3">
              {media.vote_count.toLocaleString()} votos
            </p>
            <Button
              onClick={onAddToList}
              className="w-full transition-all hover:scale-105"
            >
              <Heart className="mr-2 h-4 w-4" />
              Adicionar à Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Gêneros Card */}
      <div className="backdrop-blur-md bg-card/50 border border-border/50 rounded-lg p-6 shadow-lg">
        <h3 className="text-sm font-semibold mb-3">Gêneros</h3>
        <div className="flex flex-wrap gap-2">
          {media.genres.map((genre) => (
            <Badge
              key={genre.id}
              variant="secondary"
              className="transition-all hover:scale-110 cursor-default"
            >
              {genre.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Info Rápida Card */}
      <div className="backdrop-blur-md bg-card/50 border border-border/50 rounded-lg p-6 shadow-lg space-y-3 text-sm">
        {isMovie && movie ? (
          <>
            <div className="flex items-center gap-3 transition-colors hover:text-primary">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span>
                <strong>Lançamento:</strong>{" "}
                {new Date(movie.release_date).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="flex items-center gap-3 transition-colors hover:text-primary">
              <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span>
                <strong>Duração:</strong> {movie.runtime} minutos
              </span>
            </div>
            {movie.budget > 0 && (
              <div className="flex items-center gap-3 transition-colors hover:text-primary">
                <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>
                  <strong>Orçamento:</strong> ${movie.budget.toLocaleString()}
                </span>
              </div>
            )}
            {movie.revenue > 0 && (
              <div className="flex items-center gap-3 transition-colors hover:text-primary">
                <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>
                  <strong>Receita:</strong> ${movie.revenue.toLocaleString()}
                </span>
              </div>
            )}
          </>
        ) : tvShow ? (
          <>
            <div className="flex items-center gap-3 transition-colors hover:text-primary">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span>
                <strong>Primeira Exibição:</strong>{" "}
                {new Date(tvShow.first_air_date).toLocaleDateString("pt-BR")}
              </span>
            </div>
            {tvShow.last_air_date && (
              <div className="flex items-center gap-3 transition-colors hover:text-primary">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>
                  <strong>Última Exibição:</strong>{" "}
                  {new Date(tvShow.last_air_date).toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 transition-colors hover:text-primary">
              <Tv className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span>
                <strong>Status:</strong> {tvShow.status}
              </span>
            </div>
            <div className="flex items-center gap-3 transition-colors hover:text-primary">
              <Tv className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span>
                <strong>Temporadas:</strong> {tvShow.number_of_seasons}
              </span>
            </div>
            <div className="flex items-center gap-3 transition-colors hover:text-primary">
              <Tv className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span>
                <strong>Episódios:</strong> {tvShow.number_of_episodes}
              </span>
            </div>
            {tvShow.episode_run_time.length > 0 && (
              <div className="flex items-center gap-3 transition-colors hover:text-primary">
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>
                  <strong>Duração dos Episódios:</strong>{" "}
                  {tvShow.episode_run_time.join(", ")} minutos
                </span>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Onde Assistir Card */}
      {watchProviders && (
        <div className="backdrop-blur-md bg-card/50 border border-border/50 rounded-lg p-6 shadow-lg space-y-4">
          <h3 className="text-lg font-semibold">Onde Assistir</h3>
          {watchProviders.flatrate && (
            <WatchProviders
              providers={watchProviders.flatrate}
              type="flatrate"
            />
          )}
          {watchProviders.rent && (
            <WatchProviders providers={watchProviders.rent} type="rent" />
          )}
          {watchProviders.buy && (
            <WatchProviders providers={watchProviders.buy} type="buy" />
          )}
        </div>
      )}
    </div>
  )
}
