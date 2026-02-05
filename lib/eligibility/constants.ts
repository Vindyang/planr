/**
 * Eligibility system constants
 */

export enum EligibilityStatus {
  ELIGIBLE = "ELIGIBLE",               // Green - all requirements met
  WARNING = "WARNING",                  // Yellow - soft prereqs missing
  NOT_ELIGIBLE = "NOT_ELIGIBLE",        // Red - hard prereqs not met
  COREQUISITE_NEEDED = "COREQUISITE_NEEDED", // Blue - must enroll together
}

/**
 * Minimum grade required for hard prerequisites.
 * Students must achieve at least this grade for the prereq to count.
 */
export const MIN_GRADE_FOR_HARD_PREREQ = "C"

/**
 * Maximum depth for prerequisite chain traversal.
 * Prevents infinite loops and limits computation.
 */
export const MAX_PREREQ_CHAIN_DEPTH = 10
