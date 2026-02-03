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
