/**
 * Validates that courses are offered in the planned term
 */

import { Violation, ValidationContext } from "../types"
import { getSemesterLabel } from "../utils/semester-ordering"

export function validateTermAvailability(context: ValidationContext): Violation[] {
  const violations: Violation[] = []
  const { semesters } = context

  for (const semester of semesters) {
    const semesterLabel = getSemesterLabel(semester)

    for (const plannedCourse of semester.courses) {
      const dbTerms = plannedCourse.course.termsOffered || []
      
      const mapTermToSMU = (term: string) => {
        const t = term.toLowerCase()
        if (t.includes('fall') || t.includes('autumn')) return 'Term 1'
        if (t.includes('spring') || t.includes('winter')) return 'Term 2'
        if (t.includes('summer')) return 'Term 3'
        return term
      }
      
      const termsOffered = Array.from(new Set(dbTerms.map(mapTermToSMU)))

      // Check if the course is offered in this term
      if (termsOffered.length > 0 && !termsOffered.includes(semester.term)) {
        violations.push({
          type: "TERM_UNAVAILABLE",
          severity: "error", // Changed from "warning" - courses MUST be offered in the term
          courseId: plannedCourse.courseId,
          courseCode: plannedCourse.course.code,
          semesterId: semester.id,
          semesterLabel,
          message: `${plannedCourse.course.code} is typically offered in ${termsOffered.join(", ")}, not ${semester.term}`,
          suggestion: `Move ${plannedCourse.course.code} to ${termsOffered[0]}`,
        })
      }
    }
  }

  return violations
}
