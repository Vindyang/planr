import { Suspense } from "react"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"
import CoursesClient from "./CoursesClient"
import { CoursesPageSkeleton } from "./skeleton/CoursesPageSkeleton"

// Cache courses data for 10 minutes since it rarely changes
const getCachedCourses = unstable_cache(
  async (universityId: string) => {
    return prisma.course.findMany({
      where: {
        universityId,
        isActive: true,
      },
      include: {
        prerequisites: {
          select: {
            prerequisiteCourseId: true,
            type: true,
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    })
  },
  ["courses-by-university"],
  {
    revalidate: 600, // 10 minutes
    tags: ["courses"],
  }
)

async function CoursesContent() {
  // All queries in this function share the same request context
  // so React's cache() deduplicates auth queries automatically
  const session = await requireSession()

  // First, get student profile with completed courses
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      university: {
        select: {
          code: true,
          name: true,
        },
      },
      major: {
        select: {
          code: true,
          name: true,
        },
      },
      completedCourses: {
        include: {
          course: {
            select: {
              id: true,
              code: true,
              title: true,
              units: true,
            },
          },
        },
        orderBy: {
          term: "desc",
        },
      },
    },
  })

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Student profile not found</p>
      </div>
    )
  }

  // Then fetch courses using cached query
  const courses = await getCachedCourses(student.universityId)

  return (
    <CoursesClient
      initialCourses={courses}
      initialStudent={student}
    />
  )
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesPageSkeleton />}>
      <CoursesContent />
    </Suspense>
  )
}
