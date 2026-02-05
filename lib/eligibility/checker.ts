/**
 * Enhanced eligibility checking logic
 */

import { EligibilityStatus, MIN_GRADE_FOR_HARD_PREREQ } from "./constants"
import {
  DetailedEligibilityResult,
  MissingPrerequisite,
  GradeDeficiency,
  CourseWithPrereqs,
  CompletedCourseInfo,
  EligibilityOptions,
  EligibleCourseWithDetails,
  PrerequisiteType,
} from "./types"
import { meetsGradeRequirement, getGradeDeficit, isInProgressGrade } from "./grade-utils"
import { getRulesForUniversity } from "./rules"

/**
 * Check eligibility for a single course with detailed results
 */
export function checkCourseEligibility(
  course: CourseWithPrereqs,
  completedCourses: CompletedCourseInfo[],
  options: EligibilityOptions = {}
): DetailedEligibilityResult {
  const rules = options.rules ?? getRulesForUniversity(options.university ?? "SMU")
  const minGrade = rules.hardPrereqMinGrade

  // Build lookup maps for completed courses
  const completedMap = new Map<string, CompletedCourseInfo>()
  for (const cc of completedCourses) {
    completedMap.set(cc.courseId, cc)
  }

  const missingHardPrereqs: MissingPrerequisite[] = []
  const softWarnings: MissingPrerequisite[] = []
  const corequisitesNeeded: MissingPrerequisite[] = []
  const gradeDeficiencies: GradeDeficiency[] = []
  const reasons: string[] = []
  const suggestions: string[] = []

  // Check each prerequisite
  for (const prereq of course.prerequisites) {
    const prereqType = prereq.type.toLowerCase() as PrerequisiteType
    const completed = completedMap.get(prereq.prerequisiteCourseId)
    const prereqCourse = prereq.prerequisiteCourse

    const prereqInfo: MissingPrerequisite = {
      courseId: prereq.prerequisiteCourseId,
      courseCode: prereqCourse?.code ?? "Unknown",
      courseTitle: prereqCourse?.title ?? "Unknown Course",
      type: prereqType,
    }

    if (prereqType === "hard") {
      if (!completed) {
        // Hard prerequisite not completed at all
        missingHardPrereqs.push(prereqInfo)
        reasons.push(`Missing required prerequisite: ${prereqInfo.courseCode} ${prereqInfo.courseTitle}`)
        suggestions.push(`Complete ${prereqInfo.courseCode} with grade ${minGrade} or better`)
      } else if (isInProgressGrade(completed.grade)) {
        // Course in progress - treat as not completed for hard prereqs
        missingHardPrereqs.push(prereqInfo)
        reasons.push(`Prerequisite ${prereqInfo.courseCode} is still in progress`)
        suggestions.push(`Wait until ${prereqInfo.courseCode} is completed with grade ${minGrade} or better`)
      } else if (!meetsGradeRequirement(completed.grade, minGrade)) {
        // Completed but grade too low
        const deficit = getGradeDeficit(completed.grade, minGrade)
        gradeDeficiencies.push({
          courseId: prereq.prerequisiteCourseId,
          courseCode: prereqInfo.courseCode,
          courseTitle: prereqInfo.courseTitle,
          requiredGrade: minGrade,
          actualGrade: completed.grade,
          deficit,
        })
        reasons.push(
          `Grade in ${prereqInfo.courseCode} (${completed.grade}) does not meet minimum requirement (${minGrade})`
        )
        suggestions.push(`Consider retaking ${prereqInfo.courseCode} to improve grade to ${minGrade} or better`)
      }
    } else if (prereqType === "soft") {
      if (!completed) {
        softWarnings.push(prereqInfo)
        reasons.push(`Recommended prerequisite not completed: ${prereqInfo.courseCode}`)
        suggestions.push(`Consider taking ${prereqInfo.courseCode} first for better preparation`)
      }
    } else if (prereqType === "corequisite") {
      if (!completed) {
        corequisitesNeeded.push(prereqInfo)
        reasons.push(`Must enroll in ${prereqInfo.courseCode} concurrently`)
        suggestions.push(`Add ${prereqInfo.courseCode} to the same semester`)
      }
    }
  }

  // Determine overall status
  const hasHardPrereqIssues = missingHardPrereqs.length > 0 || gradeDeficiencies.length > 0
  const hasSoftWarnings = softWarnings.length > 0
  const hasCorequisites = corequisitesNeeded.length > 0

  let status: EligibilityStatus
  if (hasHardPrereqIssues) {
    status = EligibilityStatus.NOT_ELIGIBLE
  } else if (hasCorequisites) {
    status = EligibilityStatus.COREQUISITE_NEEDED
  } else if (hasSoftWarnings) {
    status = EligibilityStatus.WARNING
  } else {
    status = EligibilityStatus.ELIGIBLE
  }

  return {
    status,
    isEligible: !hasHardPrereqIssues,
    missingHardPrereqs,
    softWarnings,
    corequisitesNeeded,
    gradeDeficiencies,
    reasons,
    suggestions,
  }
}

/**
 * Get all eligible courses with detailed eligibility information
 */
export function getEligibleCoursesWithDetails(
  allCourses: CourseWithPrereqs[],
  completedCourses: CompletedCourseInfo[],
  options: EligibilityOptions = {}
): EligibleCourseWithDetails[] {
  // Build set of completed course IDs
  const completedIds = new Set(completedCourses.map((c) => c.courseId))

  // Filter out already completed courses and check eligibility
  return allCourses
    .filter((course) => !completedIds.has(course.id))
    .map((course) => ({
      course,
      eligibility: checkCourseEligibility(course, completedCourses, options),
    }))
    .filter((ec) => ec.eligibility.isEligible)
}

/**
 * Get all courses with eligibility status (including ineligible ones)
 */
export function getAllCoursesWithEligibility(
  allCourses: CourseWithPrereqs[],
  completedCourses: CompletedCourseInfo[],
  options: EligibilityOptions = {}
): EligibleCourseWithDetails[] {
  const completedIds = new Set(completedCourses.map((c) => c.courseId))

  return allCourses
    .filter((course) => !completedIds.has(course.id))
    .map((course) => ({
      course,
      eligibility: checkCourseEligibility(course, completedCourses, options),
    }))
}

/**
 * Generate a human-readable explanation of why a course is ineligible
 */
export function explainIneligibility(result: DetailedEligibilityResult): string {
  if (result.isEligible) {
    if (result.softWarnings.length > 0) {
      return "Eligible, but recommended prerequisites are missing."
    }
    if (result.corequisitesNeeded.length > 0) {
      return "Eligible if you enroll in corequisite courses concurrently."
    }
    return "Fully eligible to take this course."
  }

  const parts: string[] = []

  if (result.missingHardPrereqs.length > 0) {
    const codes = result.missingHardPrereqs.map((p) => p.courseCode).join(", ")
    parts.push(`Missing required prerequisites: ${codes}`)
  }

  if (result.gradeDeficiencies.length > 0) {
    const gradeIssues = result.gradeDeficiencies
      .map((g) => `${g.courseCode} (got ${g.actualGrade}, need ${g.requiredGrade})`)
      .join(", ")
    parts.push(`Grade requirements not met: ${gradeIssues}`)
  }

  return parts.join(". ") || "Ineligible for unknown reasons."
}
