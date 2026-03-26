import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function UpcomingDeadlinesSkeleton() {
  return (
    <Card className="p-6 bg-card border border-border shadow-none rounded-none space-y-4">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-4 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Card>
  )
}
