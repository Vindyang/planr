"use client"

import { Suspense, useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AppLayout } from "@/components/layout/AppLayout"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"
import { checkEligibility } from "../dashboard/components/eligibility"
import { Course, Student } from "@/lib/types"

interface CourseData {
  id: string
  code: string
  title: string
  description: string
  units: number
  termsOffered: string[]
  tags: string[]
  prerequisites: Array<{
    prerequisiteCourseId: string
    type: string
  }>
}

interface StudentData {
  id: string
  university: string
  major: string
  year: number
  enrollmentYear: number
  gpa: number
  user: { name: string; email: string }
  completedCourses: Array<{
    id: string
    courseId: string
    grade: string
    term: string
    course: { id: string; code: string; title: string; units: number }
  }>
}

function CoursesContent() {
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<CourseData[]>([])
  const [student, setStudent] = useState<StudentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get("q") || "")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [coursesRes, profileRes] = await Promise.all([
          fetch("/api/courses"),
          fetch("/api/student/profile"),
        ])

        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setCourses(data.courses || [])
        }
        if (profileRes.ok) {
          const data = await profileRes.json()
          setStudent(data.student)
        }
      } catch {
        // errors handled by empty state
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Extract unique tags from courses
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    courses.forEach((c) => c.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [courses])

  // Extract unique terms
  const allTerms = useMemo(() => {
    const termSet = new Set<string>()
    courses.forEach((c) => c.termsOffered.forEach((t) => termSet.add(t)))
    return Array.from(termSet).sort()
  }, [courses])

  // Build student type for eligibility checks
  const studentForEligibility: Student | null = student
    ? {
        id: student.id,
        name: student.user.name,
        major: student.major,
        year: student.year,
        enrollmentYear: student.enrollmentYear,
        gpa: student.gpa,
        completedCourses: student.completedCourses.map((cc) => ({
          courseId: cc.courseId,
          grade: cc.grade,
          term: cc.term,
        })),
      }
    : null

  const completedCourseIds = new Set(
    student?.completedCourses.map((cc) => cc.courseId) || []
  )

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        !search ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      const matchesTag = !selectedTag || c.tags.includes(selectedTag)
      const matchesTerm = !selectedTerm || c.termsOffered.includes(selectedTerm)
      return matchesSearch && matchesTag && matchesTerm
    })
  }, [courses, search, selectedTag, selectedTerm])

  function getEligibilityStatus(courseData: CourseData) {
    if (completedCourseIds.has(courseData.id)) return "completed"
    if (!studentForEligibility) return "unknown"

    const transformed: Course = {
      id: courseData.id,
      code: courseData.code,
      title: courseData.title,
      description: courseData.description,
      units: courseData.units,
      prerequisites: courseData.prerequisites.map((p) => ({
        courseId: p.prerequisiteCourseId,
        type: p.type.toLowerCase() as "hard" | "soft" | "corequisite",
      })),
      termsOffered: courseData.termsOffered,
      tags: courseData.tags,
    }

    const result = checkEligibility(transformed, studentForEligibility)
    if (result.isEligible) {
      if (result.softWarnings.length > 0 || result.corequisiteNeeded.length > 0)
        return "eligible-warnings"
      return "eligible"
    }
    return "ineligible"
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col space-y-8 bg-background min-h-screen -m-6 p-10 md:-m-8 md:p-12">
        <header className="flex justify-between items-end border-b border-border pb-8">
          <div>
            <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
              Courses
            </h1>
          </div>
          <span className="font-serif text-lg italic text-muted-foreground">
            {courses.length} courses available
          </span>
        </header>

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by code, title, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Tag filters */}
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                !selectedTag
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                  selectedTag === tag
                    ? "bg-foreground text-background border-foreground"
                    : "border-border hover:border-foreground"
                }`}
              >
                {tag}
              </button>
            ))}

            {/* Term filter separator */}
            <div className="w-px bg-border mx-2" />

            {allTerms.map((term) => (
              <button
                key={term}
                onClick={() =>
                  setSelectedTerm(selectedTerm === term ? null : term)
                }
                className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                  selectedTerm === term
                    ? "bg-foreground text-background border-foreground"
                    : "border-border hover:border-foreground"
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No courses match your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {filteredCourses.map((course) => {
              const status = getEligibilityStatus(course)
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="bg-card border border-border p-6 flex flex-col transition-all duration-200 hover:border-foreground hover:-translate-y-0.5 hover:shadow-md h-full"
                >
                  <div className="flex justify-between mb-3">
                    <span className="uppercase text-xs tracking-wider font-medium text-muted-foreground">
                      {course.code}
                    </span>
                    <div className="flex gap-1">
                      {course.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[0.6rem] uppercase border border-border px-1.5 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="text-lg font-medium leading-tight mb-2 text-foreground font-serif">
                    {course.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-grow">
                    {course.description}
                  </p>

                  <div className="mt-auto flex justify-between items-center border-t border-muted pt-4">
                    {status === "completed" && (
                      <span className="bg-muted text-muted-foreground text-xs uppercase tracking-wider px-2 py-1">
                        Completed
                      </span>
                    )}
                    {status === "eligible" && (
                      <span className="bg-green-100 text-green-800 text-xs uppercase tracking-wider px-2 py-1">
                        Eligible
                      </span>
                    )}
                    {status === "eligible-warnings" && (
                      <span className="bg-amber-100 text-amber-800 text-xs uppercase tracking-wider px-2 py-1">
                        Eligible*
                      </span>
                    )}
                    {status === "ineligible" && (
                      <span className="bg-red-100 text-red-800 text-xs uppercase tracking-wider px-2 py-1">
                        Missing Prereqs
                      </span>
                    )}
                    {status === "unknown" && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    <span className="uppercase text-[0.65rem] tracking-wider font-medium">
                      {course.units} CU
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        </AppLayout>
      }
    >
      <CoursesContent />
    </Suspense>
  )
}
