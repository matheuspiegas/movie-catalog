"use client"

import { useParams } from "next/navigation"
import { Calendar, MapPin, Star } from "lucide-react"
import { usePersonDetails, usePersonMovieCredits } from "@/hooks/useMovies"
import { getImageUrl } from "@/services/tmdb"
import { MovieCard } from "@/components/movie-card"
import { MediaInfoCard } from "@/components/media-info-card"
import { MediaCardSkeleton } from "@/components/skeletons/media-card-skeleton"
import { PersonPageSkeleton } from "@/components/skeletons/person-page-skeleton"

export function PersonPage() {
  const { id } = useParams<{ id: string }>()
  const personId = Number(id)

  const { data: person, isLoading, isError } = usePersonDetails(personId)
  const { data: credits, isLoading: loadingCredits } =
    usePersonMovieCredits(personId)

  if (isLoading) {
    return <PersonPageSkeleton />
  }

  if (isError || !person) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg text-destructive mb-2">
            Erro ao carregar pessoa
          </p>
          <p className="text-sm text-muted-foreground">Pessoa não encontrada</p>
        </div>
      </div>
    )
  }

  const filmography = [...(credits?.cast ?? [])].sort(
    (a, b) =>
      new Date(b.release_date || 0).getTime() -
      new Date(a.release_date || 0).getTime()
  )

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR")

  return (
    <div className="pb-8">
      {person.profile_path && (
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 mb-8 overflow-hidden rounded-b-xl shadow-xl">
          <img
            src={getImageUrl(person.profile_path, "original")}
            alt={person.name}
            className="h-full w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-2xl animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
              {person.name}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/90 drop-shadow-lg animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-150">
              {person.known_for_department}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        <div className="lg:w-1/3 space-y-6">
          <div className="backdrop-blur-md bg-card/50 border border-border/50 rounded-lg p-6 shadow-lg space-y-3 text-sm">
            {person.birthday && (
              <div className="flex items-center gap-3 transition-colors hover:text-primary">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>
                  <strong>Nascimento:</strong> {formatDate(person.birthday)}
                </span>
              </div>
            )}
            {person.deathday && (
              <div className="flex items-center gap-3 transition-colors hover:text-primary">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>
                  <strong>Falecimento:</strong> {formatDate(person.deathday)}
                </span>
              </div>
            )}
            {person.place_of_birth && (
              <div className="flex items-center gap-3 transition-colors hover:text-primary">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>
                  <strong>Local:</strong> {person.place_of_birth}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 transition-colors hover:text-primary">
              <Star className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span>
                <strong>Popularidade:</strong> {person.popularity.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:w-2/3 space-y-6">
          {!person.profile_path && (
            <div>
              <h1 className="text-4xl font-bold">{person.name}</h1>
              <p className="text-lg text-muted-foreground mt-2">
                {person.known_for_department}
              </p>
            </div>
          )}

          <MediaInfoCard title="Biografia">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {person.biography || "Biografia não disponível."}
            </p>
          </MediaInfoCard>

          <MediaInfoCard title="Filmografia">
            {loadingCredits ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <MediaCardSkeleton key={`person-filmography-${index}`} />
                ))}
              </div>
            ) : filmography.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filmography.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    poster_path={movie.poster_path}
                    vote_average={movie.vote_average}
                    release_date={movie.release_date}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Nenhuma filmografia disponível no momento.
              </p>
            )}
          </MediaInfoCard>
        </div>
      </div>
    </div>
  )
}
