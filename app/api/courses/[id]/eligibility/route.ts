import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import {
  checkCourseEligibility,
  getPrerequisiteChain,
  suggestPrerequisiteSequence,
  CourseWithPrereqs,
  CompletedCourseInfo,
  EligibilityCheckResponse,
} from "@/lib/eligibility"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId } = await params

    // Fetch student with completed courses
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        completedCourses: {
          include: {
            course: {
              select: { id: true, code: true, title: true, units: true },
            },
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

    // Fetch target course with prerequisites
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        prerequisites: {
          include: {
            prerequisiteCourse: {
              select: { id: true, code: true, title: true, units: true },
            },
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Fetch all courses for graph building
    const allCourses = await prisma.course.findMany({
      where: { university: student.university, isActive: true },
      include: {
        prerequisites: {
          include: {
            prerequisiteCourse: {
              select: { id: true, code: true, title: true, units: true },
            },
          },
        },
      },
    })

    // Transform data to match our types
    const courseForCheck: CourseWithPrereqs = {
      id: course.id,
      code: course.code,
      title: course.title,
      units: course.units,
      prerequisites: course.prerequisites.map((p) => ({
        prerequisiteCourseId: p.prerequisiteCourseId,
        type: p.type,
        prerequisiteCourse: p.prerequisiteCourse,
      })),
    }

    const completedCourses: CompletedCourseInfo[] = student.completedCourses.map((cc) => ({
      courseId: cc.courseId,
      grade: cc.grade,
      course: cc.course,
    }))

    // Build maps for graph operations
    const coursesMap = new Map<string, CourseWithPrereqs>()
    for (const c of allCourses) {
      coursesMap.set(c.id, {
        id: c.id,
        code: c.code,
        title: c.title,
        units: c.units,
        prerequisites: c.prerequisites.map((p) => ({
          prerequisiteCourseId: p.prerequisiteCourseId,
          type: p.type,
          prerequisiteCourse: p.prerequisiteCourse,
        })),
      })
    }

    const completedMap = new Map(
      completedCourses.map((cc) => [cc.courseId, cc])
    )

    // Check eligibility
    const eligibility = checkCourseEligibility(
      courseForCheck,
      completedCourses,
      { university: student.university }
    )

    // Get prerequisite tree
    const prerequisiteTree = getPrerequisiteChain(
      courseId,
      coursesMap,
      completedMap
    )

    // Get suggested sequence if not eligible
    const completedIds = new Set(student.completedCourses.map((cc) => cc.courseId))
    const suggestedSequence = !eligibility.isEligible
      ? suggestPrerequisiteSequence(courseId, coursesMap, completedIds)
      : []

    const response: EligibilityCheckResponse = {
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      eligibility,
      prerequisiteTree,
      suggestedSequence,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Eligibility check error:", error)
    return NextResponse.json(
      { error: "Failed to check eligibility" },
      { status: 500 }
    )
  }
}
