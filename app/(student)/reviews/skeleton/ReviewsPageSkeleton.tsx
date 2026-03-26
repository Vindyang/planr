import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function ReviewsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 bg-background min-h-screen -m-6 p-10 md:-m-8 md:p-12">
      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </header>

      <div className="flex gap-2 border-b border-border pb-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-44" />
      </div>

      <div className="grid gap-5 pt-2 min-h-[420px]">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 space-y-4 bg-card border border-border shadow-none rounded-none">
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
