import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const updateProfessorReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  difficultyRating: z.number().int().min(1).max(5).optional(),
  workloadRating: z.number().int().min(1).max(5).optional(),
  content: z.string().min(10).max(2000).optional(),
  isAnonymous: z.boolean().optional(),
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

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const { id } = await params

    const review = await prisma.professorReview.findUnique({ where: { id } })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (review.studentId !== student.id) {
      return NextResponse.json({ error: "Not authorized to edit this review" }, { status: 403 })
    }

    const body = await request.json()
    const validation = updateProfessorReviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      )
    }

    const updated = await prisma.professorReview.update({
      where: { id },
      data: validation.data,
      include: {
        professor: { select: { id: true, name: true, department: true } },
        course: { select: { id: true, code: true, title: true } },
      },
    })

    return NextResponse.json({ review: updated })
  } catch (error) {
    console.error("Update professor review error:", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const review = await prisma.professorReview.findUnique({ where: { id } })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (review.studentId !== student.id) {
      return NextResponse.json({ error: "Not authorized to delete this review" }, { status: 403 })
    }

    await prisma.professorReview.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete professor review error:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
