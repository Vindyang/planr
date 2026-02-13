import { prisma } from "@/lib/prisma"
import { cache } from "react"
import { University } from "@prisma/client"

export const getProfessorsByCourse = cache(async (courseId: string) => {
  const instructors = await prisma.courseInstructor.findMany({
    where: { courseId },
    include: {
      professor: { select: { id: true, name: true, department: true } },
    },
  })

  // Deduplicate (a professor might teach the same course in multiple terms)
  const map = new Map<string, { id: string; name: string; department: string }>()
  instructors.forEach((i) => map.set(i.professor.id, i.professor))
  return Array.from(map.values())
})

export const getProfessorsForUniversity = cache(async (university: University) => {
  return await prisma.professor.findMany({
    where: { university },
    include: {
      courseInstructors: {
        include: {
          course: { select: { id: true, code: true, title: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  })
})
