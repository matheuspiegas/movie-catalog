import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link, useParams } from "react-router-dom"

export function ListPage() {
  const { id } = useParams()

  const list = {
    id,
    name: `My List ${id}`,
  }

  const movies = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    title: `Movie in list ${i + 1}`,
    release_date: "2025",
    vote_average: 7.5,
    poster_path: "https://placehold.co/500x750",
  }))

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{list.name}</h1>
        <div>
          <Button variant="outline" className="mr-2">
            Rename List
          </Button>
          <Button variant="destructive">Delete List</Button>
        </div>
      </div>

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
            <CardFooter className="flex justify-between">
              <Link to={`/movie/${movie.id}`}>
                <Button size="sm">Details</Button>
              </Link>
              <Button variant="destructive" size="sm">
                Remove
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
