import { useParams } from "react-router-dom"
import { usePersonDetails, usePersonMovieCredits } from "@/hooks/useMovies"
import { getImageUrl } from "@/services/tmdb"
import { MovieCard } from "@/components/movie-card"

export function PersonPage() {
  const { id } = useParams()
  const personId = Number(id)

  const { data: person, isLoading, isError } = usePersonDetails(personId)
  const { data: credits, isLoading: loadingCredits } =
    usePersonMovieCredits(personId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-muted-foreground">
          Carregando informações...
        </p>
      </div>
    )
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

  const filmography =
    credits?.cast.sort(
      (a, b) =>
        new Date(b.release_date || 0).getTime() -
        new Date(a.release_date || 0).getTime()
    ) || []

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-8">
        <img
          src={getImageUrl(person.profile_path, "w500")}
          alt={person.name}
          className="w-full md:w-1/3 rounded-lg shadow-lg"
        />
        <div className="grow">
          <h1 className="text-4xl font-bold">{person.name}</h1>
          <p className="text-lg text-muted-foreground mt-2">
            {person.known_for_department}
          </p>

          <div className="my-6">
            <h2 className="text-xl font-semibold mb-2">Biografia</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {person.biography || "Biografia não disponível."}
            </p>
          </div>

          <div className="space-y-2">
            {person.birthday && (
              <p>
                <strong>Data de Nascimento:</strong>{" "}
                {new Date(person.birthday).toLocaleDateString("pt-BR")}
                {person.deathday && (
                  <>
                    {" "}
                    - {new Date(person.deathday).toLocaleDateString("pt-BR")}
                  </>
                )}
              </p>
            )}
            {person.place_of_birth && (
              <p>
                <strong>Local de Nascimento:</strong> {person.place_of_birth}
              </p>
            )}
          </div>
        </div>
      </div>

      {!loadingCredits && filmography.length > 0 && (
        <div className="my-8">
          <h2 className="text-3xl font-bold mb-4">Filmografia</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
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
        </div>
      )}
    </div>
  )
}
