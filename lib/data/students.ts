import { prisma } from "@/lib/prisma"
import { cache } from "react"

export type StudentProfile = NonNullable<Awaited<ReturnType<typeof getStudentProfile>>>

export const getStudentProfile = cache(async (userId: string) => {
  return await prisma.student.findUnique({
    where: { userId },
    include: {
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
