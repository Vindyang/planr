/**
 * Validates that courses don't appear multiple times in the plan
 */

import { Violation, ValidationContext } from "../types"
import { getSemesterLabel } from "../utils/semester-ordering"

export function validateDuplicates(context: ValidationContext): Violation[] {
  const violations: Violation[] = []
  const { semesters, completedCourses } = context

  // Build a map of courseId -> list of semesters it appears in
  const courseAppearances = new Map<string, Array<{ semesterId: string; term: string; year: number }>>()

  for (const semester of semesters) {
    for (const plannedCourse of semester.courses) {
      const appearances = courseAppearances.get(plannedCourse.courseId) || []
      appearances.push({
        semesterId: semester.id,
        term: semester.term,
        year: semester.year,
      })
      courseAppearances.set(plannedCourse.courseId, appearances)
    }
  }

  // Set of already completed course IDs
  const completedIds = new Set(completedCourses.map((cc) => cc.courseId))

  // Check for duplicates
  for (const [courseId, appearances] of courseAppearances) {
    // If course appears more than once
    if (appearances.length > 1) {
      const semesterLabels = appearances.map((a) => getSemesterLabel(a.term, a.year)).join(", ")

      for (const appearance of appearances) {
        const plannedCourse = semesters
          .find((s) => s.id === appearance.semesterId)
          ?.courses.find((c) => c.courseId === courseId)

        if (plannedCourse) {
          violations.push({
            type: "DUPLICATE_COURSE",
            severity: "error",
            courseId: plannedCourse.courseId,
            courseCode: plannedCourse.course.code,
            semesterId: appearance.semesterId,
            semesterLabel: getSemesterLabel(appearance.term, appearance.year),
            message: `${plannedCourse.course.code} appears multiple times in your plan (${semesterLabels})`,
            suggestion: `Remove duplicate instances of ${plannedCourse.course.code}`,
          })
        }
      }
    }

    // Check if planning a course that's already completed
    if (completedIds.has(courseId)) {
      for (const appearance of appearances) {
        const plannedCourse = semesters
          .find((s) => s.id === appearance.semesterId)
          ?.courses.find((c) => c.courseId === courseId)

        if (plannedCourse) {
          violations.push({
            type: "DUPLICATE_COURSE",
            severity: "warning",
            courseId: plannedCourse.courseId,
            courseCode: plannedCourse.course.code,
            semesterId: appearance.semesterId,
            semesterLabel: getSemesterLabel(appearance.term, appearance.year),
            message: `${plannedCourse.course.code} is already completed`,
            suggestion: `Remove ${plannedCourse.course.code} from your plan`,
          })
        }
      }
    }
  }

  return violations
}
