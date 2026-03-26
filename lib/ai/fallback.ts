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
import type { CourseWithPrereqs } from "@/lib/eligibility/types"

/**
 * Generate a deterministic roadmap using rule-based algorithm
 * This is used as a fallback when Groq API fails
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

  // Prioritize preferred courses
  const preferredSet = new Set(preferences.preferredCourses || [])
  const avoidSet = new Set(preferences.avoidCourses || [])

  // Convert to CourseWithPrereqs format for prerequisite graph
  const coursesMap = new Map<string, CourseWithPrereqs>(
    availableCourses.map((c) => [
      c.id,
      {
        id: c.id,
        code: c.code,
        title: c.title,
        units: c.units,
        prerequisites: c.prerequisites.map((p) => ({
          prerequisiteCourseId: p.courseId,
          type: p.type,
        })),
      },
    ])
  )

  // Get topological ordering of all courses
  const orderedCourses = getTopologicalOrder(
    incompleteCourses,
    coursesMap,
    new Set(student.completedCourseIds),
    preferredSet,
    avoidSet
  )

  // Distribute courses across semesters
  const semesters = distributeCourses(
    orderedCourses,
    preferences.targetGraduation,
    workloadConfig.min,
    workloadConfig.max,
    availableCourses
  )

  // Calculate totals
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
 * Get topological ordering of courses respecting prerequisites
 */
function getTopologicalOrder(
  courses: CourseContext[],
  coursesMap: Map<string, CourseWithPrereqs>,
  completedIds: Set<string>,
  preferredSet: Set<string>,
  avoidSet: Set<string>
): CourseContext[] {
  const remaining = [...courses]
  const ordered: CourseContext[] = []
  const scheduledIds = new Set<string>()

  // Priority scoring
  const getPriority = (course: CourseContext): number => {
    let priority = 0

    // Preferred courses get highest priority
    if (preferredSet.has(course.id)) priority += 1000

    // Avoid courses get negative priority
    if (avoidSet.has(course.id)) priority -= 500

    // Prioritize courses with no remaining prerequisites
    const prereqCount = course.prerequisites.filter(
      (p) => !completedIds.has(p.courseId) && !scheduledIds.has(p.courseId)
    ).length
    priority -= prereqCount * 10

    // Prioritize foundation courses (courses that unlock others)
    priority += course.prerequisites.length > 0 ? 5 : 0

    return priority
  }

  // Keep scheduling until we run out of courses
  while (remaining.length > 0) {
    // Find courses with all prerequisites met
    const eligible = remaining.filter((course) => {
      const hardPrereqs = course.prerequisites.filter((p) => p.type === "HARD")
      return hardPrereqs.every(
        (p) => completedIds.has(p.courseId) || scheduledIds.has(p.courseId)
      )
    })

    if (eligible.length === 0) {
      // No eligible courses - might be circular dependency or missing data
      // Just take the first remaining course
      if (remaining.length > 0) {
        const course = remaining.shift()!
        ordered.push(course)
        scheduledIds.add(course.id)
      }
      continue
    }

    // Sort by priority
    eligible.sort((a, b) => getPriority(b) - getPriority(a))

    // Take the highest priority eligible course
    const nextCourse = eligible[0]
    ordered.push(nextCourse)
    scheduledIds.add(nextCourse.id)

    // Remove from remaining
    const index = remaining.findIndex((c) => c.id === nextCourse.id)
    if (index >= 0) {
      remaining.splice(index, 1)
    }
  }

  return ordered
}

/**
 * Distribute courses across semesters
 */
function distributeCourses(
  orderedCourses: CourseContext[],
  targetGraduation: { term: Term; year: number },
  minUnits: number,
  maxUnits: number,
  allCourses: CourseContext[]
): AISemester[] {
  const semesters: AISemester[] = []
  const termSequence = generateTermSequence(targetGraduation)
  let courseIndex = 0

  for (const { term, year } of termSequence) {
    if (courseIndex >= orderedCourses.length) {
      break // All courses scheduled
    }

    const semesterCourses: AICourse[] = []
    let currentUnits = 0

    // Schedule courses for this semester
    while (courseIndex < orderedCourses.length && currentUnits < maxUnits) {
      const course = orderedCourses[courseIndex]

      // Check if course is offered this term
      if (!course.termsOffered.includes(term)) {
        // Try next course
        courseIndex++
        continue
      }

      // Check if adding this course would exceed max units
      if (currentUnits + course.units > maxUnits) {
        // Try next course if we haven't reached minimum
        if (currentUnits >= minUnits) {
          break // Semester is full enough
        }
        courseIndex++
        continue
      }

      // Add course to semester
      semesterCourses.push({
        id: course.id,
        code: course.code,
        title: course.title,
        units: course.units,
        reasoning: generateReasoning(course, currentUnits === 0),
      })

      currentUnits += course.units
      courseIndex++
    }

    // Only add semester if it has courses
    if (semesterCourses.length > 0) {
      semesters.push({
        term,
        year,
        courses: semesterCourses,
        totalUnits: currentUnits,
        reasoning: generateSemesterReasoning(
          term,
          year,
          currentUnits,
          semesterCourses.length
        ),
      })
    }

    // Stop if we've scheduled all courses
    if (courseIndex >= orderedCourses.length) {
      break
    }
  }

  return semesters
}

/**
 * Generate term sequence until target graduation
 * SMU uses Term 1 (Aug-Jan), Term 2 (Jan-Apr), Term 3 (May-Aug)
 */
function generateTermSequence(targetGraduation: {
  term: Term
  year: number
}): Array<{ term: Term; year: number }> {
  const terms: Term[] = ["Term 1", "Term 2", "Term 3"]
  const sequence: Array<{ term: Term; year: number }> = []

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  // Determine starting term based on SMU calendar
  let startTerm: Term
  let startYear: number

  if (currentMonth >= 0 && currentMonth < 4) {
    // January-April: Start with Term 2
    startTerm = "Term 2"
    startYear = currentYear
  } else if (currentMonth >= 4 && currentMonth < 7) {
    // May-July: Start with Term 3
    startTerm = "Term 3"
    startYear = currentYear
  } else {
    // August-December: Start with Term 1
    startTerm = "Term 1"
    startYear = currentYear
  }

  let year = startYear
  let termIndex = terms.indexOf(startTerm)

  // Generate terms until target
  while (
    year < targetGraduation.year ||
    (year === targetGraduation.year &&
      terms[termIndex] !== targetGraduation.term)
  ) {
    sequence.push({ term: terms[termIndex], year })

    termIndex++
    if (termIndex >= terms.length) {
      termIndex = 0
      year++
    }

    // Safety check to prevent infinite loop
    if (sequence.length > 20) break
  }

  // Add target term
  sequence.push({ term: targetGraduation.term, year: targetGraduation.year })

  return sequence
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
  if (units < 15) workloadDesc = "light"
  if (units > 17) workloadDesc = "intensive"

  return `${workloadDesc.charAt(0).toUpperCase() + workloadDesc.slice(1)} ${term} ${year} semester with ${courseCount} courses (${units} units)`
}
