import { SearchMovieInput } from "@/components/search-movie-input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Link } from "react-router-dom"

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
          <Card key={movie.id}>
            <CardHeader>
              <img
                src={movie.poster_path}
                alt={movie.title}
                className="rounded-t-lg"
              />
            </CardHeader>
            <CardContent>
              <CardTitle>{movie.title}</CardTitle>
              <CardDescription>
                {movie.release_date} - {movie.vote_average.toFixed(1)}
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Link to={`/movie/${movie.id}`} className="w-full">
                <Button className="w-full">Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
