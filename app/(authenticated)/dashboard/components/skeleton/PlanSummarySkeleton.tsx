import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function PlanSummarySkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </Card>
  )
}
