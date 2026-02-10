import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const updateSemesterSchema = z.object({
  term: z.enum(["Fall", "Spring", "Summer"]).optional(),
  year: z.number().int().min(2020).max(2035).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: semesterId } = await params

    const semesterPlan = await prisma.semesterPlan.findUnique({
      where: { id: semesterId },
      include: {
        plannedCourses: {
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
        },
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

    // Verify ownership
    if (semesterPlan.student.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ semester: semesterPlan })
  } catch (error) {
    console.error("Fetch semester error:", error)
    return NextResponse.json(
      { error: "Failed to fetch semester" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: semesterId } = await params

    // Verify ownership
    const existing = await prisma.semesterPlan.findUnique({
      where: { id: semesterId },
      include: {
        student: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 })
    }

    if (existing.student.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const validation = updateSemesterSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Update semester plan
    const updated = await prisma.semesterPlan.update({
      where: { id: semesterId },
      data: updates,
      include: {
        plannedCourses: {
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
        },
      },
    })

    return NextResponse.json({ semester: updated })
  } catch (error) {
    console.error("Update semester error:", error)
    return NextResponse.json(
      { error: "Failed to update semester" },
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

    const { id: semesterId } = await params

    // Verify ownership
    const existing = await prisma.semesterPlan.findUnique({
      where: { id: semesterId },
      include: {
        student: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 })
    }

    if (existing.student.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete semester plan (cascade delete planned courses)
    await prisma.semesterPlan.delete({
      where: { id: semesterId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete semester error:", error)
    return NextResponse.json(
      { error: "Failed to delete semester" },
      { status: 500 }
    )
  }
}
