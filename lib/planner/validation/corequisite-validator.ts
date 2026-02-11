/**
 * Corequisite Validator
 * Ensures courses are taken together with their corequisites in the same semester
 */

import { Violation, ValidationContext } from "../types"
import { getSemesterLabel } from "../utils/semester-ordering"

export function validateCorequisites(context: ValidationContext): Violation[] {
  const violations: Violation[] = []
  const { semesters, completedCourses, allCourses } = context

  // Track completed course IDs
  const completedIds = new Set(completedCourses.map((cc) => cc.courseId))

  for (const semester of semesters) {
    for (const plannedCourse of semester.courses) {
      const course = allCourses.find((c) => c.id === plannedCourse.courseId)
      if (!course) continue

      // Check each corequisite
      for (const prereq of course.prerequisites) {
        // Only check corequisites (type: "corequisite")
        if (prereq.type !== "corequisite") continue
        if (!prereq.prerequisiteCourse) continue // Skip if prerequisite course data is missing

        const coreqCourseId = prereq.prerequisiteCourseId

        // Check if corequisite is already completed
        if (completedIds.has(coreqCourseId)) continue

        // Check if corequisite is in the same semester
        const coreqInSameSemester = semester.courses.some(
          (c) => c.courseId === coreqCourseId
        )

        if (!coreqInSameSemester) {
          violations.push({
            type: "COREQUISITE_VIOLATION",
            severity: "error",
            courseId: course.id,
            courseCode: course.code,
            semesterId: semester.id,
            semesterLabel: getSemesterLabel(semester),
            message: `Missing corequisite: ${prereq.prerequisiteCourse.code} must be taken in the same semester`,
            suggestion: `Add ${prereq.prerequisiteCourse.code} to ${getSemesterLabel(semester)}`,
          })
        }
      }
    }
  }

  return violations
}
