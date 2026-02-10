import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const addCourseSchema = z.object({
  semesterPlanId: z.string().uuid(),
  courseId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = addCourseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { semesterPlanId, courseId } = validation.data

    // Verify semester plan ownership
    const semesterPlan = await prisma.semesterPlan.findUnique({
      where: { id: semesterPlanId },
      include: {
        student: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!semesterPlan) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 })
    }

    if (semesterPlan.student.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Check if course is already in this semester
    const existing = await prisma.plannedCourse.findFirst({
      where: {
        semesterPlanId,
        courseId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Course already in this semester" },
        { status: 409 }
      )
    }

    // Add course to semester plan
    const plannedCourse = await prisma.plannedCourse.create({
      data: {
        semesterPlanId,
        courseId,
        status: "PLANNED",
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

    return NextResponse.json({ plannedCourse }, { status: 201 })
  } catch (error) {
    console.error("Add course error:", error)
    return NextResponse.json(
      { error: "Failed to add course" },
      { status: 500 }
    )
  }
}
