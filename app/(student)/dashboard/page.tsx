import { Suspense } from "react"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getStudentProfile } from "@/lib/data/students"
import { StatCardsSection } from "./components/StatCardsSection"
import { StatCardsSkeleton } from "./components/skeleton/StatCardsSkeleton"
import { EligibleCoursesSection } from "./components/EligibleCoursesSection"
import { EligibleCoursesListSkeleton } from "./components/skeleton/EligibleCoursesListSkeleton"
import { PlanSummarySection } from "./components/PlanSummarySection"
import { PlanSummarySkeleton } from "./components/skeleton/PlanSummarySkeleton"
import { UpcomingDeadlines } from "./components/UpcomingDeadlines"
import { UpcomingDeadlinesSkeleton } from "./components/skeleton/UpcomingDeadlinesSkeleton"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) {
    redirect("/login")
  }

  // Get basic student info for header (fast, cached)
  const student = await getStudentProfile(session.user.id)

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Student profile not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 bg-background min-h-screen -m-6 p-8 md:-m-8 md:p-10">
      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
            Home
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your planning overview for the upcoming term
          </p>
        </div>
        <div className="md:text-right">
          <span className="block text-sm mt-1 uppercase tracking-wider font-medium text-foreground">
            Welcome back, {student.user.name}
          </span>
          <span className="font-serif text-xl italic text-muted-foreground">
            Year {student.year} • {student.major.name}
          </span>
        </div>
      </header>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCardsSection userId={session.user.id} />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8 space-y-3">
          <div className="border-b border-border pb-3">
            <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Priority Courses
            </h2>
          </div>
          <Suspense fallback={<EligibleCoursesListSkeleton />}>
            <EligibleCoursesSection userId={session.user.id} />
          </Suspense>
        </section>

        <aside className="lg:col-span-4 space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Planning Snapshot
            </h2>
          </div>
          <Suspense fallback={<PlanSummarySkeleton />}>
            <PlanSummarySection userId={session.user.id} />
          </Suspense>

          <Suspense fallback={<UpcomingDeadlinesSkeleton />}>
            <UpcomingDeadlines />
          </Suspense>
        </aside>
      </div>
    </div>
  )
}
