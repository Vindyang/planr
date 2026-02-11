/**
 * Main validation orchestrator for semester plans
 */

import { ValidationResult, ValidationContext, PlanStatistics } from "../types"
import { validatePrerequisites } from "./prerequisite-validator"
import { validateCorequisites } from "./corequisite-validator"
import { validateDuplicates } from "./duplicate-validator"
import { validateOverload } from "./overload-validator"
import { validateTermAvailability } from "./term-validator"

/**
 * Validate an entire semester plan
 * Runs all validators and aggregates results
 */
export function validatePlan(context: ValidationContext): ValidationResult {
  const violations = [
    ...validatePrerequisites(context),
    ...validateCorequisites(context),
    ...validateDuplicates(context),
    ...validateOverload(context),
    ...validateTermAvailability(context),
  ]

  // Calculate plan statistics
  const statistics = calculatePlanStatistics(context)

  // Plan is valid if there are no error-level violations
  const isValid = !violations.some((v) => v.severity === "error")

  return {
    isValid,
    violations,
    statistics,
  }
}

/**
 * Calculate statistics about the plan
 */
function calculatePlanStatistics(context: ValidationContext): PlanStatistics {
  const { semesters, completedCourses, allCourses } = context

  // Total units across all planned semesters
  let totalUnits = 0
  let totalCourses = 0
  const unitsPerSemester: Record<string, number> = {}

  for (const semester of semesters) {
    const semesterKey = `${semester.term} ${semester.year}`
    const semesterUnits = semester.courses.reduce((sum, pc) => sum + pc.course.units, 0)

    unitsPerSemester[semesterKey] = semesterUnits
    totalUnits += semesterUnits
    totalCourses += semester.courses.length
  }

  // Count prerequisite completion
  const completedIds = new Set(completedCourses.map((cc) => cc.courseId))
  const allPlannedCourseIds = new Set(
    semesters.flatMap((s) => s.courses.map((c) => c.courseId))
  )

  let prerequisitesCompleted = 0
  let prerequisitesRemaining = 0

  // For each planned course, check how many prerequisites are completed
  for (const semester of semesters) {
    for (const plannedCourse of semester.courses) {
      const course = allCourses.find((c) => c.id === plannedCourse.courseId)
      if (!course) continue

      for (const prereq of course.prerequisites) {
        if (completedIds.has(prereq.prerequisiteCourseId)) {
          prerequisitesCompleted++
        } else if (!allPlannedCourseIds.has(prereq.prerequisiteCourseId)) {
          prerequisitesRemaining++
        }
      }
    }
  }

  const totalSemesters = semesters.length
  const averageUnitsPerSemester = totalSemesters > 0 ? totalUnits / totalSemesters : 0
  const semestersWithOverload = Object.values(unitsPerSemester).filter((u: number) => u > 18).length
  const completedUnitsTotal = completedCourses.reduce((sum: number, cc) => sum + (cc.course?.units || 0), 0)
  const completedCoursesCount = completedCourses.length
  const remainingCoursesCount = 0 // Would need total required courses to calculate
  const remainingUnitsCount = Math.max(0, 120 - completedUnitsTotal - totalUnits) // Assuming 120 units required

  return {
    totalSemesters,
    totalCourses,
    totalUnits,
    averageUnitsPerSemester,
    semestersWithOverload,
    completedCourses: completedCoursesCount,
    completedUnits: completedUnitsTotal,
    remainingCourses: remainingCoursesCount,
    remainingUnits: remainingUnitsCount,
  }
}

// Re-export individual validators for granular use
export { validatePrerequisites } from "./prerequisite-validator"
export { validateCorequisites } from "./corequisite-validator"
export { validateDuplicates } from "./duplicate-validator"
export { validateOverload } from "./overload-validator"
export { validateTermAvailability } from "./term-validator"
