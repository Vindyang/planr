import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const createProfileSchema = z.object({
  userId: z.string(),
  university: z.enum(["SMU", "NUS", "NTU", "SUTD", "SUSS"]),
  major: z.string().min(2),
  year: z.number().min(1).max(4),
  enrollmentYear: z.number(),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        completedCourses: {
          include: {
            course: true,
          },
          orderBy: {
            term: "desc",
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch student profile" },
      { status: 500 }
    )
  }
}

// POST kept for signup flow (called from client after Better Auth signup)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createProfileSchema.parse(body)

    // Look up university by code
    const university = await prisma.university.findUnique({
      where: { code: validatedData.university },
    })

    if (!university) {
      return NextResponse.json(
        { error: "Invalid university" },
        { status: 400 }
      )
    }

    // Look up major (department) by name
    const major = await prisma.department.findFirst({
      where: {
        universityId: university.id,
        name: validatedData.major,
      },
    })

    if (!major) {
      return NextResponse.json(
        { error: "Invalid major for selected university" },
        { status: 400 }
      )
    }

    const student = await prisma.student.create({
      data: {
        userId: validatedData.userId,
        universityId: university.id,
        majorId: major.id,
        year: validatedData.year,
        enrollmentYear: validatedData.enrollmentYear,
        expectedGraduationYear: validatedData.enrollmentYear + 4,
        gpa: 0,
      },
    })

    return NextResponse.json(
      {
        message: "Student profile created successfully",
        student: {
          id: student.id,
          universityId: student.universityId,
          majorId: student.majorId,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Profile creation error:", error)
    return NextResponse.json(
      { error: "Failed to create student profile" },
      { status: 500 }
    )
  }
}

// PUT removed - use updateStudentProfile Server Action instead
