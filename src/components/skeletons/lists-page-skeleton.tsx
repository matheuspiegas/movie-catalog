import { Skeleton } from "@/components/ui/skeleton"
import { ListCardSkeleton } from "@/components/skeletons/list-card-skeleton"

const listItems = Array.from({ length: 8 })

export function ListsPageSkeleton() {
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-9 w-56 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listItems.map((_, index) => (
          <ListCardSkeleton key={`list-skeleton-${index}`} />
        ))}
      </div>
    </div>
  )
}
