import { prisma } from "@/lib/prisma"

export async function getNextSemesterSummary(studentId: string) {
  // Determine next semester based on current date
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()

  let targetTerm: string
  let targetYear: number

  // Determine target semester
  // Jan-May (0-4): Spring semester
  // Jun-Jul (5-6): Fall semester
  // Aug-Dec (7-11): Fall semester
  if (month >= 0 && month <= 4) {
    targetTerm = "Spring"
    targetYear = year
  } else if (month >= 7 && month <= 11) {
    targetTerm = "Fall"
    targetYear = year
  } else {
    // Jun-Jul: look for Fall
    targetTerm = "Fall"
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
