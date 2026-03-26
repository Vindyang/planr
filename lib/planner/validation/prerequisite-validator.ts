/**
 * Prerequisite Validator
 * Ensures courses are taken after their prerequisites
 */

import { Violation, ValidationContext } from "../types"
import { buildSemesterOrderMap, getSemesterLabel } from "../utils/semester-ordering"

export function validatePrerequisites(context: ValidationContext): Violation[] {
  const violations: Violation[] = []
  const { semesters, completedCourses, allCourses } = context

  // Build semester ordering
  const semesterOrder = buildSemesterOrderMap(semesters)

  // Track which courses have been seen so far (completed + planned before current)
  const completedIds = new Set(completedCourses.map((cc) => cc.courseId))

  for (const semester of semesters) {
    for (const plannedCourse of semester.courses) {
      const course = allCourses.find((c) => c.id === plannedCourse.courseId)
      if (!course) continue

      // Check each prerequisite
      for (const prereq of course.prerequisites) {
        // Skip corequisites (type: "corequisite")
        if (prereq.type === "corequisite") continue
        if (!prereq.prerequisiteCourse) continue // Skip if prerequisite course data is missing

        const prereqCourseId = prereq.prerequisiteCourseId

        // Check if prerequisite is completed
        if (completedIds.has(prereqCourseId)) continue

        // Check if prerequisite is planned in an earlier term
        let prereqSemester = null
        for (const sem of semesters) {
          const found = sem.courses.find((c) => c.courseId === prereqCourseId)
          if (found) {
            prereqSemester = sem
            break
          }
        }

        if (!prereqSemester) {
          // Prerequisite not completed and not planned
          violations.push({
            type: "PREREQUISITE_VIOLATION",
            severity: "error",
            courseId: course.id,
            courseCode: course.code,
            semesterId: semester.id,
            semesterLabel: getSemesterLabel(semester),
            message: `Missing prerequisite: ${prereq.prerequisiteCourse.code} - ${prereq.prerequisiteCourse.title}`,
            suggestion: `Add ${prereq.prerequisiteCourse.code} to an earlier term`,
          })
        } else {
          // Check if prerequisite is in an earlier term
          const currentOrder = semesterOrder.get(semester.id) ?? 0
          const prereqOrder = semesterOrder.get(prereqSemester.id) ?? 0

          if (prereqOrder >= currentOrder) {
            violations.push({
              type: "PREREQUISITE_VIOLATION",
              severity: "error",
              courseId: course.id,
              courseCode: course.code,
              semesterId: semester.id,
              semesterLabel: getSemesterLabel(semester),
              message: `Prerequisite ${prereq.prerequisiteCourse.code} must be taken before ${course.code}`,
              suggestion: `Move ${prereq.prerequisiteCourse.code} to ${getSemesterLabel(semester)} or earlier`,
            })
          }
        }
      }
    }
  }

  return violations
}
