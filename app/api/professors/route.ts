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
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const professors = await prisma.professor.findMany({
      where: { universityId: student.universityId },
      include: {
        department: {
          select: { name: true, code: true },
        },
        courseInstructors: {
          include: {
            course: { select: { id: true, code: true, title: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    // Deduplicate courses per professor
    const result = professors.map((p) => {
      const coursesMap = new Map<string, { id: string; code: string; title: string }>()
      p.courseInstructors.forEach((ci) => {
        coursesMap.set(ci.course.id, ci.course)
      })
      return {
        id: p.id,
        name: p.name,
        department: p.department.name,
        courses: Array.from(coursesMap.values()),
      }
    })

    return NextResponse.json({ professors: result })
  } catch (error) {
    console.error("Fetch professors error:", error)
    return NextResponse.json({ error: "Failed to fetch professors" }, { status: 500 })
  }
}
