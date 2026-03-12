import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function ProfilePageSkeleton() {
  return (
    <div className="flex flex-col space-y-8">
      {/* Header Skeleton */}
      <header className="flex items-end justify-between pb-6 border-b border-border">
        <Skeleton className="h-12 w-48" />
      </header>

      {/* Two Column Cards */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Personal Details Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Card className="p-6 space-y-6">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          </Card>
        </div>

        {/* Academic Information Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Card className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-border/50">
              <div className="space-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
            <div className="pt-4 border-t border-dashed border-border/50">
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Completed Courses Skeleton */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>

        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 border border-input/50 space-y-3">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-full" />
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
