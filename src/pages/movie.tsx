import { useParams } from "react-router-dom"
import {
  useMovieDetails,
  useMovieCredits,
  useMovieRecommendations,
} from "@/hooks/useMovies"
import { getImageUrl } from "@/services/tmdb"
import { CastCard } from "@/components/cast-card"
import { RecommendationsCarousel } from "@/components/recommendations-carousel"

export function MoviePage() {
  const { id } = useParams()
  const movieId = Number(id)

  const {
    data: movie,
    isLoading: loadingMovie,
    isError: errorMovie,
  } = useMovieDetails(movieId)
  const { data: credits, isLoading: loadingCredits } = useMovieCredits(movieId)
  const { data: recommendations, isLoading: loadingRecs } =
    useMovieRecommendations(movieId)

  if (loadingMovie) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-muted-foreground">
          Carregando detalhes do filme...
        </p>
      </div>
    )
  }

  if (errorMovie || !movie) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg text-destructive mb-2">
            Erro ao carregar filme
          </p>
          <p className="text-sm text-muted-foreground">Filme não encontrado</p>
        </div>
      </div>
    )
  }

  const cast = credits?.cast.slice(0, 12) || []
  const recommendedMovies = recommendations?.results || []

  return (
    <div>
      {/* Backdrop */}
      {movie.backdrop_path && (
        <div className="relative -mx-4 mb-8 h-[500px] overflow-hidden rounded-b-2xl">
          <img
            src={getImageUrl(movie.backdrop_path, "original")}
            alt={movie.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="text-xl text-white/90 italic drop-shadow-md">
                "{movie.tagline}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Detalhes do Filme */}
      <div className="flex flex-col md:flex-row gap-8">
        <img
          src={getImageUrl(movie.poster_path, "w500")}
          alt={movie.title}
          className="w-full md:w-1/3 rounded-lg shadow-lg"
        />
        <div className="grow">
          {!movie.backdrop_path && (
            <>
              <h1 className="text-4xl font-bold">{movie.title}</h1>
              {movie.tagline && (
                <p className="text-xl text-muted-foreground italic my-2">
                  "{movie.tagline}"
                </p>
              )}
            </>
          )}
          <div className="flex items-center gap-4 my-4">
            <span className="flex items-center gap-1">
              ⭐ {movie.vote_average.toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              ({movie.vote_count.toLocaleString()} votos)
            </span>
          </div>

          <p className="mb-4 text-muted-foreground">{movie.overview}</p>

          <div className="space-y-2">
            <p>
              <strong>Data de Lançamento:</strong>{" "}
              {new Date(movie.release_date).toLocaleDateString("pt-BR")}
            </p>
            <p>
              <strong>Duração:</strong> {movie.runtime} minutos
            </p>
            <p>
              <strong>Gêneros:</strong>{" "}
              {movie.genres.map((g) => g.name).join(", ")}
            </p>
            {movie.budget > 0 && (
              <p>
                <strong>Orçamento:</strong> ${movie.budget.toLocaleString()}
              </p>
            )}
            {movie.revenue > 0 && (
              <p>
                <strong>Receita:</strong> ${movie.revenue.toLocaleString()}
              </p>
            )}
            <p>
              <strong>Produção:</strong>{" "}
              {movie.production_companies.map((p) => p.name).join(", ")}
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
      {!loadingRecs && recommendedMovies.length > 0 && (
        <div className="my-8">
          <h2 className="text-3xl font-bold mb-4">Recomendações</h2>
          <RecommendationsCarousel items={recommendedMovies} />
        </div>
      )}
    </div>
  )
}
