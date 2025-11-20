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

export interface CreditsResponse {
  id: number
  cast: CastMember[]
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
