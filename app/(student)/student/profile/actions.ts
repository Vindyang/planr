"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { calculateGPA } from "@/lib/gpa"

const createProfileSchema = z.object({
  userId: z.string(),
  universityId: z.string(),
  majorId: z.string(),
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
      universityId: validatedData.universityId,
      majorId: validatedData.majorId,
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
      universityId: student.universityId,
      majorId: student.majorId,
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

  // Get student's university to look up departments
  const currentStudent = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { universityId: true },
  })

  if (!currentStudent) {
    return { success: false, error: "Student profile not found" }
  }

  // Look up department IDs by name if provided
  const updateData: any = {}

  if (validatedData.major) {
    const majorDept = await prisma.department.findFirst({
      where: {
        universityId: currentStudent.universityId,
        name: validatedData.major,
      },
    })
    if (majorDept) {
      updateData.majorId = majorDept.id
    }
  }

  if (validatedData.secondMajor !== undefined) {
    if (validatedData.secondMajor === null) {
      updateData.secondMajorId = null
    } else {
      const secondMajorDept = await prisma.department.findFirst({
        where: {
          universityId: currentStudent.universityId,
          name: validatedData.secondMajor,
        },
      })
      if (secondMajorDept) {
        updateData.secondMajorId = secondMajorDept.id
      }
    }
  }

  if (validatedData.minor !== undefined) {
    if (validatedData.minor === null) {
      updateData.minorId = null
    } else {
      const minorDept = await prisma.department.findFirst({
        where: {
          universityId: currentStudent.universityId,
          name: validatedData.minor,
        },
      })
      if (minorDept) {
        updateData.minorId = minorDept.id
      }
    }
  }

  if (validatedData.year !== undefined) {
    updateData.year = validatedData.year
  }

  const student = await prisma.student.update({
    where: { userId: session.user.id },
    data: updateData,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      university: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      major: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      secondMajor: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      minor: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  })

  revalidatePath("/student/profile")
  revalidatePath("/dashboard")

  return { success: true, student }
}

async function recalculateGPA(studentId: string) {
  const completedCourses = await prisma.completedCourse.findMany({
    where: { studentId },
    include: { course: { select: { units: true } } },
  })

  const gpa = calculateGPA(
    completedCourses.map((cc) => ({
      grade: cc.grade,
      units: cc.course.units,
    }))
  )

  await prisma.student.update({
    where: { id: studentId },
    data: { gpa },
  })

  return gpa
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

  await recalculateGPA(student.id)

  revalidatePath("/student/profile")
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

  await recalculateGPA(student.id)

  revalidatePath("/student/profile")
  revalidatePath("/dashboard")

  return { success: true }
}
