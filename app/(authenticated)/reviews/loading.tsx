import { AppLayout } from "@/components/layout/AppLayout"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReviewsLoading() {
  return (
    <AppLayout>
      <div className="flex flex-col space-y-8 bg-background min-h-screen -m-6 p-10 md:-m-8 md:p-12">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>

        <Skeleton className="h-10 w-full max-w-md" />

        <div className="grid gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-border p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
