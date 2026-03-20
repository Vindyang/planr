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
    <div className="flex flex-col space-y-8 bg-background min-h-screen -m-6 p-10 md:-m-8 md:p-12">
      {/* Header - Shows immediately */}
      <header className="flex justify-between items-start border-b border-border pb-8">
        <div>
          <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
            Home <br />
          </h1>
        </div>
        <div className="text-right">
          <span className="block text-sm mt-1 uppercase tracking-wider font-medium text-foreground">
            Welcome back, {student.user.name}
          </span>
          <span className="font-serif text-xl italic text-muted-foreground">
            Year {student.year} • {student.major.name}
          </span>
        </div>
      </header>

      {/* Stat Cards - Loads independently */}
      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCardsSection userId={session.user.id} />
      </Suspense>

      {/* Main Content: Eligible Courses + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Eligible Courses - Loads independently (slowest) */}
        <div className="lg:col-span-2">
          <Suspense fallback={<EligibleCoursesListSkeleton />}>
            <EligibleCoursesSection userId={session.user.id} />
          </Suspense>
        </div>

        <div className="space-y-6">
          {/* Plan Summary - Loads independently */}
          <Suspense fallback={<PlanSummarySkeleton />}>
            <PlanSummarySection userId={session.user.id} />
          </Suspense>

          {/* Upcoming Deadlines - Static, no loading needed */}
          <Suspense fallback={<UpcomingDeadlinesSkeleton />}>
            <UpcomingDeadlines />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
