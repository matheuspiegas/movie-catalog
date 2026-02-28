"use client"

import { useParams } from "next/navigation"
import {
  useMovieDetails,
  useMovieCredits,
  useMovieRecommendations,
  useMovieVideos,
  useMovieWatchProviders,
} from "@/hooks/useMovies"
import { CastCard } from "@/components/cast-card"
import { RecommendationsCarousel } from "@/components/recommendations-carousel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MediaBackdrop } from "@/components/media-backdrop"
import { MediaSidebar } from "@/components/media-sidebar"
import { MediaInfoCard } from "@/components/media-info-card"
import { MediaPageSkeleton } from "@/components/media-page-skeleton"
import { VideoEmbed } from "@/components/video-embed"
import { CrewSection } from "@/components/crew-section"
import { useAddToList } from "@/contexts/add-to-list-context"

export function MoviePage() {
  const { id } = useParams<{ id: string }>()
  const movieId = Number(id)
  const { openDialog } = useAddToList()

  const {
    data: movie,
    isLoading: loadingMovie,
    isError: errorMovie,
  } = useMovieDetails(movieId)
  const { data: credits, isLoading: loadingCredits } = useMovieCredits(movieId)
  const { data: recommendations, isLoading: loadingRecs } =
    useMovieRecommendations(movieId)
  const { data: videos } = useMovieVideos(movieId)
  const { data: watchProviders } = useMovieWatchProviders(movieId)

  if (loadingMovie) {
    return <MediaPageSkeleton />
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
  const crew = credits?.crew || []
  const recommendedMovies = recommendations?.results || []

  // Filtra apenas trailers oficiais em português ou inglês
  const trailer =
    videos?.results.find(
      (video) =>
        video.type === "Trailer" && video.site === "YouTube" && video.official,
    ) ||
    videos?.results.find(
      (video) => video.type === "Trailer" && video.site === "YouTube",
    )

  // Pega os provedores do Brasil (BR)
  const brProviders = watchProviders?.results?.BR

  return (
    <div className="pb-8">
      {/* Backdrop */}
      <MediaBackdrop
        backdropPath={movie.backdrop_path}
        title={movie.title}
        tagline={movie.tagline}
      />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Sidebar */}
        <MediaSidebar
          media={movie}
          mediaType="movie"
          watchProviders={brProviders}
          onAddToList={() =>
            openDialog({
              movieId: movie.id,
              movieTitle: movie.title,
              moviePosterPath: movie.poster_path || undefined,
              movieReleaseDate: movie.release_date,
              movieVoteAverage: movie.vote_average.toString(),
              mediaType: "movie",
            })
          }
        />

        {/* Conteúdo Principal - Tabs */}
        <div className="lg:w-2/3">
          {!movie.backdrop_path && (
            <div className="mb-6">
              <h1 className="text-4xl font-bold">{movie.title}</h1>
              {movie.tagline && (
                <p className="text-xl text-muted-foreground italic mt-2">
                  "{movie.tagline}"
                </p>
              )}
            </div>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6 backdrop-blur-sm">
              <TabsTrigger value="overview" className="transition-all">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="cast" className="transition-all">
                Elenco e Equipe
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="transition-all">
                Recomendações
              </TabsTrigger>
            </TabsList>

            {/* Aba: Visão Geral */}
            <TabsContent
              value="overview"
              className="space-y-6 mt-0 animate-in fade-in-50 duration-500"
            >
              {/* Trailer */}
              {trailer && (
                <MediaInfoCard title="Trailer">
                  <VideoEmbed videoKey={trailer.key} title={trailer.name} />
                </MediaInfoCard>
              )}

              {/* Sinopse */}
              <MediaInfoCard title="Sinopse">
                <p className="text-muted-foreground leading-relaxed">
                  {movie.overview || "Sinopse não disponível."}
                </p>
              </MediaInfoCard>

            </TabsContent>

            {/* Aba: Elenco e Equipe */}
            <TabsContent
              value="cast"
              className="space-y-8 mt-0 animate-in fade-in-50 duration-500"
            >
              {/* Equipe Principal */}
              {!loadingCredits && crew.length > 0 && (
                <MediaInfoCard>
                  <CrewSection crew={crew} />
                </MediaInfoCard>
              )}

              {/* Elenco */}
              {!loadingCredits && cast.length > 0 && (
                <MediaInfoCard title="Elenco Principal">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                </MediaInfoCard>
              )}
            </TabsContent>

            {/* Aba: Recomendações */}
            <TabsContent
              value="recommendations"
              className="mt-0 animate-in fade-in-50 duration-500"
            >
              {!loadingRecs && recommendedMovies.length > 0 ? (
                <MediaInfoCard title="Filmes Recomendados">
                  <RecommendationsCarousel items={recommendedMovies} />
                </MediaInfoCard>
              ) : (
                <MediaInfoCard>
                  <p className="text-muted-foreground text-center py-6">
                    Nenhuma recomendação disponível no momento.
                  </p>
                </MediaInfoCard>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
