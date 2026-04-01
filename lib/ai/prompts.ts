import type { AIGenerationContext, CourseContext } from "./types"
import { WORKLOAD_CONFIG } from "./types"

/**
 * Builds the system prompt for AI roadmap generation
 */
export function buildSystemPrompt(context: AIGenerationContext): string {
  const { student, availableCourses, preferences, universityRules } = context
  const workloadConfig = WORKLOAD_CONFIG[preferences.workloadLevel]

  // Get completed course codes for display
  const completedCourseCodes = availableCourses
    .filter((c) => student.completedCourseIds.includes(c.id))
    .map((c) => c.code)

  // Get user-selected start and end dates
  const planStartTerm = preferences.startSemester.term
  const planStartYear = preferences.startSemester.year
  const planEndTerm = preferences.targetGraduation.term
  const planEndYear = preferences.targetGraduation.year

  // Calculate remaining units and expected semesters
  const remainingUnits = universityRules.requiredTotalUnits - student.completedUnits
  const avgUnitsPerSemester = (workloadConfig.min + workloadConfig.max) / 2
  const estimatedSemesters = Math.ceil(remainingUnits / avgUnitsPerSemester)

  return `You are an expert academic advisor creating a course plan for ${planStartTerm} ${planStartYear} to ${planEndTerm} ${planEndYear}.

PLAN SCOPE: Need ${remainingUnits} CU across approximately ${estimatedSemesters} semesters (${avgUnitsPerSemester.toFixed(0)} CU/semester average).

## CRITICAL RULES (violations make plan invalid)
1. **NO DUPLICATES** (most common error): Track which courses you've used. Each course appears ONCE ONLY.
2. **Term Offerings**: Only schedule courses in terms they're offered (check "Offered:" line)
3. **Prerequisites**: Schedule prerequisite courses in EARLIER semesters (check "Prerequisites:" line)
4. **Units**: ${workloadConfig.min}-${workloadConfig.max} CU per semester
5. **No Summer**: ${preferences.includeSummerTerm ? "May use Term 3 if course is offered" : "Only use Term 1 and Term 2 (NO Term 3)"}
6. **CRITICAL UNIT RULE**: Use the EXACT CU shown in AVAILABLE COURSES for each module (SMU modules here are typically 1 CU). Never assume 3 or 4 CU.

## HOW TO AVOID DUPLICATES
1. Keep a mental list of ALL courses you've already scheduled
2. Before adding a course to ANY semester, scan ALL previous semesters
3. If you see a course code you've used before, SKIP IT and choose a different course
4. When planning later semesters, remember courses from earlier years

## WHEN TO STOP PLANNING
STOP adding semesters when you reach ${remainingUnits} total CU (approximately ${estimatedSemesters} semesters).
Do NOT create more semesters than needed just to fill the time period.

## STUDENT
Year ${student.year}, GPA ${student.gpa.toFixed(2)}, ${student.completedUnits}/${universityRules.requiredTotalUnits} CU complete
${completedCourseCodes.length > 0 ? `Completed: ${completedCourseCodes.join(", ")}` : `No courses completed yet`}${preferences.majorTrack ? `\nFocus: ${preferences.majorTrack}` : ""}

## AVAILABLE COURSES
${formatAvailableCourses(availableCourses, student.completedCourseIds)}

${preferences.preferredCourses && preferences.preferredCourses.length > 0 ? `## PREFERRED COURSES (try to include these)
${preferences.preferredCourses.map((id) => `- ${getCourseById(availableCourses, id)?.code || id}`).join("\n")}` : ""}

${preferences.avoidCourses && preferences.avoidCourses.length > 0 ? `## COURSES TO AVOID (exclude unless absolutely necessary)
${preferences.avoidCourses.map((id) => `- ${getCourseById(availableCourses, id)?.code || id}`).join("\n")}` : ""}

## OUTPUT FORMAT
Return JSON matching this structure (use course UUIDs from "ID:" lines above, NOT course codes):
{
  "semesters": [
    {
      "term": "Term 1",
      "year": 2024,
      "courses": [
        {
          "id": "uuid-from-available-courses",
          "code": "CS101",
          "title": "Introduction to Computer Science",
          "units": 1,
          "reasoning": "Brief reason for including this course"
        }
      ],
      "totalUnits": 4,
      "reasoning": "Brief semester summary"
    }
  ],
  "totalSemesters": 8,
  "totalUnits": 36,
  "meetsRequirements": true
}`
}

