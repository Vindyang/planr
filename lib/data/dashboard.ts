import { prisma } from "@/lib/prisma"

export async function getNextSemesterSummary(studentId: string) {
  // Determine next semester based on current date
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()

  let targetTerm: string
  let targetYear: number

  // Determine target semester
  // Jan-May (0-4): Term 2
  // Jun-Jul (5-6): Term 3
  // Aug-Dec (7-11): Term 1
  if (month >= 0 && month <= 4) {
    targetTerm = "Term 2"
    targetYear = year
  } else if (month >= 5 && month <= 6) {
    targetTerm = "Term 3"
    targetYear = year
  } else {
    // Aug-Dec: Term 1
    targetTerm = "Term 1"
    targetYear = year
  }

  // Fetch semester plan for target term
  const plan = await prisma.semesterPlan.findFirst({
    where: {
      studentId,
      term: targetTerm,
      year: targetYear,
    },
    include: {
      plannedCourses: {
        include: {
          course: true,
        },
      },
    },
  })

  return {
    coursesCount: plan?.plannedCourses.length || 0,
    totalUnits:
      plan?.plannedCourses.reduce(
        (sum, pc) => sum + pc.course.units,
        0
      ) || 0,
    term: targetTerm,
    year: targetYear,
  }
}
