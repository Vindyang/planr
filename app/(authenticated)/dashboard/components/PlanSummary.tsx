import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IconChevronRight } from "@tabler/icons-react"
import { Prisma } from "@prisma/client"

type SemesterPlan = Prisma.semesterPlanGetPayload<{
  include: { plannedCourses: { include: { course: true } } }
}>

type PlanSummaryProps = {
  semesterPlans: SemesterPlan[]
}

export function PlanSummary({ semesterPlans }: PlanSummaryProps) {
  // Find current/next semester plan
  const relevantPlan = findRelevantSemester(semesterPlans)

  if (!relevantPlan || relevantPlan.plannedCourses.length === 0) {
    return (
      <Card className="p-6 bg-card border border-border shadow-none rounded-none">
        <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-2">
          Your Plan
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          No courses planned yet.
        </p>
        <Link href="/planner">
          <Button variant="outline" size="sm" className="w-full">
            Create Semester Plan
          </Button>
        </Link>
      </Card>
    )
  }

  const totalUnits = relevantPlan.plannedCourses.reduce(
    (sum, pc) => sum + pc.course.units,
    0
  )

  return (
    <Card className="p-6 bg-card border border-border shadow-none rounded-none">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">
            {relevantPlan.term} {relevantPlan.year}
          </h3>
          <p className="text-sm text-muted-foreground">
            {relevantPlan.plannedCourses.length} courses · {totalUnits} units
          </p>
        </div>
        {totalUnits > 18 && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
            Overload
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {relevantPlan.plannedCourses.slice(0, 4).map((pc) => (
          <div key={pc.id} className="flex justify-between text-sm">
            <span className="font-medium">{pc.course.code}</span>
            <span className="text-muted-foreground">{pc.course.units} units</span>
          </div>
        ))}

        {relevantPlan.plannedCourses.length > 4 && (
          <p className="text-xs text-muted-foreground">
            +{relevantPlan.plannedCourses.length - 4} more
          </p>
        )}
      </div>

      <Link href="/planner">
        <Button variant="outline" size="sm" className="w-full">
          View Full Plan
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </Card>
  )
}

function findRelevantSemester(plans: SemesterPlan[]) {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()

  let targetTerm: string
  let targetYear: number

  // Determine target semester based on current month
  if (month >= 0 && month <= 4) {
    // Jan-May: Spring semester
    targetTerm = "Spring"
    targetYear = year
  } else if (month >= 7 && month <= 11) {
    // Aug-Dec: Fall semester
    targetTerm = "Fall"
    targetYear = year
  } else {
    // Jun-Jul: Fall semester
    targetTerm = "Fall"
    targetYear = year
  }

  // Try to find exact match first
  const exactMatch = plans.find(
    (p) => p.term === targetTerm && p.year === targetYear
  )
  if (exactMatch) return exactMatch

  // Otherwise return the earliest upcoming semester
  const sorted = [...plans].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    const termOrder: Record<string, number> = { Spring: 0, Summer: 1, Fall: 2 }
    return (termOrder[a.term] || 0) - (termOrder[b.term] || 0)
  })

  return sorted[0]
}
