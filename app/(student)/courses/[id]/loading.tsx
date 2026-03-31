import { Skeleton } from "@/components/ui/skeleton"

export default function CourseDetailLoading() {
  return (
    <div className="flex flex-col space-y-8 bg-background min-h-screen -m-6 p-10 md:-m-8 md:p-12">
      {/* Back link */}
      <Skeleton className="h-4 w-28" />

      {/* Header */}
      <header className="border-b border-border pb-8 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-10 w-80" />
      </header>

      {/* Tab bar */}
      <div className="border-b border-border flex gap-8 pb-0">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-16" />
      </div>

      {/* Overview tab content */}
      <div className="grid gap-12 md:grid-cols-3 pt-4">
        {/* Main content */}
        <div className="md:col-span-2 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-6">
          <div className="border border-border p-6 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-16" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