/**
 * Formats available courses for the prompt
 */
function formatAvailableCourses(
  courses: CourseContext[],
  completedCourseIds: string[]
): string {
  const incompleteCourses = courses.filter(
    (c) => !completedCourseIds.includes(c.id)
  )

  return incompleteCourses
    .map((course) => {
      const prereqInfo =
        course.prerequisites.length > 0
          ? `\n  Prerequisites: ${course.prerequisites
              .map((p) => `${p.courseCode} (${p.type})`)
              .join(", ")}`
          : ""

      const difficultyInfo =
        course.difficultyRating && course.workloadRating
          ? `\n  Difficulty: ${course.difficultyRating.toFixed(1)}/5, Workload: ${course.workloadRating.toFixed(1)}/5`
          : ""

      return `- ${course.code}: ${course.title} (${course.units} CU)
  ID: ${course.id}
  Offered: ${course.termsOffered.join(", ")}${prereqInfo}${difficultyInfo}`
    })
    .join("\n\n")
}

/**
 * Helper to get course by ID
 */
function getCourseById(
  courses: CourseContext[],
  id: string
): CourseContext | undefined {
  return courses.find((c) => c.id === id)
}

/**
 * Builds a retry prompt when validation fails
 */
export function buildRetryPrompt(
  originalPrompt: string,
  validationErrors: string[]
): string {
  const duplicateErrors = validationErrors.filter(err => err.includes("appears multiple times"))
  const termErrors = validationErrors.filter(err => err.includes("only offered in") || err.includes("not offered in"))
  const prereqErrors = validationErrors.filter(err => err.includes("Prerequisite") || err.includes("must be taken before"))

  // Extract unique duplicate courses
  const duplicateCourses = new Set<string>()
  duplicateErrors.forEach(err => {
    const match = err.match(/^([A-Z]+\d+)/)
    if (match) duplicateCourses.add(match[1])
  })

  return `${originalPrompt}

## 🚨 CRITICAL: PREVIOUS PLAN HAD ${validationErrors.length} ERRORS
${duplicateErrors.length > 0 ? `
**DUPLICATE COURSES** (${duplicateCourses.size} courses used multiple times):
${Array.from(duplicateCourses).map(code => `- ${code} ← appears in 2+ semesters`).join("\n")}

CRITICAL RULE: Each course can appear ONLY ONCE in entire plan.
ACTION REQUIRED: Before adding ANY course, manually check if it's already in a previous semester.
` : ""}
${termErrors.length > 0 ? `**TERM OFFERING ERRORS**: ${termErrors.length} courses scheduled in wrong terms - verify "Offered:" line\n` : ""}
${prereqErrors.length > 0 ? `**PREREQUISITE ERRORS**: ${prereqErrors.length} courses before prerequisites - schedule prereqs in earlier semesters\n` : ""}

Generate a COMPLETELY NEW plan with ZERO duplicates, correct terms, and proper prerequisite ordering.`
}

/**
 * Few-shot example for better LLM guidance (optional, can be added to system prompt)
 */
export const FEW_SHOT_EXAMPLE = `
## EXAMPLE OUTPUT STRUCTURE

{
  "semesters": [
    {
      "term": "Term 1",
      "year": 2024,
      "courses": [
        {
          "id": "course-uuid-1",
          "code": "CS101",
          "title": "Introduction to Computer Science",
          "units": 1,
          "reasoning": "Foundational course required for major, no prerequisites needed"
        },
        {
          "id": "course-uuid-2",
          "code": "MATH141",
          "title": "Calculus I",
          "units": 1,
          "reasoning": "Required math foundation for CS track"
        },
        {
          "id": "course-uuid-3",
          "code": "ENG101",
          "title": "English Composition",
          "units": 1,
          "reasoning": "General education requirement"
        }
      ],
      "totalUnits": 3,
      "reasoning": "Light first semester to adjust to university, focusing on foundational courses"
    }
  ],
  "totalSemesters": 6,
  "totalUnits": 36,
  "meetsRequirements": true
}
`
