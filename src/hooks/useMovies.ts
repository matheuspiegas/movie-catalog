import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import {
  getPopularMovies,
  getTrendingMovies,
  searchMovies,
  getMovieDetails,
  getMovieCredits,
  getMovieRecommendations,
  getMovieVideos,
  getMovieWatchProviders,
  getPersonDetails,
  getPersonMovieCredits,
  getPopularTVShows,
  getTrendingTVShows,
  searchTVShows,
  getTVShowDetails,
  getTVShowCredits,
  getTVShowRecommendations,
  getTVShowVideos,
  getTVShowWatchProviders,
  getTrendingAll,
} from "@/services/tmdb"
import { useQueryState } from "nuqs"

// ========== Hooks para conteúdo misto (trending all) ==========

export function useInfiniteTrendingAll(timeWindow: "day" | "week" = "day") {
  return useInfiniteQuery({
    queryKey: ["trending", "all", "infinite", timeWindow],
    queryFn: ({ pageParam = 1 }) => getTrendingAll(timeWindow, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// ========== Hooks para filmes ==========

export function usePopularMovies(page: number = 1) {
  return useQuery({
    queryKey: ["movies", "popular", page],
    queryFn: () => getPopularMovies(page),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useInfinitePopularMovies() {
  const [search] = useQueryState("search")
  return useInfiniteQuery({
    queryKey: ["movies", "popular", "infinite", search],
    queryFn: ({ pageParam = 1 }) => getPopularMovies(pageParam, search),
    getNextPageParam: (lastPage) => {
      // Se a página atual for menor que o total, retorna a próxima página
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1
      }
      // Se não houver mais páginas, retorna undefined para parar
      return undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useTrendingMovies(timeWindow: "day" | "week" = "day") {
  return useQuery({
    queryKey: ["movies", "trending", timeWindow],
    queryFn: () => getTrendingMovies(timeWindow),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useSearchMovies(query: string, page: number = 1) {
  return useQuery({
    queryKey: ["movies", "search", query, page],
    queryFn: () => searchMovies(query, page),
    enabled: query.length > 0, // Só busca se tiver query
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useMovieDetails(movieId: number) {
  return useQuery({
    queryKey: ["movie", "details", movieId],
    queryFn: () => getMovieDetails(movieId),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

export function useMovieCredits(movieId: number) {
  return useQuery({
    queryKey: ["movie", "credits", movieId],
    queryFn: () => getMovieCredits(movieId),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

export function useMovieRecommendations(movieId: number) {
  return useQuery({
    queryKey: ["movie", "recommendations", movieId],
    queryFn: () => getMovieRecommendations(movieId),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

export function useMovieVideos(movieId: number) {
  return useQuery({
    queryKey: ["movie", "videos", movieId],
    queryFn: () => getMovieVideos(movieId),
    staleTime: 1000 * 60 * 30, // 30 minutos (vídeos mudam raramente)
  })
}

export function useMovieWatchProviders(movieId: number) {
  return useQuery({
    queryKey: ["movie", "watch-providers", movieId],
    queryFn: () => getMovieWatchProviders(movieId),
    staleTime: 1000 * 60 * 60, // 1 hora (providers mudam pouco)
  })
}

export function usePersonDetails(personId: number) {
  return useQuery({
    queryKey: ["person", "details", personId],
    queryFn: () => getPersonDetails(personId),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

export function usePersonMovieCredits(personId: number) {
  return useQuery({
    queryKey: ["person", "movie-credits", personId],
    queryFn: () => getPersonMovieCredits(personId),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

// ========== Hooks para Séries de TV ==========

export function useInfinitePopularTVShows() {
  const [search] = useQueryState("search")
  return useInfiniteQuery({
    queryKey: ["tv-shows", "popular", "infinite", search],
    queryFn: ({ pageParam = 1 }) => getPopularTVShows(pageParam, search),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useTrendingTVShows(timeWindow: "day" | "week" = "day") {
  return useQuery({
    queryKey: ["tv-shows", "trending", timeWindow],
    queryFn: () => getTrendingTVShows(timeWindow),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useSearchTVShows(query: string, page: number = 1) {
  return useQuery({
    queryKey: ["tv-shows", "search", query, page],
    queryFn: () => searchTVShows(query, page),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useTVShowDetails(tvId: number) {
  return useQuery({
    queryKey: ["tv-show", "details", tvId],
    queryFn: () => getTVShowDetails(tvId),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

export function useTVShowCredits(tvId: number) {
  return useQuery({
    queryKey: ["tv-show", "credits", tvId],
    queryFn: () => getTVShowCredits(tvId),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

export function useTVShowRecommendations(tvId: number) {
  return useQuery({
    queryKey: ["tv-show", "recommendations", tvId],
    queryFn: () => getTVShowRecommendations(tvId),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

export function useTVShowVideos(tvId: number) {
  return useQuery({
    queryKey: ["tv-show", "videos", tvId],
    queryFn: () => getTVShowVideos(tvId),
    staleTime: 1000 * 60 * 30, // 30 minutos (vídeos mudam raramente)
  })
}

export function useTVShowWatchProviders(tvId: number) {
  return useQuery({
    queryKey: ["tv-show", "watch-providers", tvId],
    queryFn: () => getTVShowWatchProviders(tvId),
    staleTime: 1000 * 60 * 60, // 1 hora (providers mudam pouco)
  })
}
