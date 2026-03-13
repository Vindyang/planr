import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get student to filter by university
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      )
    }

    const courses = await prisma.course.findMany({
      where: {
        universityId: student.universityId,
        isActive: true,
      },
      include: {
        prerequisites: {
          select: {
            prerequisiteCourseId: true,
            type: true,
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Fetch courses error:", error)
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}
