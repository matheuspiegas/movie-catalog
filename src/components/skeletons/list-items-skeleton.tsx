import { MediaCardSkeleton } from "@/components/skeletons/media-card-skeleton"

const listItems = Array.from({ length: 10 })

export function ListItemsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
      {listItems.map((_, index) => (
        <MediaCardSkeleton key={`list-items-${index}`} />
      ))}
    </div>
  )
}
