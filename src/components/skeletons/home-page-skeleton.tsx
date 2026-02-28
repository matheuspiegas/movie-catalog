import { MediaGrid } from "@/components/media-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { MediaCardSkeleton } from "@/components/skeletons/media-card-skeleton"

const mediaItems = Array.from({ length: 10 })

export function HomePageSkeleton() {
  return (
    <div className="relative py-8">
      <div>
        <Skeleton className="h-9 w-72 mx-auto mb-6" />

        <div className="mb-12">
          <div className="w-full max-w-2xl mx-auto">
            <div className="flex gap-2">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-12" />
            </div>
          </div>
        </div>

        <Skeleton className="h-7 w-60 mb-6" />
        <MediaGrid>
          {mediaItems.map((_, index) => (
            <MediaCardSkeleton key={`home-skeleton-${index}`} />
          ))}
        </MediaGrid>

        <div className="h-20 flex items-center justify-center mt-8">
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  )
}
