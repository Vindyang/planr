import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { validatePlan } from "@/lib/planner"
import { CourseWithPrereqs, CompletedCourseInfo } from "@/lib/eligibility"
import { SemesterWithCourses, ValidationContext } from "@/lib/planner/types"

export async function POST() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        university: {
          select: { code: true },
        },
        completedCourses: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
                units: true,
              },
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

    // Fetch all semester plans
    const semesterPlans = await prisma.semesterPlan.findMany({
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

    // Fetch all courses for the student's university (for prerequisite checking)
    const allCourses = await prisma.course.findMany({
      where: {
        universityId: student.universityId,
        isActive: true,
      },
      include: {
        prerequisites: {
          include: {
            prerequisiteCourse: {
              select: {
                id: true,
                code: true,
                title: true,
                units: true,
              },
            },
          },
        },
      },
    })

    // Transform data for validation
    const semesters: SemesterWithCourses[] = semesterPlans.map((sp) => ({
      id: sp.id,
      term: sp.term,
      year: sp.year,
      isActive: sp.isActive,
      courses: sp.plannedCourses.map((pc) => ({
        id: pc.id,
        courseId: pc.courseId,
        status: pc.status,
        addedAt: pc.addedAt.toISOString(),
        course: pc.course,
      })),
    }))

    const completedCourses: CompletedCourseInfo[] = student.completedCourses.map((cc) => ({
      courseId: cc.courseId,
      grade: cc.grade,
      course: cc.course,
    }))

    const coursesWithPrereqs: CourseWithPrereqs[] = allCourses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      units: c.units,
      prerequisites: c.prerequisites.map((p) => ({
        prerequisiteCourseId: p.prerequisiteCourseId,
        type: p.type,
        prerequisiteCourse: p.prerequisiteCourse,
      })),
    }))

    // Build validation context
    const context: ValidationContext = {
      semesters,
      completedCourses,
      allCourses: coursesWithPrereqs,
      university: student.university.code,
    }

    // Run validation
    const result = validatePlan(context)

    return NextResponse.json({
      isValid: result.isValid,
      violations: result.violations,
      statistics: result.statistics,
    })
  } catch (error) {
    console.error("Validation error:", error)
    return NextResponse.json(
      { error: "Failed to validate plan" },
      { status: 500 }
    )
  }
}
