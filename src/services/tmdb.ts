const READ_ACCESS_TOKEN = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN
const BASE_URL = "https://api.themoviedb.org/3"
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

// Headers para autenticação com Bearer Token
const headers = {
  accept: "application/json",
  Authorization: `Bearer ${READ_ACCESS_TOKEN}`,
}

export interface Movie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
  adult: boolean
  video: boolean
  original_language: string
}

export interface Genre {
  id: number
  name: string
}

export interface ProductionCompany {
  id: number
  name: string
  logo_path: string | null
  origin_country: string
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface MovieDetails {
  id: number
  title: string
  original_title: string
  tagline: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  runtime: number
  vote_average: number
  vote_count: number
  budget: number
  revenue: number
  genres: Genre[]
  production_companies: ProductionCompany[]
  status: string
  original_language: string
  popularity: number
}

export interface CrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

export interface CreditsResponse {
  id: number
  cast: CastMember[]
  crew: CrewMember[]
}

export interface PersonDetails {
  id: number
  name: string
  biography: string
  birthday: string | null
  deathday: string | null
  place_of_birth: string | null
  profile_path: string | null
  known_for_department: string
  popularity: number
}

export interface PersonMovieCredit {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  character: string
  vote_average: number
}

export interface PersonCreditsResponse {
  id: number
  cast: PersonMovieCredit[]
}

export interface MoviesResponse {
  page: number
  results: Movie[]
  total_pages: number
  total_results: number
}

// Interfaces para Séries de TV
export interface TVShow {
  id: number
  name: string
  original_name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
  origin_country: string[]
  original_language: string
}

export interface Season {
  id: number
  name: string
  overview: string
  poster_path: string | null
  season_number: number
  episode_count: number
  air_date: string
}

export interface TVShowDetails {
  id: number
  name: string
  original_name: string
  tagline: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  last_air_date: string
  vote_average: number
  vote_count: number
  genres: Genre[]
  production_companies: ProductionCompany[]
  number_of_seasons: number
  number_of_episodes: number
  episode_run_time: number[]
  seasons: Season[]
  status: string
  original_language: string
  popularity: number
  in_production: boolean
}

export interface TVShowsResponse {
  page: number
  results: TVShow[]
  total_pages: number
  total_results: number
}

// Interface para conteúdo misto (trending all)
export interface MediaItem {
  id: number
  media_type: "movie" | "tv"
  title?: string // para filmes
  name?: string // para séries
  original_title?: string
  original_name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string // para filmes
  first_air_date?: string // para séries
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
  adult?: boolean
  video?: boolean
  original_language: string
}

export interface MediaResponse {
  page: number
  results: MediaItem[]
  total_pages: number
  total_results: number
}

// Interface para vídeos (trailers)
export interface Video {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
  published_at: string
}

export interface VideosResponse {
  id: number
  results: Video[]
}

// Interface para plataformas de streaming
export interface WatchProvider {
  logo_path: string
  provider_id: number
  provider_name: string
  display_priority: number
}

export interface CountryWatchProviders {
  link: string
  flatrate?: WatchProvider[]
  rent?: WatchProvider[]
  buy?: WatchProvider[]
}

export interface WatchProvidersResponse {
  id: number
  results: {
    [countryCode: string]: CountryWatchProviders
  }
}

// Buscar filmes populares ou fazer busca
export async function getPopularMovies(
  page: number = 1,
  search?: string | null
): Promise<MoviesResponse> {
  // Se há um termo de busca, usa o endpoint de search
  if (search && search.trim().length > 0) {
    const response = await fetch(
      `${BASE_URL}/search/movie?language=pt-BR&query=${encodeURIComponent(
        search
      )}&page=${page}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error("Erro ao buscar filmes")
    }

    return response.json()
  }

  // Caso contrário, retorna filmes populares
  const response = await fetch(
    `${BASE_URL}/movie/popular?language=pt-BR&page=${page}`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar filmes populares")
  }

  return response.json()
}

// Buscar filmes em alta (trending)
export async function getTrendingMovies(
  timeWindow: "day" | "week" = "day"
): Promise<MoviesResponse> {
  const response = await fetch(
    `${BASE_URL}/trending/movie/${timeWindow}?language=pt-BR`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar filmes em alta")
  }

  return response.json()
}

// Buscar filmes por termo de busca
export async function searchMovies(
  query: string,
  page: number = 1
): Promise<MoviesResponse> {
  const response = await fetch(
    `${BASE_URL}/search/movie?language=pt-BR&query=${encodeURIComponent(
      query
    )}&page=${page}`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar filmes")
  }

  return response.json()
}

// Gerar URL de imagem
export function getImageUrl(
  path: string | null,
  size: "w500" | "original" = "w500"
): string {
  if (!path) return "/placeholder-movie.png"
  return `${IMAGE_BASE_URL}/${size}${path}`
}

// ========== Trending All (Filmes e Séries) ==========

// Buscar conteúdo em alta (trending) - filmes e séries misturados
export async function getTrendingAll(
  timeWindow: "day" | "week" = "day",
  page: number = 1
): Promise<MediaResponse> {
  const response = await fetch(
    `${BASE_URL}/trending/all/${timeWindow}?language=pt-BR&page=${page}`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar conteúdo em alta")
  }

  return response.json()
}

// ========== Filmes ==========

// Buscar detalhes de um filme
export async function getMovieDetails(movieId: number): Promise<MovieDetails> {
  const response = await fetch(`${BASE_URL}/movie/${movieId}?language=pt-BR`, {
    headers,
  })

  if (!response.ok) {
    throw new Error("Erro ao buscar detalhes do filme")
  }

  return response.json()
}

// Buscar elenco de um filme
export async function getMovieCredits(
  movieId: number
): Promise<CreditsResponse> {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}/credits?language=pt-BR`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar elenco do filme")
  }

  return response.json()
}

// Buscar recomendações de filmes
export async function getMovieRecommendations(
  movieId: number
): Promise<MoviesResponse> {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}/recommendations?language=pt-BR`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar recomendações")
  }

  return response.json()
}

// Buscar vídeos/trailers de um filme
export async function getMovieVideos(movieId: number): Promise<VideosResponse> {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}/videos?language=pt-BR`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar vídeos do filme")
  }

