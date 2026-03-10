import { prisma } from "@/lib/prisma"
import { cache } from "react"
import { University } from "@prisma/client"

export const getCourseWithPrerequisites = cache(async (courseId: string) => {
  return await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      prerequisites: {
        include: {
          prerequisiteCourse: {
            select: { id: true, code: true, title: true, units: true },
          },
        },
      },
      prerequisiteFor: {
        include: {
          course: {
            select: { id: true, code: true, title: true, units: true },
          },
        },
      },
    },
  })
})

// Optimized query with all display fields for dashboard
// Includes description, tags, and termsOffered in initial query
export const getCoursesWithDisplayData = cache(async (university: University) => {
  return await prisma.course.findMany({
    where: { university, isActive: true },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      units: true,
      tags: true,
      termsOffered: true,
      prerequisites: {
        select: {
          prerequisiteCourseId: true,
          type: true,
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
})

export const getAllCoursesForUniversity = cache(async (university: University) => {
  return await prisma.course.findMany({
    where: { university, isActive: true },
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
})
