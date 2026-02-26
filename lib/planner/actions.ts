"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PlanStatus, Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth"
import { z } from "zod"
import { cache } from "react"
import { validatePlan } from "./validation"
import type { ValidationResult, ValidationContext, SemesterWithCourses } from "./types"
import type { CourseWithPrereqs, CompletedCourseInfo } from "@/lib/eligibility"

async function getStudentId() {
  const session = await requireSession()
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
  })
  if (!student) throw new Error("Student profile not found")
  return student.id
}

// --- Types ---

export type PlannerData = {
  semesterPlans: (Prisma.semesterPlanGetPayload<{
    include: { plannedCourses: { include: { course: true } } }
  }>)[]
  completedCourses: Prisma.completedCourseGetPayload<{
    include: { course: true }
  }>[]
  gradRequirement?: any // Placeholder for future use
}

// --- Validation Schemas ---

const createPlanSchema = z.object({
  term: z.string(),
  year: z.number().int().min(2020).max(2040),
})

const addCourseSchema = z.object({
  planId: z.string().uuid(),
  courseId: z.string().uuid(),
})

const moveCourseSchema = z.object({
  plannedCourseId: z.string().uuid(),
  targetPlanId: z.string().uuid(),
})

// --- Actions ---

export const getPlannerData = cache(async (studentId: string): Promise<PlannerData> => {
  const semesterPlans = await prisma.semesterPlan.findMany({
    where: { studentId },
    include: {
      plannedCourses: {
        include: {
          course: true, // Include all course fields for now - components need them
        },
        orderBy: { addedAt: "asc" },
      },
    },
    orderBy: [{ year: "asc" }, { term: "desc" }],
  })

  return { semesterPlans, completedCourses: [] }
})

export async function createSemesterPlan(term: string, year: number): Promise<string> {
  const studentId = await getStudentId()

  const validated = createPlanSchema.parse({ term, year })

  // Check if plan already exists for this term/year
  const existing = await prisma.semesterPlan.findFirst({
    where: {
      studentId,
      term: validated.term,
      year: validated.year,
    },
  })

  if (existing) {
    throw new Error("A plan for this semester already exists.")
  }

  // Check if year limit reached
  const yearCount = await prisma.semesterPlan.count({
    where: {
      studentId,
      year: validated.year,
    },
  })

  if (yearCount >= 4) {
    throw new Error(`Academic year ${validated.year} already has the maximum of 4 terms.`)
  }

  const newSemester = await prisma.semesterPlan.create({
    data: {
      studentId,
      term: validated.term,
      year: validated.year,
      isActive: true,
    },
  })

  revalidatePath("/planner")
  return newSemester.id
}

export async function deleteSemesterPlan(planId: string) {
  const studentId = await getStudentId()

  const plan = await prisma.semesterPlan.findUnique({
    where: { id: planId },
  })

  if (!plan || plan.studentId !== studentId) {
    throw new Error("Plan not found or unauthorized")
  }

  // Verify plan is empty? Or just delete cascade?
  // Schema has cascade delete, so it will delete all planned courses in it.
  
  await prisma.semesterPlan.delete({
    where: { id: planId },
  })

  revalidatePath("/planner")
}

export async function addCourseToPlan(planId: string, courseId: string) {
  const studentId = await getStudentId()

  const validated = addCourseSchema.parse({ planId, courseId })

  // Verify ownership of plan
  const plan = await prisma.semesterPlan.findUnique({
    where: { id: validated.planId },
  })

  if (!plan || plan.studentId !== studentId) {
    throw new Error("Plan not found or unauthorized")
  }

  // Check if already planned in THIS plan or ANY plan? 
  // Usually unique per student, but for now let's just create it.
  // The UI should handle preventing duplicates or we check here.
  // Let's check if already in THIS plan for now.
  const existing = await prisma.plannedCourse.findFirst({
    where: {
      semesterPlanId: validated.planId,
      courseId: validated.courseId,
    },
  })

  if (existing) {
    throw new Error("Course already in this plan")
  }

  await prisma.plannedCourse.create({
    data: {
      semesterPlanId: validated.planId,
      courseId: validated.courseId,
      status: PlanStatus.PLANNED,
    },
  })

  revalidatePath("/planner")
}

