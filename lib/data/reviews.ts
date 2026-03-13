import { prisma } from "@/lib/prisma"
import { cache } from "react"

export const getCourseReviewsForUniversity = cache(async (universityId: string) => {
  return await prisma.courseReview.findMany({
    where: { course: { universityId } },
    include: {
      course: { select: { id: true, code: true, title: true } },
      student: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
})

export const getCourseReviewsByCourse = cache(async (courseId: string) => {
  return await prisma.courseReview.findMany({
    where: { courseId },
    include: {
      course: { select: { id: true, code: true, title: true } },
      student: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
})

export const getProfessorReviewsForUniversity = cache(async (universityId: string) => {
  return await prisma.professorReview.findMany({
    where: { professor: { universityId } },
    include: {
      professor: {
        select: {
          id: true,
          name: true,
          department: {
            select: { name: true, code: true },
          },
        },
      },
      course: { select: { id: true, code: true, title: true } },
      student: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
})

export const getReviewAggregates = cache(async (courseId: string) => {
  const result = await prisma.courseReview.aggregate({
    where: { courseId },
    _avg: {
      rating: true,
      difficultyRating: true,
      workloadRating: true,
    },
    _count: true,
  })

  return {
    averageRating: result._avg.rating ?? 0,
    averageDifficulty: result._avg.difficultyRating ?? 0,
    averageWorkload: result._avg.workloadRating ?? 0,
    totalReviews: result._count,
  }
})