  return response.json()
}

// Buscar plataformas de streaming onde o filme está disponível
export async function getMovieWatchProviders(
  movieId: number
): Promise<WatchProvidersResponse> {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}/watch/providers`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar plataformas de streaming")
  }

  return response.json()
}

// Buscar detalhes de uma pessoa
export async function getPersonDetails(
  personId: number
): Promise<PersonDetails> {
  const response = await fetch(
    `${BASE_URL}/person/${personId}?language=pt-BR`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar detalhes da pessoa")
  }

  return response.json()
}

// Buscar filmografia de uma pessoa
export async function getPersonMovieCredits(
  personId: number
): Promise<PersonCreditsResponse> {
  const response = await fetch(
    `${BASE_URL}/person/${personId}/movie_credits?language=pt-BR`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar filmografia")
  }

  return response.json()
}

// ========== Séries de TV ==========

// Buscar séries populares ou fazer busca
export async function getPopularTVShows(
  page: number = 1,
  search?: string | null
): Promise<TVShowsResponse> {
  // Se há um termo de busca, usa o endpoint de search
  if (search && search.trim().length > 0) {
    const response = await fetch(
      `${BASE_URL}/search/tv?language=pt-BR&query=${encodeURIComponent(
        search
      )}&page=${page}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error("Erro ao buscar séries")
    }

    return response.json()
  }

  // Caso contrário, retorna séries populares
  const response = await fetch(
    `${BASE_URL}/tv/popular?language=pt-BR&page=${page}`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar séries populares")
  }

  return response.json()
}

// Buscar séries em alta (trending)
export async function getTrendingTVShows(
  timeWindow: "day" | "week" = "day"
): Promise<TVShowsResponse> {
  const response = await fetch(
    `${BASE_URL}/trending/tv/${timeWindow}?language=pt-BR`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar séries em alta")
  }

  return response.json()
}

// Buscar séries por termo de busca
export async function searchTVShows(
  query: string,
  page: number = 1
): Promise<TVShowsResponse> {
  const response = await fetch(
    `${BASE_URL}/search/tv?language=pt-BR&query=${encodeURIComponent(
      query
    )}&page=${page}`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar séries")
  }

  return response.json()
}

// Buscar detalhes de uma série
export async function getTVShowDetails(tvId: number): Promise<TVShowDetails> {
  const response = await fetch(`${BASE_URL}/tv/${tvId}?language=pt-BR`, {
    headers,
  })

  if (!response.ok) {
    throw new Error("Erro ao buscar detalhes da série")
  }

  return response.json()
}

// Buscar elenco de uma série
export async function getTVShowCredits(tvId: number): Promise<CreditsResponse> {
  const response = await fetch(
    `${BASE_URL}/tv/${tvId}/credits?language=pt-BR`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar elenco da série")
  }

  return response.json()
}

// Buscar recomendações de séries
export async function getTVShowRecommendations(
  tvId: number
): Promise<TVShowsResponse> {
  const response = await fetch(
    `${BASE_URL}/tv/${tvId}/recommendations?language=pt-BR`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar recomendações")
  }

  return response.json()
}

// Buscar vídeos/trailers de uma série
export async function getTVShowVideos(tvId: number): Promise<VideosResponse> {
  const response = await fetch(
    `${BASE_URL}/tv/${tvId}/videos?language=pt-BR`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar vídeos da série")
  }

  return response.json()
}

// Buscar plataformas de streaming onde a série está disponível
export async function getTVShowWatchProviders(
  tvId: number
): Promise<WatchProvidersResponse> {
  const response = await fetch(
    `${BASE_URL}/tv/${tvId}/watch/providers`,
    { headers }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar plataformas de streaming")
  }

  return response.json()
}