const addCoursesSchema = z.object({
  planId: z.string(),
  courseIds: z.array(z.string()),
})

export async function addCoursesToPlan(planId: string, courseIds: string[]) {
  const studentId = await getStudentId()

  const validated = addCoursesSchema.parse({ planId, courseIds })

  // Verify ownership of plan
  const plan = await prisma.semesterPlan.findUnique({
    where: { id: validated.planId },
  })

  if (!plan || plan.studentId !== studentId) {
    throw new Error("Plan not found or unauthorized")
  }

  // Find existing courses
  const existing = await prisma.plannedCourse.findMany({
    where: {
      semesterPlanId: validated.planId,
      courseId: { in: validated.courseIds },
    },
  })

  const existingIds = new Set(existing.map((e) => e.courseId))
  const toAdd = validated.courseIds.filter((id) => !existingIds.has(id))

  if (toAdd.length > 0) {
    await prisma.plannedCourse.createMany({
      data: toAdd.map((courseId) => ({
        semesterPlanId: validated.planId,
        courseId,
        status: PlanStatus.PLANNED,
      })),
    })
  }

  revalidatePath("/planner")
}

export async function removeCourseFromPlan(plannedCourseId: string) {
  const studentId = await getStudentId()

  const plannedCourse = await prisma.plannedCourse.findUnique({
    where: { id: plannedCourseId },
    include: { semesterPlan: true },
  })

  if (!plannedCourse || plannedCourse.semesterPlan.studentId !== studentId) {
    throw new Error("Course not found or unauthorized")
  }

  await prisma.plannedCourse.delete({
    where: { id: plannedCourseId },
  })

  revalidatePath("/planner")
}

export async function removeCoursesFromPlan(plannedCourseIds: string[]) {
  const studentId = await getStudentId()

  // Verify all courses belong to student's plans
  const plannedCourses = await prisma.plannedCourse.findMany({
    where: {
      id: { in: plannedCourseIds },
    },
    include: { semesterPlan: true },
  })

  // Check authorization for all courses
  const unauthorized = plannedCourses.some(
    (pc) => pc.semesterPlan.studentId !== studentId
  )

  if (unauthorized || plannedCourses.length !== plannedCourseIds.length) {
    throw new Error("Some courses not found or unauthorized")
  }

  // Delete all courses
  await prisma.plannedCourse.deleteMany({
    where: {
      id: { in: plannedCourseIds },
    },
  })

  revalidatePath("/planner")
}

export async function moveCourse(plannedCourseId: string, targetPlanId: string) {
  const studentId = await getStudentId()

  const validated = moveCourseSchema.parse({ plannedCourseId, targetPlanId })

  // Verify target plan ownership
  const targetPlan = await prisma.semesterPlan.findUnique({
    where: { id: validated.targetPlanId },
  })

  if (!targetPlan || targetPlan.studentId !== studentId) {
    throw new Error("Target plan not found or unauthorized")
  }

  // Verify source course ownership
  const sourceCourse = await prisma.plannedCourse.findUnique({
    where: { id: validated.plannedCourseId },
    include: { semesterPlan: true },
  })

  if (!sourceCourse || sourceCourse.semesterPlan.studentId !== studentId) {
    throw new Error("Source course not found or unauthorized")
  }

  await prisma.plannedCourse.update({
    where: { id: validated.plannedCourseId },
    data: {
      semesterPlanId: validated.targetPlanId,
    },
  })

  revalidatePath("/planner")
}

// --- Validation ---

export const getValidationResult = cache(async (studentId: string): Promise<ValidationResult> => {
  // Fetch student with completed courses
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
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
    throw new Error("Student profile not found")
  }

  // Fetch semester plans
  const semesterPlans = await prisma.semesterPlan.findMany({
    where: { studentId },
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

  // Fetch all courses with prerequisites for validation
  const allCourses = await prisma.course.findMany({
    where: {
      university: student.university,
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
    university: student.university,
  }

  // Run validation
  return validatePlan(context)
})
