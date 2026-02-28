import { Skeleton } from "@/components/ui/skeleton"
import { MediaCardSkeleton } from "@/components/skeletons/media-card-skeleton"

const listItems = Array.from({ length: 10 })

export function ListDetailPageSkeleton() {
  return (
    <div className="py-8">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-52" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {listItems.map((_, index) => (
            <MediaCardSkeleton key={`list-detail-${index}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
