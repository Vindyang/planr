import { prisma } from "@/lib/prisma"
import { cache } from "react"

export type StudentProfile = NonNullable<Awaited<ReturnType<typeof getStudentProfile>>>

export const getStudentProfile = cache(async (userId: string) => {
  return await prisma.student.findUnique({
    where: { userId },
    include: {
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
      completedCourses: {
        include: {
          course: {
            select: { id: true, code: true, title: true, units: true },
          },
        },
        orderBy: {
          term: "desc",
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })
})
