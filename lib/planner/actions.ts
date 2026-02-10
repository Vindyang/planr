"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PlanStatus, Prisma } from "@prisma/client"
import { requireStudent } from "@/lib/auth"
import { z } from "zod"

// --- Types ---

export type PlannerData = {
  semesterPlans: (Prisma.SemesterPlanGetPayload<{
    include: { plannedCourses: { include: { course: true } } }
  }>)[]
  completedCourses: Prisma.CompletedCourseGetPayload<{
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
  const user = await requireStudent()

  const [semesterPlans, completedCourses] = await Promise.all([
    prisma.semesterPlan.findMany({
      where: { studentId: user.studentId },
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
      where: { studentId: user.studentId },
      include: {
        course: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return { semesterPlans, completedCourses }
}

export async function createSemesterPlan(term: string, year: number) {
  const user = await requireStudent()
  
  const validated = createPlanSchema.parse({ term, year })

  // Check if plan already exists for this term/year
  const existing = await prisma.semesterPlan.findFirst({
    where: {
      studentId: user.studentId,
      term: validated.term,
      year: validated.year,
    },
  })

  if (existing) {
    throw new Error("A plan for this semester already exists.")
  }

  await prisma.semesterPlan.create({
    data: {
      studentId: user.studentId!,
      term: validated.term,
      year: validated.year,
      isActive: true,
    },
  })

  revalidatePath("/planner")
}

export async function deleteSemesterPlan(planId: string) {
  const user = await requireStudent()

  const plan = await prisma.semesterPlan.findUnique({
    where: { id: planId },
  })

  if (!plan || plan.studentId !== user.studentId) {
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
  const user = await requireStudent()
  
  const validated = addCourseSchema.parse({ planId, courseId })

  // Verify ownership of plan
  const plan = await prisma.semesterPlan.findUnique({
    where: { id: validated.planId },
  })

  if (!plan || plan.studentId !== user.studentId) {
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
  const user = await requireStudent()

  const plannedCourse = await prisma.plannedCourse.findUnique({
    where: { id: plannedCourseId },
    include: { semesterPlan: true },
  })

  if (!plannedCourse || plannedCourse.semesterPlan.studentId !== user.studentId) {
    throw new Error("Course not found or unauthorized")
  }

  await prisma.plannedCourse.delete({
    where: { id: plannedCourseId },
  })

  revalidatePath("/planner")
}

export async function moveCourse(plannedCourseId: string, targetPlanId: string) {
  const user = await requireStudent()
  
  const validated = moveCourseSchema.parse({ plannedCourseId, targetPlanId })

  // Verify target plan ownership
  const targetPlan = await prisma.semesterPlan.findUnique({
    where: { id: validated.targetPlanId },
  })

  if (!targetPlan || targetPlan.studentId !== user.studentId) {
    throw new Error("Target plan not found or unauthorized")
  }

  // Verify source course ownership
  const sourceCourse = await prisma.plannedCourse.findUnique({
    where: { id: validated.plannedCourseId },
    include: { semesterPlan: true },
  })

  if (!sourceCourse || sourceCourse.semesterPlan.studentId !== user.studentId) {
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
