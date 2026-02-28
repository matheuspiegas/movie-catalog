"use client"

import { useInfiniteTrendingAll } from "@/hooks/useMovies"
import { MovieCard } from "@/components/movie-card"
import { MediaGrid } from "@/components/media-grid"
import { HomePageSkeleton } from "@/components/skeletons/home-page-skeleton"
import { useEffect, useRef, useState } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlobalSearchInput } from "@/components/global-search-input"

export function HomePage() {
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
  } = useInfiniteTrendingAll("week")

  // Intersection Observer para detectar quando o usuário chega ao fim da página
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Se o elemento alvo está visível e há mais páginas
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }, // Ativa quando 10% do elemento está visível
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
    return <HomePageSkeleton />
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg text-destructive mb-2">
            Erro ao carregar conteúdo
          </p>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
        </div>
      </div>
    )
  }

  // Combina todos os itens de todas as páginas carregadas
  const mediaItems = data?.pages.flatMap((page) => page.results) || []

  // Remove duplicatas baseado no ID
  const uniqueMediaItems = mediaItems.reduce(
    (acc, item) => {
      if (!acc.find((m) => m.id === item.id)) {
        acc.push(item)
      }
      return acc
    },
    [] as typeof mediaItems,
  )

  return (
    <div className="relative py-8">
      <div>
        <h1 className="text-3xl font-bold mb-6 text-center">
          Descubra Filmes e Séries
        </h1>

        <div className="mb-12">
          <GlobalSearchInput />
        </div>

        <h2 className="text-2xl font-bold mb-6">Em Alta Esta Semana</h2>
        <MediaGrid>
          {uniqueMediaItems.map((item) => (
            <MovieCard
              key={`${item.media_type}-${item.id}`}
              id={item.id}
              title={item.media_type === "movie" ? item.title! : item.name!}
              poster_path={item.poster_path}
              vote_average={item.vote_average}
              release_date={
                item.media_type === "movie"
                  ? item.release_date
                  : item.first_air_date
              }
              mediaType={item.media_type}
            />
          ))}
        </MediaGrid>

        {/* Elemento observado para trigger do scroll infinito */}
        <div
          ref={observerTarget}
          className="h-20 flex items-center justify-center mt-8"
        >
          {isFetchingNextPage && (
            <p className="text-muted-foreground">Carregando mais conteúdo...</p>
          )}
          {!hasNextPage && uniqueMediaItems.length > 0 && (
            <p className="text-muted-foreground">Você viu todo o conteúdo!</p>
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
