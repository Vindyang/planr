import type {
  AIGenerationContext,
  CourseContext,
  StudentContext,
  UserPreferences,
  WorkloadLevel,
} from "./types"
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

  return `You are an expert academic advisor helping a university student plan their remaining semesters to graduation.

## STUDENT PROFILE
- Current Year: ${student.year}
- Enrollment Year: ${student.enrollmentYear}
- Major ID: ${student.majorId}
- Completed Courses: ${student.completedCourseIds.length} courses (${student.completedUnits} units)
${completedCourseCodes.length > 0 ? `  COMPLETED: ${completedCourseCodes.join(", ")}` : "  COMPLETED: None (freshman student)"}
- Current GPA: ${student.gpa.toFixed(2)}

## TARGET GRADUATION
- Term: ${preferences.targetGraduation.term}
- Year: ${preferences.targetGraduation.year}
${preferences.careerTrack ? `- Career Track: ${preferences.careerTrack}` : ""}

## WORKLOAD PREFERENCE
- Level: ${preferences.workloadLevel}
- Units per semester: ${workloadConfig.min}-${workloadConfig.max} units
- Description: ${workloadConfig.description}

## UNIVERSITY RULES (CRITICAL - MUST FOLLOW)
1. **Prerequisites (HARD RULE)**:
   - A course with prerequisites can ONLY be scheduled if ALL prerequisite courses are either:
     a) Already COMPLETED (listed in the COMPLETED courses above), OR
     b) Scheduled in a PRIOR semester in your plan
   - Example: If IS210 requires IS101, and IS101 is NOT in the completed list, you MUST schedule IS101 in an earlier semester
   - NEVER schedule a course before its prerequisites are satisfied
2. **Corequisites**: Courses with corequisite relationships MUST be taken in the SAME semester
3. **Terms Offered**: Courses can ONLY be scheduled in terms where they are offered (check termsOffered array)
   - SMU uses: Term 1 (Aug-Jan), Term 2 (Jan-Apr), Term 3 (May-Aug/Special Term)
   - ${preferences.includeSummerTerm ? "**You MAY use Term 3 (summer)** if it helps with graduation timeline" : "**DO NOT schedule any courses in Term 3** - student does not want summer classes. Only use Term 1 and Term 2."}
4. **Unit Limits**:
   - Minimum: ${universityRules.minUnitsPerSemester} units/semester
   - Maximum (without overload): ${universityRules.maxUnitsWithoutOverload} units/semester
   - Absolute maximum: ${universityRules.maxUnitsPerSemester} units/semester
5. **No Duplicates**: A course can only appear ONCE across all semesters
6. **Total Units Required**: Must plan for at least ${universityRules.requiredTotalUnits} total units to graduate

## AVAILABLE COURSES
${formatAvailableCourses(availableCourses, student.completedCourseIds)}

${preferences.preferredCourses && preferences.preferredCourses.length > 0 ? `## PREFERRED COURSES (try to include these)
${preferences.preferredCourses.map((id) => `- ${getCourseById(availableCourses, id)?.code || id}`).join("\n")}` : ""}

${preferences.avoidCourses && preferences.avoidCourses.length > 0 ? `## COURSES TO AVOID (exclude unless absolutely necessary)
${preferences.avoidCourses.map((id) => `- ${getCourseById(availableCourses, id)?.code || id}`).join("\n")}` : ""}

## YOUR TASK
Create an optimal term-by-term course plan from now until ${preferences.targetGraduation.term} ${preferences.targetGraduation.year}.

For each term:
1. Select courses that are eligible (prerequisites met in prior terms)
2. Ensure courses are offered in that term (Term 1/Term 2/Term 3)
3. Respect the workload preference (${workloadConfig.min}-${workloadConfig.max} units)
4. Balance course difficulty when possible
5. Schedule prerequisites before courses that need them
6. Group related courses logically
7. Provide clear reasoning for each course selection and semester structure

## OUTPUT FORMAT
Return a JSON object with this EXACT structure (do not wrap in "plan" or "summary" objects):

{
  "semesters": [
    {
      "term": "Term 1",
      "year": 2024,
      "courses": [
        {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "code": "CS101",
          "title": "Introduction to Computer Science",
          "units": 4,
          "reasoning": "Foundational course with no prerequisites"
        }
      ],
      "totalUnits": 16,
      "reasoning": "Balanced first semester focusing on foundations"
    }
  ],
  "totalSemesters": 8,
  "totalUnits": 120,
  "meetsRequirements": true
}

CRITICAL:
- The "id" field MUST be the UUID from the course's "ID:" line in the AVAILABLE COURSES section
- Do NOT use the course code as the ID - use the actual UUID string
- Use the exact field names above. Do NOT use "plan" or "summary" as wrapper objects.

## CRITICAL VALIDATION CHECKLIST
Before finalizing your plan, verify:
✓ All prerequisites are satisfied (hard prereqs in PRIOR semesters)
✓ Corequisites are in SAME semester
✓ Courses only scheduled when offered (check termsOffered)
${!preferences.includeSummerTerm ? "✓ **NO courses scheduled in Term 3** (student opted out of summer classes)" : ""}
✓ No course appears twice
✓ Unit counts are within limits (${workloadConfig.min}-${workloadConfig.max} per semester)
✓ Total units >= ${universityRules.requiredTotalUnits}
✓ Plan ends by ${preferences.targetGraduation.term} ${preferences.targetGraduation.year}

If you cannot create a valid plan meeting all constraints, explain why in the reasoning fields.`
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

      return `- ${course.code}: ${course.title} (${course.units} units)
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
  return `${originalPrompt}

## VALIDATION ERRORS FROM PREVIOUS ATTEMPT
Your previous plan had these violations:
${validationErrors.map((error, i) => `${i + 1}. ${error}`).join("\n")}

Please generate a NEW plan that fixes ALL these violations. Pay special attention to:
- Prerequisite ordering (prerequisites must be in EARLIER semesters)
- Corequisite grouping (must be in SAME semester)
- Term availability (only schedule courses when offered)
- Unit limits (${WORKLOAD_CONFIG["Balanced"].min}-${WORKLOAD_CONFIG["Balanced"].max} units per semester)

Generate a corrected plan now.`
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
          "units": 4,
          "reasoning": "Foundational course required for major, no prerequisites needed"
        },
        {
          "id": "course-uuid-2",
          "code": "MATH141",
          "title": "Calculus I",
          "units": 4,
          "reasoning": "Required math foundation for CS track"
        },
        {
          "id": "course-uuid-3",
          "code": "ENG101",
          "title": "English Composition",
          "units": 3,
          "reasoning": "General education requirement"
        }
      ],
      "totalUnits": 11,
      "reasoning": "Light first semester to adjust to university, focusing on foundational courses"
    }
  ],
  "totalSemesters": 6,
  "totalUnits": 120,
  "meetsRequirements": true
}
`
