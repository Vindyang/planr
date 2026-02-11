"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PlanStatus, Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth"
import { z } from "zod"

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

export async function getPlannerData(): Promise<PlannerData> {
  const studentId = await getStudentId()

  const [semesterPlans, completedCourses] = await Promise.all([
    prisma.semesterPlan.findMany({
      where: { studentId },
      include: {
        plannedCourses: {
          include: {
            course: true,
          },
          orderBy: { addedAt: "asc" },
        },
      },
      orderBy: [{ year: "asc" }, { term: "desc" }], // Fall/Spring ordering logic might need custom sort later
    }),
    prisma.completedCourse.findMany({
      where: { studentId },
      include: {
        course: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return { semesterPlans, completedCourses }
}

export async function createSemesterPlan(term: string, year: number) {
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

  await prisma.semesterPlan.create({
    data: {
      studentId,
      term: validated.term,
      year: validated.year,
      isActive: true,
    },
  })

  revalidatePath("/planner")
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
