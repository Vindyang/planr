import { AppLayout } from "@/components/layout/AppLayout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function PlannerLoading() {
  return (
    <AppLayout>
      <div className="flex h-full overflow-hidden bg-background">
        {/* Sidebar Skeleton */}
        <div className="w-64 border-r border-border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>

        {/* Main Board Skeleton */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 py-6 border-b bg-card">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>

          <div className="flex-1 overflow-x-auto p-8 bg-muted/20">
            <div className="flex gap-6 h-full min-w-fit">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="w-80 h-full p-4 space-y-4 flex-shrink-0">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-20 w-full" />
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="w-80 border-l border-border bg-card p-6 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
