import { Skeleton } from "@/components/ui/skeleton"

export function MediaPageSkeleton() {
  return (
    <div className="pb-8">
      {/* Backdrop Skeleton */}
      <div className="relative -mx-4 mb-8 h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden rounded-b-2xl">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Poster Skeleton */}
        <div className="lg:w-1/3 space-y-6">
          <Skeleton className="w-full aspect-[2/3] rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        
        <div className="lg:w-2/3 space-y-6">
          {/* Tabs Skeleton */}
          <Skeleton className="h-10 w-full rounded-lg" />
          
          {/* Content */}
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
