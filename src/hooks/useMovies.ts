import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import {
  getPopularMovies,
  getTrendingMovies,
  searchMovies,
  getMovieDetails,
  getMovieCredits,
  getMovieRecommendations,
  getPersonDetails,
  getPersonMovieCredits,
} from "@/services/tmdb"
import { useQueryState } from "nuqs"

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

export function usePersonDetails(personId: number) {
  return useQuery({
    queryKey: ["person", "details", personId],
    queryFn: () => getPersonDetails(personId),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

export function usePersonMovieCredits(personId: number) {
  return useQuery({
    queryKey: ["person", "credits", personId],
    queryFn: () => getPersonMovieCredits(personId),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}
