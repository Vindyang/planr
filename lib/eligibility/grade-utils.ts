/**
 * Grade validation utilities for eligibility checking
 */

import { gradeToPoints } from "@/lib/gpa"

/**
 * Check if a grade meets the minimum requirement
 * @param grade - The student's grade (e.g., "B+", "C", "D")
 * @param minGrade - The minimum required grade (e.g., "C")
 * @returns true if the grade meets or exceeds the requirement
 */
export function meetsGradeRequirement(grade: string, minGrade: string): boolean {
  const gradePoints = gradeToPoints(grade)
  const minPoints = gradeToPoints(minGrade)

  // If either grade is invalid, consider requirement not met
  if (gradePoints === null || minPoints === null) {
    return false
  }

  return gradePoints >= minPoints
}

/**
 * Check if a grade is considered passing (D or better)
 * @param grade - The grade to check
 * @returns true if the grade is passing
 */
export function isPassingGrade(grade: string): boolean {
  return meetsGradeRequirement(grade, "D")
}

/**
 * Calculate the grade point deficit between actual and required grades
 * @param actualGrade - The student's actual grade
 * @param requiredGrade - The required minimum grade
 * @returns The deficit (positive if below requirement, 0 if met)
 */
export function getGradeDeficit(actualGrade: string, requiredGrade: string): number {
  const actualPoints = gradeToPoints(actualGrade)
  const requiredPoints = gradeToPoints(requiredGrade)

  if (actualPoints === null || requiredPoints === null) {
    return requiredPoints ?? 0 // Return full requirement as deficit if invalid
  }

  const deficit = requiredPoints - actualPoints
  return deficit > 0 ? Math.round(deficit * 10) / 10 : 0
}

/**
 * Check if a grade indicates the course is in progress
 * @param grade - The grade to check
 * @returns true if the grade indicates in-progress status
 */
export function isInProgressGrade(grade: string): boolean {
  const inProgressIndicators = ["IP", "In Progress", "W", "I", "Incomplete"]
  return inProgressIndicators.includes(grade)
}

/**
 * Format a grade requirement message
 * @param actualGrade - The student's actual grade
 * @param requiredGrade - The required minimum grade
 * @returns Human-readable message about the grade requirement
 */
export function formatGradeRequirementMessage(
  actualGrade: string,
  requiredGrade: string
): string {
  if (meetsGradeRequirement(actualGrade, requiredGrade)) {
    return `Grade ${actualGrade} meets requirement (${requiredGrade} or better)`
  }
  return `Grade ${actualGrade} does not meet minimum requirement (${requiredGrade})`
}
