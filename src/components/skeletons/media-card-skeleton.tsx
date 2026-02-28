import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function MediaCardSkeleton() {
  return (
    <Card className="overflow-hidden pt-0 h-full">
      <CardHeader className="p-0">
        <Skeleton className="w-full aspect-2/3 rounded-none" />
      </CardHeader>
      <CardContent className="pt-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/2" />
      </CardContent>
    </Card>
  )
}
