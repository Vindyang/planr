import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const moveCourseSchema = z.object({
  targetSemesterPlanId: z.string().uuid(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: plannedCourseId } = await params

    // Verify ownership of the planned course
    const plannedCourse = await prisma.plannedCourse.findUnique({
      where: { id: plannedCourseId },
      include: {
        semesterPlan: {
          include: {
            student: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    })

    if (!plannedCourse) {
      return NextResponse.json(
        { error: "Planned course not found" },
        { status: 404 }
      )
    }

    if (plannedCourse.semesterPlan.student.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const validation = moveCourseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { targetSemesterPlanId } = validation.data

    // Verify ownership of target semester
    const targetSemester = await prisma.semesterPlan.findUnique({
      where: { id: targetSemesterPlanId },
      include: {
        student: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!targetSemester) {
      return NextResponse.json(
        { error: "Target semester not found" },
        { status: 404 }
      )
    }

    if (targetSemester.student.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if course already exists in target semester
    const duplicate = await prisma.plannedCourse.findFirst({
      where: {
        semesterPlanId: targetSemesterPlanId,
        courseId: plannedCourse.courseId,
        id: { not: plannedCourseId },
      },
    })

    if (duplicate) {
      return NextResponse.json(
        { error: "Course already exists in target semester" },
        { status: 409 }
      )
    }

    // Move course to new semester
    const updated = await prisma.plannedCourse.update({
      where: { id: plannedCourseId },
      data: {
        semesterPlanId: targetSemesterPlanId,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            units: true,
            termsOffered: true,
            tags: true,
          },
        },
      },
    })

    return NextResponse.json({ plannedCourse: updated })
  } catch (error) {
    console.error("Move course error:", error)
    return NextResponse.json(
      { error: "Failed to move course" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: plannedCourseId } = await params

    // Verify ownership
    const plannedCourse = await prisma.plannedCourse.findUnique({
      where: { id: plannedCourseId },
      include: {
        semesterPlan: {
          include: {
            student: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    })

    if (!plannedCourse) {
      return NextResponse.json(
        { error: "Planned course not found" },
        { status: 404 }
      )
    }

    if (plannedCourse.semesterPlan.student.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete planned course
    await prisma.plannedCourse.delete({
      where: { id: plannedCourseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete planned course error:", error)
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    )
  }
}
