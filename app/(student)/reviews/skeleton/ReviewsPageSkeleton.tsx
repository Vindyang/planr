import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function ReviewsPageSkeleton() {
  return (
    <div className="flex flex-col space-y-8 bg-background min-h-screen -m-6 p-10 md:-m-8 md:p-12">
      {/* Header Skeleton */}
      <header className="flex justify-between items-end border-b border-border pb-8">
        <Skeleton className="h-10 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
      </header>

      {/* Tabs Skeleton */}
      <div className="flex gap-0 border-b border-border">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-40" />
      </div>

      {/* Reviews List Skeleton */}
      <div className="grid gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
          </Card>
        ))}
      </div>
    </div>
  )
}
