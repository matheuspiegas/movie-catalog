import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { MovieCard } from "./movie-card"
import type { Movie, TVShow } from "@/services/tmdb"

interface RecommendationsCarouselProps {
  items: Movie[] | TVShow[]
  mediaType?: "movie" | "tv"
}

export function RecommendationsCarousel({
  items,
  mediaType = "movie",
}: RecommendationsCarouselProps) {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: false,
        dragFree: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {items.map((item) => {
          const isMovie = "title" in item
          return (
            <CarouselItem
              key={item.id}
              className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
            >
              <MovieCard
                id={item.id}
                title={isMovie ? item.title : (item as TVShow).name}
                poster_path={item.poster_path}
                vote_average={item.vote_average}
                release_date={
                  isMovie ? item.release_date : (item as TVShow).first_air_date
                }
                showYear={false}
                mediaType={mediaType}
              />
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="-left-4" />
      <CarouselNext className="-right-4" />
    </Carousel>
  )
}
