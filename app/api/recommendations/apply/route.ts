import { NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { validateAIRoadmap } from "@/lib/ai/validation"
import {
  aiRoadmapSchema,
  type ApplyRecommendationResponse,
} from "@/lib/ai/types"

/**
 * POST /api/recommendations/apply
 * Apply AI-generated roadmap to student's planner
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate - must be a student
    const session = await requireRole([UserRole.STUDENT])

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = aiRoadmapSchema.safeParse(body.roadmap)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid roadmap",
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const roadmap = validationResult.data

    // 3. Get student ID
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

    // 4. Validate roadmap one more time (security)
    const validation = await validateAIRoadmap(roadmap, student.id)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Roadmap has validation errors",
          violations: validation.violations,
        },
        { status: 400 }
      )
    }

    // 5. Apply roadmap to planner
    let createdPlans = 0
    let createdCourses = 0

    for (const aiSemester of roadmap.semesters) {
      // Check if semester plan already exists
      let semesterPlan = await prisma.semesterPlan.findFirst({
        where: {
          studentId: student.id,
          term: aiSemester.term,
          year: aiSemester.year,
        },
      })

      // Create if doesn't exist
      if (!semesterPlan) {
        semesterPlan = await prisma.semesterPlan.create({
          data: {
            studentId: student.id,
            term: aiSemester.term,
            year: aiSemester.year,
            isActive: false,
          },
        })
        createdPlans++
      }

      // Add courses to the semester plan
      for (const aiCourse of aiSemester.courses) {
        // Check if course is already in this plan
        const existingPlannedCourse = await prisma.plannedCourse.findFirst({
          where: {
            semesterPlanId: semesterPlan.id,
            courseId: aiCourse.id,
          },
        })

        // Only add if not already planned
        if (!existingPlannedCourse) {
          await prisma.plannedCourse.create({
            data: {
              semesterPlanId: semesterPlan.id,
              courseId: aiCourse.id,
              status: "PLANNED",
            },
          })
          createdCourses++
        }
      }
    }

    // 6. Revalidate planner page
    revalidatePath("/planner")

    // 7. Return success
    const response: ApplyRecommendationResponse = {
      success: true,
      created: {
        semesterPlans: createdPlans,
        plannedCourses: createdCourses,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error applying recommendations:", error)

    return NextResponse.json(
      {
        error: "Failed to apply recommendations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
