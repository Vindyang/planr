const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0,
  "A": 4.0,
  "A-": 3.7,
  "B+": 3.3,
  "B": 3.0,
  "B-": 2.7,
  "C+": 2.3,
  "C": 2.0,
  "C-": 1.7,
  "D+": 1.3,
  "D": 1.0,
  "F": 0.0,
}

export const VALID_GRADES = Object.keys(GRADE_POINTS)

export function gradeToPoints(grade: string): number | null {
  return GRADE_POINTS[grade] ?? null
}

export function calculateGPA(
  courses: Array<{ grade: string; units: number }>
): number {
  const gradedCourses = courses.filter((c) => gradeToPoints(c.grade) !== null)

  if (gradedCourses.length === 0) return 0

  let totalPoints = 0
  let totalUnits = 0

  for (const course of gradedCourses) {
    const points = gradeToPoints(course.grade)!
    totalPoints += points * course.units
    totalUnits += course.units
  }

  if (totalUnits === 0) return 0
  return Math.round((totalPoints / totalUnits) * 100) / 100
}
