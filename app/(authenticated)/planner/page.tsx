import { getPlannerData } from "@/lib/planner/actions"
import { getAllCoursesForUniversity } from "@/lib/data/courses"
import { requireStudent } from "@/lib/auth"
import { getStudentByUserId } from "@/lib/data/students"
import PlannerClient from "./PlannerClient"

export default async function PlannerPage() {
  const user = await requireStudent()

  // Fetch student profile to get university
  const student = await getStudentByUserId(user.id)

  if (!student) {
    return <div>Student profile not found</div>
  }

  // Parallel data fetching with student's actual university
  const [plannerData, allCourses] = await Promise.all([
    getPlannerData(),
    getAllCoursesForUniversity(student.university)
  ])

  // Calculate completed units
  const completedUnits = student.completedCourses?.reduce(
    (sum, cc) => sum + (cc.course?.units || 0),
    0
  ) || 0

  return (
    <div className="h-full">
      <PlannerClient
        initialData={plannerData}
        allCourses={allCourses}
        completedUnits={completedUnits}
      />
    </div>
  )
}
