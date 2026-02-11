import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const createSemesterSchema = z.object({
  term: z.enum(["Fall", "Spring", "Summer"]),
  year: z.number().int().min(2020).max(2035),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      )
    }

    const plans = await prisma.semesterPlan.findMany({
      where: { studentId: student.id },
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
      orderBy: [{ year: "asc" }, { term: "asc" }],
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Fetch planner error:", error)
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = createSemesterSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { term, year } = validation.data

    // Check if semester already exists for this student
    const existing = await prisma.semesterPlan.findFirst({
      where: {
        studentId: student.id,
        term,
        year,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Semester plan already exists" },
        { status: 409 }
      )
    }

    // Create new semester plan
    const semesterPlan = await prisma.semesterPlan.create({
      data: {
        studentId: student.id,
        term,
        year,
        isActive: false,
      },
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

    return NextResponse.json({ semester: semesterPlan }, { status: 201 })
  } catch (error) {
    console.error("Create semester error:", error)
    return NextResponse.json(
      { error: "Failed to create semester" },
      { status: 500 }
    )
  }
}
