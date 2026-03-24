import { prisma } from "@/lib/prisma"
import { validatePlan } from "@/lib/planner/validation"
import type { ValidationContext, ValidationResult } from "@/lib/planner/types"
import type {
  CompletedCourseInfo,
  CourseWithPrereqs,
} from "@/lib/eligibility/types"
import type { AIRoadmap, AIGenerationContext } from "./types"
import { retryWithErrors } from "./recommendation"

/**
 * Validates an AI-generated roadmap using existing validation system
 */
export async function validateAIRoadmap(
  roadmap: AIRoadmap,
  studentId: string
): Promise<ValidationResult> {
  // Build validation context
  const context = await buildValidationContext(roadmap, studentId)

  // Run validation
  const result = validatePlan(context)

  return result
}

/**
 * Validates and retries if there are errors
 */
export async function validateWithRetry(
  roadmap: AIRoadmap,
  studentId: string,
  generationContext: AIGenerationContext
): Promise<{ roadmap: AIRoadmap; validation: ValidationResult }> {
  // First validation attempt
  let validation = await validateAIRoadmap(roadmap, studentId)

  // If invalid and we have errors, try one retry
  if (!validation.isValid && validation.violations.length > 0) {
    const errorMessages = validation.violations
      .filter((v) => v.severity === "error")
      .map((v) => v.message)

    if (errorMessages.length > 0) {
      console.log(
        "AI roadmap has validation errors, attempting retry with feedback..."
      )

      try {
        // Retry with error feedback
        const retriedRoadmap = await retryWithErrors(
          generationContext,
          errorMessages
        )

        // Validate the retried roadmap
        const retriedValidation = await validateAIRoadmap(
          retriedRoadmap,
          studentId
        )

        // Use the retried version if it's better (fewer errors)
        const retriedErrorCount = retriedValidation.violations.filter(
          (v) => v.severity === "error"
        ).length
        const originalErrorCount = validation.violations.filter(
          (v) => v.severity === "error"
        ).length

        if (retriedErrorCount < originalErrorCount) {
          console.log(
            `Retry improved validation: ${originalErrorCount} -> ${retriedErrorCount} errors`
          )
          return { roadmap: retriedRoadmap, validation: retriedValidation }
        }
      } catch (error) {
        console.error("Retry failed, using original roadmap:", error)
      }
    }
  }

  return { roadmap, validation }
}

/**
 * Builds ValidationContext from AI roadmap
 */
async function buildValidationContext(
  roadmap: AIRoadmap,
  studentId: string
): Promise<ValidationContext> {
  // Fetch student data
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      completedCourses: {
        include: {
          course: true,
        },
      },
    },
  })

  if (!student) {
    throw new Error("Student not found")
  }

  // Fetch all courses for this university
  const allCourses = await prisma.course.findMany({
    where: {
      universityId: student.universityId,
    },
    include: {
      prerequisites: {
        include: {
          prerequisiteCourse: true,
        },
      },
    },
  })

  // Convert completed courses
  const completedCourses: CompletedCourseInfo[] =
    student.completedCourses.map((cc) => ({
      courseId: cc.courseId,
      grade: cc.grade,
      course: {
        id: cc.course.id,
        code: cc.course.code,
        title: cc.course.title,
        units: cc.course.units,
      },
    }))

  // Convert all courses to CourseWithPrereqs format
  const coursesWithPrereqs: CourseWithPrereqs[] = allCourses.map((course) => ({
    id: course.id,
    code: course.code,
    title: course.title,
    units: course.units,
    prerequisites: course.prerequisites.map((p) => ({
      prerequisiteCourseId: p.prerequisiteCourseId,
      type: p.type,
      prerequisiteCourse: {
        id: p.prerequisiteCourse.id,
        code: p.prerequisiteCourse.code,
        title: p.prerequisiteCourse.title,
        units: p.prerequisiteCourse.units,
      },
    })),
  }))

  // Convert AI semesters to ValidationContext format
  const semesters = roadmap.semesters.map((aiSemester) => ({
    id: `ai-${aiSemester.term}-${aiSemester.year}`, // Temporary ID for validation
    term: aiSemester.term,
    year: aiSemester.year,
    isActive: false,
    courses: aiSemester.courses.map((aiCourse) => {
      const fullCourse = allCourses.find((c) => c.id === aiCourse.id)
      if (!fullCourse) {
        throw new Error(
          `Course ${aiCourse.code} (${aiCourse.id}) not found in database - possible AI hallucination`
        )
      }

      return {
        id: `ai-planned-${aiCourse.id}`, // Temporary ID for validation
        courseId: aiCourse.id,
        status: "PLANNED",
        addedAt: new Date().toISOString(),
        course: {
          id: fullCourse.id,
          code: fullCourse.code,
          title: fullCourse.title,
          units: fullCourse.units,
          termsOffered: fullCourse.termsOffered,
          tags: fullCourse.tags,
        },
      }
    }),
  }))

  return {
    semesters,
    completedCourses,
    allCourses: coursesWithPrereqs,
    university: student.universityId,
  }
}

/**
 * Helper to extract violation summaries for display
 */
export function summarizeViolations(validation: ValidationResult): string[] {
  return validation.violations.map(
    (v) =>
      `[${v.severity.toUpperCase()}] ${v.courseCode} (${v.semesterLabel}): ${v.message}`
  )
}

/**
 * Checks if roadmap has any critical errors that would prevent application
 */
export function hasCriticalErrors(validation: ValidationResult): boolean {
  return validation.violations.some((v) => v.severity === "error")
}
