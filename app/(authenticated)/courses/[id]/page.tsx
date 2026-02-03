"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AppLayout } from "@/components/layout/AppLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react"

interface PrerequisiteDetail {
  id: string
  type: string
  prerequisiteCourse: {
    id: string
    code: string
    title: string
    units: number
  }
}

interface DependentCourse {
  id: string
  type: string
  course: {
    id: string
    code: string
    title: string
    units: number
  }
}

interface CourseDetail {
  id: string
  code: string
  title: string
  description: string
  units: number
  termsOffered: string[]
  tags: string[]
  isActive: boolean
  prerequisites: PrerequisiteDetail[]
  prerequisiteFor: DependentCourse[]
}

interface StudentData {
  id: string
  completedCourses: Array<{
    courseId: string
  }>
}

export default function CourseDetailPage() {
  const params = useParams()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [student, setStudent] = useState<StudentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const [courseRes, profileRes] = await Promise.all([
          fetch(`/api/courses/${params.id}`),
          fetch("/api/student/profile"),
        ])

        if (courseRes.ok) {
          const data = await courseRes.json()
          setCourse(data.course)
        } else {
          setError("Course not found")
        }

        if (profileRes.ok) {
          const data = await profileRes.json()
          setStudent(data.student)
        }
      } catch {
        setError("Failed to load course")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !course) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error || "Course not found"}</p>
        </div>
      </AppLayout>
    )
  }

  const completedIds = new Set(student?.completedCourses.map((c) => c.courseId) || [])
  const isCompleted = completedIds.has(course.id)

  const typeLabel: Record<string, string> = {
    HARD: "Required",
    SOFT: "Recommended",
    COREQUISITE: "Corequisite",
  }

  return (
    <AppLayout>
      <div className="flex flex-col space-y-8 bg-background min-h-screen -m-6 p-10 md:-m-8 md:p-12">
        {/* Back link */}
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <IconArrowLeft className="h-4 w-4" />
          <span className="uppercase tracking-wider text-xs">Back to Courses</span>
        </Link>

        {/* Header */}
        <header className="border-b border-border pb-8 space-y-3">
          <div className="flex items-center gap-3">
            <span className="uppercase text-xs tracking-wider font-medium text-muted-foreground">
              {course.code}
            </span>
            {isCompleted && (
              <span className="bg-muted text-muted-foreground text-xs uppercase tracking-wider px-2 py-0.5">
                Completed
              </span>
            )}
          </div>
          <h1 className="text-4xl font-serif italic text-foreground">
            {course.title}
          </h1>
        </header>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Main content */}
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                Description
              </h2>
              <p className="text-foreground leading-relaxed">{course.description}</p>
            </div>

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Prerequisites
                </h2>
                <div className="space-y-2">
                  {course.prerequisites.map((prereq) => {
                    const completed = completedIds.has(prereq.prerequisiteCourse.id)
                    return (
                      <Link
                        key={prereq.id}
                        href={`/courses/${prereq.prerequisiteCourse.id}`}
                        className="flex items-center justify-between p-4 border border-border bg-card hover:border-foreground transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {completed ? (
                            <IconCheck className="h-4 w-4 text-green-600" />
                          ) : prereq.type === "SOFT" ? (
                            <IconAlertTriangle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <IconX className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">
                              {prereq.prerequisiteCourse.code}
                            </span>
                            <p className="font-medium text-foreground text-sm">
                              {prereq.prerequisiteCourse.title}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs uppercase tracking-wider px-2 py-0.5 ${
                            prereq.type === "HARD"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : prereq.type === "SOFT"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {typeLabel[prereq.type] || prereq.type}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Courses that require this one */}
            {course.prerequisiteFor.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Unlocks
                </h2>
                <div className="grid gap-2 md:grid-cols-2">
                  {course.prerequisiteFor.map((dep) => (
                    <Link
                      key={dep.id}
                      href={`/courses/${dep.course.id}`}
                      className="p-4 border border-border bg-card hover:border-foreground transition-colors"
                    >
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        {dep.course.code}
                      </span>
                      <p className="font-medium text-foreground text-sm">
                        {dep.course.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar metadata */}
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 space-y-6">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Units
                </span>
                <p className="text-2xl font-serif italic">{course.units} CU</p>
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Terms Offered
                </span>
                <div className="flex gap-2">
                  {course.termsOffered.map((term) => (
                    <span
                      key={term}
                      className="px-2 py-1 text-xs uppercase tracking-wider border border-border"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Tags
                </span>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-none text-xs uppercase">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {!isCompleted && (
                <Link href="/planner">
                  <Button className="w-full text-xs uppercase tracking-wider">
                    Add to Plan
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
