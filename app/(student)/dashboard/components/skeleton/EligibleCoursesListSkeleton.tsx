import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function EligibleCoursesListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-64" />
      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 space-y-3">
            <div className="flex justify-between mb-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-2 pt-4 border-t">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
