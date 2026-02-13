import { prisma } from "@/lib/prisma"
import { cache } from "react"
import { University } from "@prisma/client"

export const getCourseReviewsForUniversity = cache(async (university: University) => {
  return await prisma.courseReview.findMany({
    where: { course: { university } },
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

export const getProfessorReviewsForUniversity = cache(async (university: University) => {
  return await prisma.professorReview.findMany({
    where: { professor: { university } },
    include: {
      professor: { select: { id: true, name: true, department: true } },
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
  const reviews = await prisma.courseReview.findMany({
    where: { courseId },
    select: {
      rating: true,
      difficultyRating: true,
      workloadRating: true,
    },
  })

  if (reviews.length === 0) {
    return { averageRating: 0, averageDifficulty: 0, averageWorkload: 0, totalReviews: 0 }
  }

  return {
    averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
    averageDifficulty: reviews.reduce((sum, r) => sum + r.difficultyRating, 0) / reviews.length,
    averageWorkload: reviews.reduce((sum, r) => sum + r.workloadRating, 0) / reviews.length,
    totalReviews: reviews.length,
  }
})
