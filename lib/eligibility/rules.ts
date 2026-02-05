/**
 * University-specific eligibility rules engine
 */

import { UniversityRules } from "./types"
import { MIN_GRADE_FOR_HARD_PREREQ } from "./constants"

/**
 * Default rules applied when no university-specific rules exist
 */
const DEFAULT_RULES: UniversityRules = {
  university: "DEFAULT",
  hardPrereqMinGrade: MIN_GRADE_FOR_HARD_PREREQ,
  softPrereqMinGrade: undefined, // No minimum for soft prereqs
  allowConcurrentCorequisites: true,
}

/**
 * University-specific rule overrides
 */
const UNIVERSITY_RULES: Record<string, Partial<UniversityRules>> = {
  SMU: {
    university: "SMU",
    hardPrereqMinGrade: "C",
    allowConcurrentCorequisites: true,
  },
  NUS: {
    university: "NUS",
    hardPrereqMinGrade: "C",
    allowConcurrentCorequisites: true,
  },
  NTU: {
    university: "NTU",
    hardPrereqMinGrade: "C",
    allowConcurrentCorequisites: true,
  },
  SUTD: {
    university: "SUTD",
    hardPrereqMinGrade: "C",
    allowConcurrentCorequisites: true,
  },
  SUSS: {
    university: "SUSS",
    hardPrereqMinGrade: "C",
    allowConcurrentCorequisites: true,
  },
}

/**
 * Get eligibility rules for a specific university
 * @param university - University code (e.g., "SMU", "NUS")
 * @returns Rules configuration for the university
 */
export function getRulesForUniversity(university: string): UniversityRules {
  const universityOverrides = UNIVERSITY_RULES[university.toUpperCase()]

  if (!universityOverrides) {
    return { ...DEFAULT_RULES, university }
  }

  return {
    ...DEFAULT_RULES,
    ...universityOverrides,
  }
}

/**
 * Validate if a set of rules is valid
 * @param rules - Rules to validate
 * @returns true if rules are valid
 */
export function validateRules(rules: UniversityRules): boolean {
  // Ensure minimum grade is a valid grade
  const validGrades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"]

  if (!validGrades.includes(rules.hardPrereqMinGrade)) {
    return false
  }

  if (rules.softPrereqMinGrade && !validGrades.includes(rules.softPrereqMinGrade)) {
    return false
  }

  return true
}

/**
 * Get all supported universities
 * @returns Array of supported university codes
 */
export function getSupportedUniversities(): string[] {
  return Object.keys(UNIVERSITY_RULES)
}
