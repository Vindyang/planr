import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

const SCIS_DEPARTMENT_CODES = ["IS", "CS", "SWE", "CYBER", "DS", "CL", "SCIS"]

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        university: {
          select: {
            code: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    if (student.university.code !== "SMU") {
      return NextResponse.json({
        professors: [],
        source: "unsupported_university",
      })
    }

    const scisProfessors = await prisma.professor.findMany({
      where: {
        universityId: student.universityId,
        department: {
          code: {
            in: SCIS_DEPARTMENT_CODES,
          },
        },
      },
      include: {
        department: {
          select: {
            code: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    const professorIds = scisProfessors.map((professor) => professor.id)

    if (professorIds.length === 0) {
      return NextResponse.json({
        source: "database",
        professors: [],
      })
    }

    const [aggregates, recentReviews] = await Promise.all([
      prisma.professorReview.groupBy({
        by: ["professorId"],
        where: {
          professorId: {
            in: professorIds,
          },
        },
        _avg: {
          rating: true,
          difficultyRating: true,
          workloadRating: true,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.professorReview.findMany({
        where: {
          professorId: {
            in: professorIds,
          },
        },
        include: {
          professor: {
            select: {
              id: true,
              name: true,
              department: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
          course: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
          student: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ])

    const aggregatesByProfessorId = new Map(
      aggregates.map((entry) => [
        entry.professorId,
        {
          totalReviews: entry._count._all,
          averageRating: entry._avg.rating ?? 0,
          averageDifficulty: entry._avg.difficultyRating ?? 0,
          averageWorkload: entry._avg.workloadRating ?? 0,
        },
      ])
    )

    const reviewsByProfessorId = new Map<string, Array<{
      id: string
      rating: number
      difficultyRating: number
      workloadRating: number
      content: string
      term: string | null
      isAnonymous: boolean
      createdAt: string
      professor: {
        id: string
        name: string
        department: {
          name: string
          code: string
        }
      }
      course: {
        id: string
        code: string
        title: string
      } | null
      studentName: string | null
      isOwn: boolean
    }>>()

    for (const review of recentReviews) {
      const current = reviewsByProfessorId.get(review.professorId) ?? []
      if (current.length >= 3) {
        continue
      }

      current.push({
        id: review.id,
        rating: review.rating,
        difficultyRating: review.difficultyRating,
        workloadRating: review.workloadRating,
        content: review.content,
        term: review.term,
        isAnonymous: review.isAnonymous,
        createdAt: review.createdAt.toISOString(),
        professor: review.professor,
        course: review.course,
        studentName: review.isAnonymous ? null : review.student.user.name,
        isOwn: false,
      })

      reviewsByProfessorId.set(review.professorId, current)
    }

    const professors = scisProfessors.map((professor) => ({
      id: professor.id,
      name: professor.name,
      designation: null,
      profileType: "Faculty",
      email: null,
      phone: null,
      photoUrl: null,
      profileUrl: null,
      departmentCode: professor.department.code,
      reviewSummary: aggregatesByProfessorId.get(professor.id) ?? {
        totalReviews: 0,
        averageRating: 0,
        averageDifficulty: 0,
        averageWorkload: 0,
      },
      recentReviews: reviewsByProfessorId.get(professor.id) ?? [],
    }))

    professors.sort((a, b) => {
      if (a.reviewSummary.totalReviews === 0 && b.reviewSummary.totalReviews > 0) {
        return 1
      }
      if (b.reviewSummary.totalReviews === 0 && a.reviewSummary.totalReviews > 0) {
        return -1
      }

      if (b.reviewSummary.averageRating !== a.reviewSummary.averageRating) {
        return b.reviewSummary.averageRating - a.reviewSummary.averageRating
      }

      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      source: "database",
      professors,
    })
  } catch (error) {
    console.error("Fetch SCIS professors error:", error)
    return NextResponse.json({ error: "Failed to fetch professors" }, { status: 500 })
  }
}
