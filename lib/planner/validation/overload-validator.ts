/**
 * Validates that terms don't exceed the maximum unit limit
 */

import { Violation, ValidationContext } from "../types"
import { getSemesterLabel } from "../utils/semester-ordering"

const MAX_UNITS_PER_TERM = 18
const RECOMMENDED_UNITS = 15

export function validateOverload(context: ValidationContext): Violation[] {
  const violations: Violation[] = []
  const { semesters } = context

  for (const semester of semesters) {
    const semesterLabel = getSemesterLabel(semester)

    // Calculate total units for this term
    const totalUnits = semester.courses.reduce((sum, pc) => sum + pc.course.units, 0)

    if (totalUnits > MAX_UNITS_PER_TERM) {
      // Hard error for exceeding max units
      violations.push({
        type: "OVERLOAD",
        severity: "error",
        courseId: "", // This violation applies to the whole semester
        courseCode: "",
        semesterId: semester.id,
        semesterLabel,
        message: `${semesterLabel} has ${totalUnits} units (max allowed: ${MAX_UNITS_PER_TERM})`,
        suggestion: `Remove ${totalUnits - MAX_UNITS_PER_TERM} units from this term`,
      })
    } else if (totalUnits > RECOMMENDED_UNITS) {
      // Warning for exceeding recommended units
      violations.push({
        type: "OVERLOAD",
        severity: "warning",
        courseId: "",
        courseCode: "",
        semesterId: semester.id,
        semesterLabel,
        message: `${semesterLabel} has ${totalUnits} units (recommended max: ${RECOMMENDED_UNITS})`,
        suggestion: `Consider balancing your workload - ${totalUnits} units may be challenging`,
      })
    }
  }

  return violations
}
