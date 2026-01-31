"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { StatCards } from "./components/StatCards"
import { EligibleCoursesList } from "./components/EligibleCoursesList"
import { getEligibleCourses } from "./components/eligibility"
import { Course, Student } from "@/lib/types"

interface StudentData {
  id: string
  university: string
  major: string
  year: number
  enrollmentYear: number
  gpa: number
  user: {
    name: string
    email: string
  }
  completedCourses: Array<{
    id: string
    courseId: string
    grade: string
    term: string
    course: {
      id: string
      code: string
      title: string
      units: number
    }
  }>
}

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

export default function DashboardPage() {
  const [student, setStudent] = useState<StudentData | null>(null)
  const [courses, setCourses] = useState<CourseData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, coursesRes] = await Promise.all([
          fetch("/api/student/profile"),
          fetch("/api/courses"),
        ])

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setStudent(profileData.student)
        }

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setCourses(coursesData.courses || [])
        }
      } catch (err) {
        setError("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !student) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error || "Failed to load profile"}</p>
        </div>
      </AppLayout>
    )
  }

  // Transform data to match expected types
  const studentForStats: Student = {
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

  // Transform courses to match Course type
  const transformedCourses: Course[] = courses.map((course) => ({
    id: course.id,
    code: course.code,
    title: course.title,
    description: course.description,
    units: course.units,
    prerequisites: course.prerequisites.map((p) => ({
      courseId: p.prerequisiteCourseId,
      type: p.type.toLowerCase() as "hard" | "soft" | "corequisite",
    })),
    termsOffered: course.termsOffered,
    tags: course.tags,
  }))

  const eligibleCourses = getEligibleCourses(transformedCourses, studentForStats)

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Welcome back, {student.user.name}
            </span>
          </div>
        </div>

        <StatCards student={studentForStats} />

        <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">
            Eligible Courses for Next Semester
          </h3>
          <EligibleCoursesList courses={eligibleCourses} />
        </div>
      </div>
    </AppLayout>
  )
}
