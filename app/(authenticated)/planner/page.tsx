import { getPlannerData } from "@/lib/planner/actions"
import { getCoursesWithDisplayData } from "@/lib/data/courses"
import { requireSession } from "@/lib/auth"
import { getStudentProfile } from "@/lib/data/students"
import PlannerClient from "./PlannerClient"

export default async function PlannerPage() {
  const session = await requireSession()

  // Fetch student profile to get university
  const student = await getStudentProfile(session.user.id)

  if (!student) {
    return <div>Student profile not found</div>
  }

  // Parallel data fetching - both queries now cached
  const [plannerData, allCourses] = await Promise.all([
    getPlannerData(student.id),
    getCoursesWithDisplayData(student.university)
  ])

  // Calculate completed units
  const completedUnits = student.completedCourses?.reduce(
    (sum: number, cc) => sum + (cc.course?.units || 0),
    0
  ) || 0

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 md:-m-8 bg-background">
      <PlannerClient
        initialData={plannerData}
        allCourses={allCourses}
        completedUnits={completedUnits}
      />
    </div>
  )
}
