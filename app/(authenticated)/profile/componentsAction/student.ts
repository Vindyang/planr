"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createProfileSchema = z.object({
  userId: z.string(),
  university: z.enum(["SMU", "NUS", "NTU", "SUTD", "SUSS"]),
  major: z.string().min(2),
  year: z.number().min(1).max(4),
  enrollmentYear: z.number(),
})

const updateProfileSchema = z.object({
  major: z.string().min(2).optional(),
  secondMajor: z.string().nullable().optional(),
  minor: z.string().nullable().optional(),
  year: z.number().min(1).max(4).optional(),
})

const addCourseSchema = z.object({
  courseId: z.string(),
  grade: z.string().min(1),
  term: z.string().min(1),
})

export async function createStudentProfile(
  input: z.infer<typeof createProfileSchema>
) {
  const validatedData = createProfileSchema.parse(input)

  const student = await prisma.student.create({
    data: {
      userId: validatedData.userId,
      university: validatedData.university,
      major: validatedData.major,
      year: validatedData.year,
      enrollmentYear: validatedData.enrollmentYear,
      expectedGraduationYear: validatedData.enrollmentYear + 4,
      gpa: 0,
    },
  })

  return {
    success: true,
    student: {
      id: student.id,
      university: student.university,
      major: student.major,
    },
  }
}

export async function updateStudentProfile(
  input: z.infer<typeof updateProfileSchema>
) {
  const session = await getSession()
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  const validatedData = updateProfileSchema.parse(input)

  const student = await prisma.student.update({
    where: { userId: session.user.id },
    data: validatedData,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  revalidatePath("/profile")
  revalidatePath("/dashboard")

  return { success: true, student }
}

export async function addCompletedCourse(
  input: z.infer<typeof addCourseSchema>
) {
  const session = await getSession()
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  const validatedData = addCourseSchema.parse(input)

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
  })

  if (!student) {
    return { success: false, error: "Student profile not found" }
  }

  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: validatedData.courseId },
  })

  if (!course) {
    return { success: false, error: "Course not found" }
  }

  // Check if already completed
  const existing = await prisma.completedCourse.findFirst({
    where: {
      studentId: student.id,
      courseId: validatedData.courseId,
    },
  })

  if (existing) {
    return { success: false, error: "Course already marked as completed" }
  }

  const completedCourse = await prisma.completedCourse.create({
    data: {
      studentId: student.id,
      courseId: validatedData.courseId,
      grade: validatedData.grade,
      term: validatedData.term,
      status: "COMPLETED",
    },
    include: {
      course: true,
    },
  })

  revalidatePath("/profile")
  revalidatePath("/dashboard")

  return { success: true, completedCourse }
}

export async function removeCompletedCourse(completedCourseId: string) {
  const session = await getSession()
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
  })

  if (!student) {
    return { success: false, error: "Student profile not found" }
  }

  // Verify the completed course belongs to this student
  const completedCourse = await prisma.completedCourse.findFirst({
    where: {
      id: completedCourseId,
      studentId: student.id,
    },
  })

  if (!completedCourse) {
    return { success: false, error: "Completed course not found" }
  }

  await prisma.completedCourse.delete({
    where: { id: completedCourseId },
  })

  revalidatePath("/profile")
  revalidatePath("/dashboard")

  return { success: true }
}
