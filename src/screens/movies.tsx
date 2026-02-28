"use client"

import { useInfinitePopularMovies } from "@/hooks/useMovies"
import { MovieCard } from "@/components/movie-card"
import { MediaGrid } from "@/components/media-grid"
import { MoviesPageSkeleton } from "@/components/skeletons/movies-page-skeleton"
import { useEffect, useRef, useState } from "react"
import { SearchMovieInput } from "@/components/search-movie-input"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MoviesPage() {
  const observerTarget = useRef<HTMLDivElement>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePopularMovies()

  // Intersection Observer para detectar quando o usuário chega ao fim da página
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Se o elemento alvo está visível e há mais páginas
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 } // Ativa quando 10% do elemento está visível
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Controlar visibilidade do botão de scroll to top
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleScroll = () => {
      // Mostrar botão quando rolar mais de 400px
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

  if (isLoading) {
    return <MoviesPageSkeleton />
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg text-destructive mb-2">
            Erro ao carregar filmes
          </p>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
        </div>
      </div>
    )
  }

  // Combina todos os filmes de todas as páginas carregadas
  const movies = data?.pages.flatMap((page) => page.results) || []

  // Remove duplicatas baseado no ID do filme
  const uniqueMovies = movies.reduce((acc, movie) => {
    if (!acc.find((m) => m.id === movie.id)) {
      acc.push(movie)
    }
    return acc
  }, [] as typeof movies)

  return (
    <div className="relative py-8">
      <div>
        <SearchMovieInput
          placeholder="Buscar filmes..."
          title="Filmes Populares"
        />
        <MediaGrid>
          {uniqueMovies.map((movie) => (
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
        </MediaGrid>

        {/* Elemento observado para trigger do scroll infinito */}
        <div
          ref={observerTarget}
          className="h-20 flex items-center justify-center mt-8"
        >
          {isFetchingNextPage && (
            <p className="text-muted-foreground">Carregando mais filmes...</p>
          )}
          {!hasNextPage && uniqueMovies.length > 0 && (
            <p className="text-muted-foreground">Você viu todos os filmes!</p>
          )}
        </div>
      </div>

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
