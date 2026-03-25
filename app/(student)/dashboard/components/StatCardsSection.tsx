import { getStudentProfile } from "@/lib/data/students"
import { getPlannerData } from "@/lib/planner/actions"
import { StatCards } from "./StatCards"

function getNextSemesterFromPlans(
  semesterPlans: Awaited<ReturnType<typeof getPlannerData>>["semesterPlans"]
) {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const targetTerm = month >= 0 && month <= 3 ? "Term 2" : month >= 4 && month <= 6 ? "Term 3" : "Term 1"

  const plan = semesterPlans.find(
    (p) => p.term === targetTerm && p.year === year
  )

  return {
    coursesCount: plan?.plannedCourses.length ?? 0,
    totalUnits:
      plan?.plannedCourses.reduce((sum, pc) => sum + pc.course.units, 0) ?? 0,
    term: targetTerm,
    year,
  }
}

export async function StatCardsSection({ userId }: { userId: string }) {
  const student = await getStudentProfile(userId)

  if (!student) {
    throw new Error("Student profile not found")
  }

  const plannerData = await getPlannerData(student.id)
  const nextSemester = getNextSemesterFromPlans(plannerData.semesterPlans)

  const completedUnits = student.completedCourses.reduce(
    (sum, cc) => sum + cc.course.units,
    0
  )

  const plannedUnits = plannerData.semesterPlans.reduce(
    (sum, plan) => sum + plan.plannedCourses.reduce((s, pc) => s + pc.course.units, 0),
    0
  )

  const remainingUnits = Math.max(0, 120 - completedUnits - plannedUnits)

  return (
    <StatCards
      gpa={student.gpa}
      unitsEarned={completedUnits}
      year={student.year}
      major={student.major.name}
      nextSemesterCourses={nextSemester.coursesCount}
      totalCoursesTaken={student.completedCourses.length}
      remainingUnits={remainingUnits}
    />
  )
}
