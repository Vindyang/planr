import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const createCourseReviewSchema = z.object({
  courseId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  difficultyRating: z.number().int().min(1).max(5),
  workloadRating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(2000),
  isAnonymous: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const mine = searchParams.get("mine")

    const where: Record<string, unknown> = {
      course: { university: student.university },
    }
    if (courseId) {
      where.courseId = courseId
    }
    if (mine === "true") {
      where.studentId = student.id
    }

    const reviews = await prisma.courseReview.findMany({
      where,
      include: {
        course: { select: { id: true, code: true, title: true } },
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const serialized = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      difficultyRating: r.difficultyRating,
      workloadRating: r.workloadRating,
      content: r.content,
      term: r.term,
      isAnonymous: r.isAnonymous,
      createdAt: r.createdAt.toISOString(),
      course: r.course,
      studentName: r.isAnonymous ? null : r.student.user.name,
      isOwn: r.studentId === student.id,
    }))

    return NextResponse.json({ reviews: serialized })
  } catch (error) {
    console.error("Fetch course reviews error:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const validation = createCourseReviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      )
    }

    // Verify student completed this course
    const completedCourse = await prisma.completedCourse.findFirst({
      where: {
        studentId: student.id,
        courseId: validation.data.courseId,
        status: "COMPLETED",
      },
    })

    if (!completedCourse) {
      return NextResponse.json(
        { error: "You can only review courses you have completed" },
        { status: 403 }
      )
    }

    // Check for existing review
    const existing = await prisma.courseReview.findUnique({
      where: {
        studentId_courseId: {
          studentId: student.id,
          courseId: validation.data.courseId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this course" },
        { status: 409 }
      )
    }

    const review = await prisma.courseReview.create({
      data: {
        studentId: student.id,
        courseId: validation.data.courseId,
        rating: validation.data.rating,
        difficultyRating: validation.data.difficultyRating,
        workloadRating: validation.data.workloadRating,
        content: validation.data.content,
        term: completedCourse.term,
        isAnonymous: validation.data.isAnonymous,
      },
      include: {
        course: { select: { id: true, code: true, title: true } },
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error("Create course review error:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
