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
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const roadmap = validationResult.data
    const replaceExisting = body.replaceExisting === true
    const semestersToReplace: Array<{ term: string; year: number }> =
      body.semestersToReplace || []

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

    // Build course lookup to guard against hallucinated or stale IDs
    const availableCourses = await prisma.course.findMany({
      where: { universityId: student.universityId },
      select: { id: true, code: true },
    })
    const courseById = new Map(availableCourses.map((c) => [c.id, c.id]))
    const courseIdByCode = new Map(availableCourses.map((c) => [c.code, c.id]))

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

    // 5. Check for conflicts with existing plans
    const conflicts: Array<{
      term: string
      year: number
      existingCourseCount: number
      aiCourseCount: number
      existingCourses: Array<{ code: string; title: string }>
      aiCourses: Array<{ code: string; title: string }>
    }> = []

    for (const aiSemester of roadmap.semesters) {
      const existingPlan = await prisma.semesterPlan.findFirst({
        where: {
          studentId: student.id,
          term: aiSemester.term,
          year: aiSemester.year,
        },
        include: {
          plannedCourses: {
            include: {
              course: {
                select: {
                  code: true,
                  title: true,
                },
              },
            },
          },
        },
      })

      if (existingPlan && existingPlan.plannedCourses.length > 0) {
        // Compare course codes to see if they're actually different
        const existingCodes = new Set(
          existingPlan.plannedCourses.map((pc) => pc.course.code)
        )
        const aiCodes = new Set(aiSemester.courses.map((c) => c.code))

        // Check if the courses are different (different sizes or different codes)
        const areDifferent =
          existingCodes.size !== aiCodes.size ||
          !Array.from(existingCodes).every((code) => aiCodes.has(code))

        // Only add to conflicts if the courses are actually different
        if (areDifferent) {
          conflicts.push({
            term: aiSemester.term,
            year: aiSemester.year,
            existingCourseCount: existingPlan.plannedCourses.length,
            aiCourseCount: aiSemester.courses.length,
            existingCourses: existingPlan.plannedCourses.map((pc) => ({
              code: pc.course.code,
              title: pc.course.title,
            })),
            aiCourses: aiSemester.courses.map((c) => ({
              code: c.code,
              title: c.title,
            })),
          })
        }
      }
    }

    // 6. If there are conflicts and user hasn't approved replacement, return conflicts
    if (conflicts.length > 0 && !replaceExisting) {
      return NextResponse.json(
        {
          conflicts,
          message: "Some semesters already have planned courses",
        },
        { status: 409 }
      )
    }

    // 7. Apply roadmap to planner
    let createdPlans = 0
    let createdCourses = 0
    let replacedPlans = 0
    let deletedCourses = 0

    // Build a set of semesters to replace for quick lookup
    const replaceSet = new Set(
      semestersToReplace.map((s) => `${s.term}-${s.year}`)
    )

    for (const aiSemester of roadmap.semesters) {
      const semesterKey = `${aiSemester.term}-${aiSemester.year}`
      const shouldReplace =
        replaceExisting && (semestersToReplace.length === 0 || replaceSet.has(semesterKey))

      // Check if semester plan already exists
      const existingPlan = await prisma.semesterPlan.findFirst({
        where: {
          studentId: student.id,
          term: aiSemester.term,
          year: aiSemester.year,
        },
        include: {
          plannedCourses: true,
        },
      })

      let semesterPlanId: string

      // If plan exists and has courses
      if (existingPlan && existingPlan.plannedCourses.length > 0) {
        if (shouldReplace) {
          // Delete existing courses before adding AI courses
          const deleteResult = await prisma.plannedCourse.deleteMany({
            where: {
              semesterPlanId: existingPlan.id,
            },
          })
          deletedCourses += deleteResult.count
          replacedPlans++
          semesterPlanId = existingPlan.id
        } else {
          // Skip this semester - user chose not to replace it
          continue
        }
      } else if (existingPlan) {
        // Plan exists but no courses
        semesterPlanId = existingPlan.id
      } else {
        // Create new semester plan
        const newPlan = await prisma.semesterPlan.create({
          data: {
            studentId: student.id,
            term: aiSemester.term,
            year: aiSemester.year,
            isActive: false,
          },
        })
        createdPlans++
        semesterPlanId = newPlan.id
      }

      // Add AI courses to the semester plan
      for (const aiCourse of aiSemester.courses) {
        const resolvedCourseId =
          courseById.get(aiCourse.id) ?? courseIdByCode.get(aiCourse.code)

        if (!resolvedCourseId) {
          return NextResponse.json(
            {
              error: "Roadmap contains an unknown course",
              message: `${aiCourse.code} is not a valid course in your university catalog.`,
            },
            { status: 400 }
          )
        }

        await prisma.plannedCourse.create({
          data: {
            semesterPlanId: semesterPlanId,
            courseId: resolvedCourseId,
            status: "PLANNED",
          },
        })
        createdCourses++
      }
    }

    // 8. Revalidate planner page
    revalidatePath("/planner")

    // 9. Return success
    const response: ApplyRecommendationResponse = {
      success: true,
      created: {
        semesterPlans: createdPlans,
        plannedCourses: createdCourses,
      },
      replaced: replacedPlans > 0 ? {
        semesterPlans: replacedPlans,
        deletedCourses: deletedCourses,
      } : undefined,
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
