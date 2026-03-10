import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function CoursesPageSkeleton() {
  return (
    <div className="flex flex-col space-y-8 bg-background min-h-screen -m-6 p-10 md:-m-8 md:p-12">
      {/* Header Skeleton */}
      <header className="flex justify-between items-end border-b border-border pb-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-40" />
      </header>

      {/* Search Bar Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />

        {/* Filter Buttons Skeleton */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
      </div>

      {/* Course Grid Skeleton */}
      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <Card key={i} className="p-6 space-y-3 h-full">
            <div className="flex justify-between mb-3">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-1">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="pt-4 border-t border-muted mt-6">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
