import { generateObject } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { prisma } from "@/lib/prisma"
import type {
  AIGenerationContext,
  AIRoadmap,
  CourseContext,
  StudentContext,
  UserPreferences,
} from "./types"
import { aiRoadmapSchema } from "./types"
import { buildSystemPrompt, buildRetryPrompt } from "./prompts"
import { generateDeterministicRoadmap } from "./fallback"

// Initialize Google AI client
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

/**
 * Main function to generate AI-powered course roadmap
 */
export async function generateAIRoadmap(
  studentId: string,
  preferences: UserPreferences
): Promise<{
  roadmap: AIRoadmap
  metadata: {
    model: string
    generatedAt: string
    processingTime: number
    usedFallback: boolean
  }
}> {
  const startTime = Date.now()

  try {
    // 1. Build context from database
    const context = await buildGenerationContext(studentId, preferences)

    // 2. Generate roadmap with Gemini Flash
    const roadmap = await generateWithGemini(context)

    const processingTime = (Date.now() - startTime) / 1000

    return {
      roadmap,
      metadata: {
        model: "gemini-2.5-flash",
        generatedAt: new Date().toISOString(),
        processingTime,
        usedFallback: false,
      },
    }
  } catch (error) {
    console.error("AI roadmap generation failed, using fallback:", error)

    // Fallback to deterministic generation
    const context = await buildGenerationContext(studentId, preferences)
    const roadmap = await generateDeterministicRoadmap(context)

    const processingTime = (Date.now() - startTime) / 1000

    return {
      roadmap,
      metadata: {
        model: "deterministic-fallback",
        generatedAt: new Date().toISOString(),
        processingTime,
        usedFallback: true,
      },
    }
  }
}

/**
 * Generate roadmap using Gemini Flash with retry logic
 */
async function generateWithGemini(
  context: AIGenerationContext,
  retryCount = 0
): Promise<AIRoadmap> {
  const maxRetries = 1
  const systemPrompt = buildSystemPrompt(context)

  console.log("🤖 Generating with Gemini 2.5 Flash...")
  console.log("API Key configured:", !!process.env.GEMINI_API_KEY)
  console.log("Prompt length:", systemPrompt.length, "chars")

  try {
    const result = await generateObject({
      model: google("gemini-2.5-flash"), // Use gemini-3-flash-preview for latest
      schema: aiRoadmapSchema,
      prompt: systemPrompt,
      temperature: 0.3, // Lower temperature for more consistent output
    })

    console.log("✅ Gemini generation successful")
    console.log("Generated semesters:", result.object.semesters?.length)

    return result.object as unknown as AIRoadmap
  } catch (error) {
    console.error("❌ Gemini generation error:", error)
    console.error("Error details:", error instanceof Error ? error.message : error)

    if (retryCount < maxRetries) {
      console.warn(
        `Gemini generation failed (attempt ${retryCount + 1}/${maxRetries + 1}), retrying...`
      )
      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return generateWithGemini(context, retryCount + 1)
    }

    throw error
  }
}

/**
 * Builds AI generation context from student data
 */
export async function buildGenerationContext(
  studentId: string,
  preferences: UserPreferences
): Promise<AIGenerationContext> {
  // Fetch student with completed courses
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      completedCourses: {
        include: {
          course: true,
        },
      },
      major: {
        include: {
          university: true,
        },
      },
    },
  })

  if (!student) {
    throw new Error("Student not found")
  }

  // Fetch all available courses for the student's university
  const courses = await prisma.course.findMany({
    where: {
      universityId: student.universityId,
    },
    include: {
      prerequisites: {
        include: {
          prerequisiteCourse: true,
        },
      },
      courseReviews: {
        select: {
          difficultyRating: true,
          workloadRating: true,
        },
      },
    },
  })

  // Build student context
  const studentContext: StudentContext = {
    id: student.id,
    universityId: student.universityId,
    majorId: student.majorId,
    year: student.year,
    enrollmentYear: student.enrollmentYear,
    completedCourseIds: student.completedCourses.map((cc) => cc.courseId),
    completedUnits: student.completedCourses.reduce(
      (sum, cc) => sum + cc.course.units,
      0
    ),
    gpa: student.gpa,
  }

  // Build course context with average ratings
  const courseContext: CourseContext[] = courses.map((course) => {
    const avgDifficulty =
      course.courseReviews.length > 0
        ? course.courseReviews.reduce((sum: number, r) => sum + r.difficultyRating, 0) /
          course.courseReviews.length
        : undefined

    const avgWorkload =
      course.courseReviews.length > 0
        ? course.courseReviews.reduce((sum: number, r) => sum + r.workloadRating, 0) /
          course.courseReviews.length
        : undefined

    return {
      id: course.id,
      code: course.code,
      title: course.title,
      description: course.description,
      units: course.units,
      termsOffered: course.termsOffered,
      tags: course.tags,
      prerequisites: course.prerequisites.map((p) => ({
        courseId: p.prerequisiteCourseId,
        courseCode: p.prerequisiteCourse.code,
        type: p.type,
      })),
      difficultyRating: avgDifficulty,
      workloadRating: avgWorkload,
    }
  })

  // University rules (these could be fetched from university settings in the future)
  const universityRules = {
    minUnitsPerSemester: 3,
    maxUnitsPerSemester: 6,
    maxUnitsWithoutOverload: 5,
    requiredTotalUnits: student.major.requiredUnits, // Dynamically fetched from major requirements
  }

  return {
    student: studentContext,
    availableCourses: courseContext,
    preferences,
    universityRules,
  }
}

/**
 * Retry generation with validation errors in prompt (for use by validation layer)
 */
export async function retryWithErrors(
  context: AIGenerationContext,
  errors: string[]
): Promise<AIRoadmap> {
  const originalPrompt = buildSystemPrompt(context)
  const retryPrompt = buildRetryPrompt(originalPrompt, errors)

  const result = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: aiRoadmapSchema,
    prompt: retryPrompt,
    temperature: 0.2, // Even lower temperature for retry
  })

  return result.object as unknown as AIRoadmap
}
