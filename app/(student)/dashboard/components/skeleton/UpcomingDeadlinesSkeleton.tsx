import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function UpcomingDeadlinesSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <Skeleton className="h-5 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Card>
  )
}
