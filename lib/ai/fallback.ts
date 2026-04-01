/**
 * Deterministic fallback roadmap generation when AI fails
 * Uses rule-based algorithms instead of LLM
 */

import type {
  AIRoadmap,
  AISemester,
  AICourse,
  AIGenerationContext,
  CourseContext,
  Term,
} from "./types"
import { WORKLOAD_CONFIG } from "./types"

/**
 * Generate a deterministic roadmap using rule-based algorithm
 * This is used as a fallback when AI output is invalid
 */
export async function generateDeterministicRoadmap(
  context: AIGenerationContext
): Promise<AIRoadmap> {
  const { student, availableCourses, preferences, universityRules } = context
  const workloadConfig = WORKLOAD_CONFIG[preferences.workloadLevel]

  // Filter out completed courses
  const incompleteCourses = availableCourses.filter(
    (c) => !student.completedCourseIds.includes(c.id)
  )

  const preferredSet = new Set(preferences.preferredCourses || [])
  const avoidSet = new Set(preferences.avoidCourses || [])

  // Distribute courses with strict prerequisite ordering
  const semesters = distributeCourses(
    incompleteCourses,
    new Set(student.completedCourseIds),
    preferences.startSemester,
    preferences.targetGraduation,
    preferences.includeSummerTerm,
    workloadConfig.min,
    workloadConfig.max,
    preferredSet,
    avoidSet
  )

  const totalUnits = semesters.reduce((sum, s) => sum + s.totalUnits, 0)
  const meetsRequirements = totalUnits >= universityRules.requiredTotalUnits

  return {
    semesters,
    totalSemesters: semesters.length,
    totalUnits,
    meetsRequirements,
  }
}

/**
 * Distribute courses across semesters ensuring hard prerequisites are completed in earlier terms.
 */
function distributeCourses(
  allCourses: CourseContext[],
  completedCourseIds: Set<string>,
  startSemester: { term: Term; year: number },
  targetGraduation: { term: Term; year: number },
  includeSummerTerm: boolean,
  minUnits: number,
  maxUnits: number,
  preferredSet: Set<string>,
  avoidSet: Set<string>
): AISemester[] {
  const semesters: AISemester[] = []
  const termSequence = generateTermSequence(
    startSemester,
    targetGraduation,
    includeSummerTerm
  )
  const remainingCourses = [...allCourses]
  const completedOrScheduledIds = new Set(completedCourseIds)

  for (const { term, year } of termSequence) {
    if (remainingCourses.length === 0) break

    const semesterCourses: AICourse[] = []
    let currentUnits = 0

    // Eligible means offered this term and all HARD prereqs completed in earlier semesters.
    const eligibleCourses = remainingCourses
      .filter((course) => course.termsOffered.includes(term))
      .filter((course) => {
        const hardPrereqs = course.prerequisites.filter((p) => p.type === "HARD")
        return hardPrereqs.every((p) => completedOrScheduledIds.has(p.courseId))
      })
      .sort((a, b) => scoreCourse(b, preferredSet, avoidSet) - scoreCourse(a, preferredSet, avoidSet))

    for (const course of eligibleCourses) {
      if (currentUnits + course.units > maxUnits) continue

      semesterCourses.push({
        id: course.id,
        code: course.code,
        title: course.title,
        units: course.units,
        reasoning: generateReasoning(course, currentUnits === 0),
      })
      currentUnits += course.units

      if (currentUnits >= minUnits) break
    }

    if (semesterCourses.length === 0) continue

    semesters.push({
      term,
      year,
      courses: semesterCourses,
      totalUnits: currentUnits,
      reasoning: generateSemesterReasoning(term, year, currentUnits, semesterCourses.length),
    })

    const semesterScheduledIds = new Set(semesterCourses.map((c) => c.id))
    semesterScheduledIds.forEach((id) => completedOrScheduledIds.add(id))

    for (const courseId of semesterScheduledIds) {
      const idx = remainingCourses.findIndex((c) => c.id === courseId)
      if (idx !== -1) {
        remainingCourses.splice(idx, 1)
      }
    }
  }

  return semesters
}

/**
 * Generate term sequence between start and target graduation, inclusive.
 */
function generateTermSequence(
  startSemester: { term: Term; year: number },
  targetGraduation: { term: Term; year: number },
  includeSummerTerm: boolean
): Array<{ term: Term; year: number }> {
  const terms: Term[] = includeSummerTerm
    ? ["Term 1", "Term 2", "Term 3"]
    : ["Term 1", "Term 2"]
  const sequence: Array<{ term: Term; year: number }> = []
  const normalizedTarget =
    !includeSummerTerm && targetGraduation.term === "Term 3"
      ? { term: "Term 2" as Term, year: targetGraduation.year }
      : targetGraduation

  let year = startSemester.year
  let termIndex = terms.indexOf(startSemester.term)
  if (termIndex === -1) termIndex = 0

  while (
    year < normalizedTarget.year ||
    (year === normalizedTarget.year && terms[termIndex] !== normalizedTarget.term)
  ) {
    sequence.push({ term: terms[termIndex], year })

    termIndex++
    if (termIndex >= terms.length) {
      termIndex = 0
      year++
    }

    // Safety check
    if (sequence.length > 24) break
  }

  sequence.push({ term: normalizedTarget.term, year: normalizedTarget.year })

  return sequence
}

function scoreCourse(
  course: CourseContext,
  preferredSet: Set<string>,
  avoidSet: Set<string>
): number {
  let score = 0

  if (preferredSet.has(course.id)) score += 1000
  if (avoidSet.has(course.id)) score -= 500

  // Prefer unlocking/foundation courses earlier.
  score += course.prerequisites.length === 0 ? 20 : 0
  score += course.prerequisites.length > 0 ? -5 * course.prerequisites.length : 0

  return score
}

/**
 * Generate reasoning for a course selection
 */
function generateReasoning(course: CourseContext, isFirst: boolean): string {
  const reasons: string[] = []

  if (isFirst && course.prerequisites.length === 0) {
    reasons.push("Foundation course with no prerequisites")
  } else if (course.prerequisites.length === 0) {
    reasons.push("No prerequisites required")
  } else {
    reasons.push("Prerequisites satisfied")
  }

  if (course.tags.includes("core") || course.tags.includes("required")) {
    reasons.push("required for major")
  }

  if (course.difficultyRating && course.difficultyRating < 3) {
    reasons.push("rated as accessible")
  }

  return reasons.join(", ")
}

/**
 * Generate reasoning for semester structure
 */
function generateSemesterReasoning(
  term: Term,
  year: number,
  units: number,
  courseCount: number
): string {
  let workloadDesc = "standard"
  if (units < 4) workloadDesc = "light"
  if (units > 5) workloadDesc = "intensive"

  return `${workloadDesc.charAt(0).toUpperCase() + workloadDesc.slice(1)} ${term} ${year} semester with ${courseCount} courses (${units} CU)`
}
