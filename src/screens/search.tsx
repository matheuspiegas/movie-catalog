"use client"

import { useQueryState } from "nuqs"
import { useSearchTVShows, useSearchMovies } from "@/hooks/useMovies"
import { MovieCard } from "@/components/movie-card"
import { GlobalSearchInput } from "@/components/global-search-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"

export function SearchPage() {
  const [query] = useQueryState("query")
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Controlar visibilidade do botão de scroll to top
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const {
    data: moviesData,
    isLoading: moviesLoading,
    isError: moviesError,
  } = useSearchMovies(query || "", 1)

  const {
    data: tvShowsData,
    isLoading: tvShowsLoading,
    isError: tvShowsError,
  } = useSearchTVShows(query || "", 1)

  const movies = moviesData?.results || []
  const tvShows = tvShowsData?.results || []
  const totalResults = movies.length + tvShows.length

  const isLoading = moviesLoading || tvShowsLoading
  const hasError = moviesError && tvShowsError

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Buscar Filmes e Séries
      </h1>

      <div className="mb-8">
        <GlobalSearchInput />
      </div>

      {query && (
        <>
          <div className="mb-6">
            <h2 className="text-xl text-muted-foreground">
              Resultados para:{" "}
              <span className="font-bold text-foreground">"{query}"</span>
            </h2>
            {!isLoading && (
              <p className="text-sm text-muted-foreground mt-1">
                {totalResults}{" "}
                {totalResults === 1
                  ? "resultado encontrado"
                  : "resultados encontrados"}
              </p>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-lg text-muted-foreground">Buscando...</p>
            </div>
          )}

          {hasError && !isLoading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-lg text-destructive mb-2">
                  Erro ao buscar conteúdo
                </p>
                <p className="text-sm text-muted-foreground">
                  Tente novamente mais tarde
                </p>
              </div>
            </div>
          )}

          {!isLoading && !hasError && totalResults === 0 && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-lg text-muted-foreground mb-2">
                  Nenhum resultado encontrado
                </p>
                <p className="text-sm text-muted-foreground">
                  Tente buscar com outros termos
                </p>
              </div>
            </div>
          )}

          {!isLoading && !hasError && totalResults > 0 && (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all">Todos ({totalResults})</TabsTrigger>
                <TabsTrigger value="movies">
                  Filmes ({movies.length})
                </TabsTrigger>
                <TabsTrigger value="tv">Séries ({tvShows.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                  {movies.map((movie) => (
                    <MovieCard
                      key={`movie-${movie.id}`}
                      id={movie.id}
                      title={movie.title}
                      poster_path={movie.poster_path}
                      vote_average={movie.vote_average}
                      release_date={movie.release_date}
                      mediaType="movie"
                    />
                  ))}
                  {tvShows.map((show) => (
                    <MovieCard
                      key={`tv-${show.id}`}
                      id={show.id}
                      title={show.name}
                      poster_path={show.poster_path}
                      vote_average={show.vote_average}
                      release_date={show.first_air_date}
                      mediaType="tv"
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="movies">
                {movies.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                    {movies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        id={movie.id}
                        title={movie.title}
                        poster_path={movie.poster_path}
                        vote_average={movie.vote_average}
                        release_date={movie.release_date}
                        mediaType="movie"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Nenhum filme encontrado
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tv">
                {tvShows.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                    {tvShows.map((show) => (
                      <MovieCard
                        key={show.id}
                        id={show.id}
                        title={show.name}
                        poster_path={show.poster_path}
                        vote_average={show.vote_average}
                        release_date={show.first_air_date}
                        mediaType="tv"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Nenhuma série encontrada
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      {!query && (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg text-muted-foreground">
            Digite algo no campo acima para buscar
          </p>
        </div>
      )}

      {/* Botão de voltar ao topo - fixed position */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
