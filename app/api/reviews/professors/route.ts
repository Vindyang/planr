import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const createProfessorReviewSchema = z.object({
  professorId: z.string().uuid(),
  courseId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  difficultyRating: z.number().int().min(1).max(5),
  workloadRating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(2000),
  term: z.string().optional(),
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
    const professorId = searchParams.get("professorId")
    const courseId = searchParams.get("courseId")
    const mine = searchParams.get("mine")

    const where: Record<string, unknown> = {
      professor: { universityId: student.universityId },
    }
    if (professorId) {
      where.professorId = professorId
    }
    if (courseId) {
      const instructors = await prisma.courseInstructor.findMany({
        where: { courseId },
        select: { professorId: true },
      })
      where.professorId = { in: instructors.map((i) => i.professorId) }
    }
    if (mine === "true") {
      where.studentId = student.id
    }

    const reviews = await prisma.professorReview.findMany({
      where,
      include: {
        professor: { select: { id: true, name: true, department: true } },
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
      professor: r.professor,
      course: r.course,
      studentName: r.isAnonymous ? null : r.student.user.name,
      isOwn: r.studentId === student.id,
    }))

    return NextResponse.json({ reviews: serialized })
  } catch (error) {
    console.error("Fetch professor reviews error:", error)
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
    const validation = createProfessorReviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      )
    }

    // Verify professor exists and is at student's university
    const professor = await prisma.professor.findUnique({
      where: { id: validation.data.professorId },
    })

    if (!professor || professor.universityId !== student.universityId) {
      return NextResponse.json({ error: "Professor not found" }, { status: 404 })
    }

    // Check for existing review
    const existing = await prisma.professorReview.findUnique({
      where: {
        studentId_professorId: {
          studentId: student.id,
          professorId: validation.data.professorId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this professor" },
        { status: 409 }
      )
    }

    // If courseId provided, verify student completed it
    if (validation.data.courseId) {
      const completedCourse = await prisma.completedCourse.findFirst({
        where: {
          studentId: student.id,
          courseId: validation.data.courseId,
          status: "COMPLETED",
        },
      })

      if (!completedCourse) {
        return NextResponse.json(
          { error: "You can only associate reviews with courses you have completed" },
          { status: 403 }
        )
      }
    }

    const review = await prisma.professorReview.create({
      data: {
        studentId: student.id,
        professorId: validation.data.professorId,
        courseId: validation.data.courseId,
        rating: validation.data.rating,
        difficultyRating: validation.data.difficultyRating,
        workloadRating: validation.data.workloadRating,
        content: validation.data.content,
        term: validation.data.term,
        isAnonymous: validation.data.isAnonymous,
      },
      include: {
        professor: { select: { id: true, name: true, department: true } },
        course: { select: { id: true, code: true, title: true } },
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error("Create professor review error:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
