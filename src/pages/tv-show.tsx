import { useParams } from "react-router-dom"
import {
  useTVShowDetails,
  useTVShowCredits,
  useTVShowRecommendations,
} from "@/hooks/useMovies"
import { getImageUrl } from "@/services/tmdb"
import { CastCard } from "@/components/cast-card"
import { RecommendationsCarousel } from "@/components/recommendations-carousel"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useAddToList } from "@/contexts/add-to-list-context"

export function TVShowPage() {
  const { id } = useParams()
  const tvId = Number(id)
  const { openDialog } = useAddToList()

  const {
    data: tvShow,
    isLoading: loadingTV,
    isError: errorTV,
  } = useTVShowDetails(tvId)
  const { data: credits, isLoading: loadingCredits } = useTVShowCredits(tvId)
  const { data: recommendations, isLoading: loadingRecs } =
    useTVShowRecommendations(tvId)

  if (loadingTV) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-muted-foreground">
          Carregando detalhes da série...
        </p>
      </div>
    )
  }

  if (errorTV || !tvShow) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg text-destructive mb-2">
            Erro ao carregar série
          </p>
          <p className="text-sm text-muted-foreground">Série não encontrada</p>
        </div>
      </div>
    )
  }

  const cast = credits?.cast.slice(0, 12) || []
  const recommendedShows = recommendations?.results || []

  return (
    <div>
      {/* Backdrop */}
      {tvShow.backdrop_path && (
        <div className="relative -mx-4 mb-8 h-[500px] overflow-hidden rounded-b-2xl">
          <img
            src={getImageUrl(tvShow.backdrop_path, "original")}
            alt={tvShow.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
              {tvShow.name}
            </h1>
            {tvShow.tagline && (
              <p className="text-xl text-white/90 italic drop-shadow-md">
                "{tvShow.tagline}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Detalhes da Série */}
      <div className="flex flex-col md:flex-row gap-8">
        <img
          src={getImageUrl(tvShow.poster_path, "w500")}
          alt={tvShow.name}
          className="w-full md:w-1/3 rounded-lg shadow-lg"
        />
        <div className="grow">
          {!tvShow.backdrop_path && (
            <>
              <h1 className="text-4xl font-bold">{tvShow.name}</h1>
              {tvShow.tagline && (
                <p className="text-xl text-muted-foreground italic my-2">
                  "{tvShow.tagline}"
                </p>
              )}
            </>
          )}
          <div className="flex items-center gap-4 my-4">
            <span className="flex items-center gap-1">
              ⭐ {tvShow.vote_average.toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              ({tvShow.vote_count.toLocaleString()} votos)
            </span>
            <Button
              onClick={() =>
                openDialog({
                  movieId: tvShow.id,
                  movieTitle: tvShow.name,
                  moviePosterPath: tvShow.poster_path || undefined,
                  movieReleaseDate: tvShow.first_air_date,
                  movieVoteAverage: tvShow.vote_average.toString(),
                  mediaType: "tv",
                })
              }
              className="ml-auto"
            >
              <Heart className="mr-2 h-4 w-4" />
              Adicionar à Lista
            </Button>
          </div>

          <p className="mb-4 text-muted-foreground">{tvShow.overview}</p>

          <div className="space-y-2">
            <p>
              <strong>Primeira Exibição:</strong>{" "}
              {new Date(tvShow.first_air_date).toLocaleDateString("pt-BR")}
            </p>
            {tvShow.last_air_date && (
              <p>
                <strong>Última Exibição:</strong>{" "}
                {new Date(tvShow.last_air_date).toLocaleDateString("pt-BR")}
              </p>
            )}
            <p>
              <strong>Status:</strong> {tvShow.status}
            </p>
            <p>
              <strong>Temporadas:</strong> {tvShow.number_of_seasons}
            </p>
            <p>
              <strong>Episódios:</strong> {tvShow.number_of_episodes}
            </p>
            {tvShow.episode_run_time.length > 0 && (
              <p>
                <strong>Duração dos Episódios:</strong>{" "}
                {tvShow.episode_run_time.join(", ")} minutos
              </p>
            )}
            <p>
              <strong>Gêneros:</strong>{" "}
              {tvShow.genres.map((g) => g.name).join(", ")}
            </p>
            <p>
              <strong>Produção:</strong>{" "}
              {tvShow.production_companies.map((p) => p.name).join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Elenco */}
      {!loadingCredits && cast.length > 0 && (
        <div className="my-8">
          <h2 className="text-3xl font-bold mb-4">Elenco</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {cast.map((person) => (
              <CastCard
                key={person.id}
                id={person.id}
                name={person.name}
                character={person.character}
                profile_path={person.profile_path}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recomendações */}
      {!loadingRecs && recommendedShows.length > 0 && (
        <div className="my-8">
          <h2 className="text-3xl font-bold mb-4">Recomendações</h2>
          <RecommendationsCarousel items={recommendedShows} mediaType="tv" />
        </div>
      )}
    </div>
  )
}
