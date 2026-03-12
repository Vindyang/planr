import { Skeleton } from "@/components/ui/skeleton"

export function PlannerSkeleton() {
  return (
    <div className="flex items-start h-[calc(100vh-4rem)] bg-[#F4F1ED] overflow-hidden">

      {/* Main Content Area */}
      <div className="flex flex-1 h-full overflow-hidden">
          <main className="flex-1 h-full overflow-y-auto scroll-smooth bg-[#F4F1ED]">
             <div className="px-[60px] py-12 max-w-[1400px] mx-auto space-y-16">

                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#DAD6CF] pb-8">
                    <div className="space-y-4">
                        <div className="flex gap-6">
                            <Skeleton className="h-8 w-32 bg-[#DAD6CF]" />
                            <Skeleton className="h-8 w-24 bg-[#DAD6CF]" />
                        </div>
                        <Skeleton className="h-12 w-64 bg-[#DAD6CF]" />
                    </div>
                </div>

                {/* Year Groups Skeleton */}
                <div className="space-y-16">
                    {[2024, 2025, 2026].map((year) => (
                        <div key={year} className="mb-16">
                            <Skeleton className="h-4 w-32 mb-8 bg-[#DAD6CF]" />
                            {/* Grid mimicking YearSection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#DAD6CF] border border-[#DAD6CF]">
                                {[1, 2, 3, 4].map((term) => (
                                    <div key={term} className="bg-[#F4F1ED] p-6 h-[280px] flex flex-col">
                                        <div className="flex justify-between items-start mb-6 border-b border-[#DAD6CF] pb-2">
                                            <Skeleton className="h-4 w-16 bg-[#DAD6CF]" />
                                            <Skeleton className="h-4 w-12 bg-[#DAD6CF]" />
                                        </div>
                                        <div className="space-y-3">
                                            <Skeleton className="h-10 w-full bg-[#E5E2DE]" />
                                            <Skeleton className="h-10 w-full bg-[#E5E2DE]" />
                                            <Skeleton className="h-10 w-full bg-[#E5E2DE]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          </main>

          {/* Right Sidebar Skeleton */}
          <aside className="w-[340px] border-l border-[#DAD6CF] bg-white h-full flex flex-col shrink-0">
              {/* Tabs */}
              <div className="flex border-b border-[#DAD6CF] h-14">
                  <div className="flex-1 bg-[#F4F1ED]" />
                  <div className="w-px bg-[#DAD6CF]" />
                  <div className="flex-1" />
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                  <div className="space-y-2">
                      <Skeleton className="h-8 w-48 bg-[#F4F1ED]" />
                      <Skeleton className="h-4 w-full bg-[#F4F1ED]" />
                  </div>

                  {/* Ring Chart Skeleton */}
                  <div className="flex justify-center py-4">
                      <Skeleton className="h-48 w-48 rounded-full bg-[#F4F1ED]" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-20 w-full bg-[#F4F1ED]" />
                      <Skeleton className="h-20 w-full bg-[#F4F1ED]" />
                  </div>
              </div>
          </aside>
      </div>
    </div>
  )
}
