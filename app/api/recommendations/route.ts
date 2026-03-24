import { NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import { requireRole } from "@/lib/auth-utils"
import { generateAIRoadmap } from "@/lib/ai/recommendation"
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
  try {
    // 1. Authenticate - must be a student
    const session = await requireRole([UserRole.STUDENT])

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = userPreferencesSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid preferences",
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const preferences = validationResult.data

    // 3. Get student ID from session
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      )
    }

    // 4. Generate roadmap with AI
    const { roadmap, metadata } = await generateAIRoadmap(
      student.id,
      preferences
    )

    // 5. Build generation context for validation retry
    const { buildGenerationContext } = await import(
      "@/lib/ai/recommendation"
    )
    const generationContext = await (buildGenerationContext as any)(
      student.id,
      preferences
    )

    // 6. Validate and potentially retry
    const { roadmap: validatedRoadmap, validation } = await validateWithRetry(
      roadmap,
      student.id,
      generationContext
    )

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
