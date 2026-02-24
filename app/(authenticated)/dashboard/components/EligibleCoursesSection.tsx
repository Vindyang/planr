import { getStudentProfile } from "@/lib/data/students"
import { getCoursesWithDisplayData } from "@/lib/data/courses"
import { getPlannerData } from "@/lib/planner/actions"
import {
  getEligibleCoursesWithDetails,
  CourseWithPrereqs,
  CompletedCourseInfo,
} from "@/lib/eligibility"
import { EligibleCoursesList } from "./EligibleCoursesList"

export async function EligibleCoursesSection({ userId }: { userId: string }) {
  const student = await getStudentProfile(userId)

  if (!student) {
    throw new Error("Student profile not found")
  }

  // Fetch courses and planner data in parallel
  const [courses, plannerData] = await Promise.all([
    getCoursesWithDisplayData(student.university),
    getPlannerData(student.id),
  ])

  // Transform completed courses for eligibility checking
  const completedCoursesInfo: CompletedCourseInfo[] = student.completedCourses.map((cc) => ({
    courseId: cc.courseId,
    grade: cc.grade,
    course: cc.course,
  }))

  // Get eligible courses
  const eligibleCourses = getEligibleCoursesWithDetails(
    courses as CourseWithPrereqs[],
    completedCoursesInfo,
    { university: student.university }
  )

  // Filter out courses that are already in the planner
  const plannedCourseIds = new Set<string>()
  plannerData.semesterPlans.forEach((plan) => {
    plan.plannedCourses.forEach((pc) => {
      plannedCourseIds.add(pc.courseId)
    })
  })

  const filteredEligibleCourses = eligibleCourses.filter(
    (ec) => !plannedCourseIds.has(ec.course.id)
  )

  return (
    <div>
      <h3 className="text-xl font-semibold tracking-tight mb-4">
        Eligible Courses for Next Semester
      </h3>
      <EligibleCoursesList
        courses={filteredEligibleCourses}
        semesterPlans={plannerData.semesterPlans}
      />
    </div>
  )
}
