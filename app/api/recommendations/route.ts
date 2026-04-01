import { NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import { requireRole } from "@/lib/auth-utils"
import { buildGenerationContext, generateAIRoadmap } from "@/lib/ai/recommendation"
import { validateWithRetry } from "@/lib/ai/validation"
import {
  userPreferencesSchema,
  type GenerateRecommendationResponse,
} from "@/lib/ai/types"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/recommendations
 * Generate AI-powered course roadmap for a student
 */
export async function POST(request: Request) {
  console.log("📨 POST /api/recommendations - Request received")

  try {
    // 1. Authenticate - must be a student
    console.log("🔐 Authenticating...")
    const session = await requireRole([UserRole.STUDENT])
    console.log("✅ Authenticated as:", session.user.email)

    // 2. Parse and validate request body
    console.log("📝 Parsing request body...")
    const body = await request.json()
    const validationResult = userPreferencesSchema.safeParse(body)

    if (!validationResult.success) {
      console.error("❌ Invalid preferences:", validationResult.error.issues)
      return NextResponse.json(
        {
          error: "Invalid preferences",
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const preferences = validationResult.data
    console.log("✅ Preferences validated")

    // 3. Get student ID from session
    console.log("👤 Looking up student profile...")
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!student) {
      console.error("❌ Student profile not found for user:", session.user.id)
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      )
    }

    console.log("✅ Student found:", student.id)

    // 4. Generate roadmap with AI
    console.log("🚀 Starting AI generation...")
    const { roadmap, metadata } = await generateAIRoadmap(
      student.id,
      preferences
    )
    console.log("✅ AI generation completed")

    // 5. Build generation context for validation retry
    const generationContext = await buildGenerationContext(student.id, preferences)

    // 6. Validate and potentially retry
    const { roadmap: validatedRoadmap, validation } = await validateWithRetry(
      roadmap,
      student.id,
      generationContext
    )

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Unable to generate a valid plan",
          message:
            "Please try again with a different workload preference or timeline.",
          violations: validation.violations,
        },
        { status: 422 }
      )
    }

    // 7. Return response
    const response: GenerateRecommendationResponse = {
      roadmap: validatedRoadmap,
      validation,
      metadata: {
        ...metadata,
        usedFallback: metadata.usedFallback || false,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error generating recommendations:", error)

    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
