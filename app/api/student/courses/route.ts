import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

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

    const completedCourses = await prisma.completedCourse.findMany({
      where: { studentId: student.id },
      include: {
        course: true,
      },
      orderBy: {
        term: "desc",
      },
    })

    return NextResponse.json({ completedCourses })
  } catch (error) {
    console.error("Fetch completed courses error:", error)
    return NextResponse.json(
      { error: "Failed to fetch completed courses" },
      { status: 500 }
    )
  }
}

// POST/DELETE removed - use addCompletedCourse/removeCompletedCourse Server Actions instead
