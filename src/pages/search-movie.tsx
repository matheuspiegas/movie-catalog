import { SearchMovieInput } from "@/components/search-movie-input"
import { MovieCard } from "@/components/movie-card"

export function SearchMoviePage() {
  const movies = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    title: `Found Movie ${i + 1}`,
    release_date: "2025",
    vote_average: 7.5,
    poster_path: "https://placehold.co/500x750",
  }))

  return (
    <div>
      <SearchMovieInput />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {movies.map((movie) => (
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
  )
}
