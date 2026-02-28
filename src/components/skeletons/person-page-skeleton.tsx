import { MediaInfoCard } from "@/components/media-info-card"
import { MediaCardSkeleton } from "@/components/skeletons/media-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

const filmographyItems = Array.from({ length: 8 })

export function PersonPageSkeleton() {
  return (
    <div className="pb-8">
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 mb-8 h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden rounded-b-xl">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        <div className="lg:w-1/3 space-y-6">
          <div className="backdrop-blur-md bg-card/50 border border-border/50 rounded-lg p-6 shadow-lg space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        <div className="lg:w-2/3 space-y-6">
          <MediaInfoCard>
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-9/12" />
          </MediaInfoCard>

          <MediaInfoCard>
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filmographyItems.map((_, index) => (
                <MediaCardSkeleton key={`person-filmography-${index}`} />
              ))}
            </div>
          </MediaInfoCard>
        </div>
      </div>
    </div>
  )
}
