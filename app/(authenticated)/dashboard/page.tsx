import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppLayout } from "@/components/layout/AppLayout"
import { StatCards } from "./components/StatCards"
import { EligibleCoursesList } from "./components/EligibleCoursesList"
import {
  getEligibleCoursesWithDetails,
  CourseWithPrereqs,
  CompletedCourseInfo,
} from "@/lib/eligibility"
import { Student } from "@/lib/types"
import { getStudentProfile } from "@/lib/data/students"
import { getAllCoursesForUniversity } from "@/lib/data/courses"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) {
    redirect("/login")
  }

  const student = await getStudentProfile(session.user.id)

  if (!student) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Student profile not found</p>
        </div>
      </AppLayout>
    )
  }

  const courses = await getAllCoursesForUniversity(student.university)

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

  // Transform courses to match CourseWithPrereqs type
  // getAllCoursesForUniversity returns full prerequisite objects, we need to map to the structure expected by eligibility checker
  const transformedCourses: CourseWithPrereqs[] = courses.map((course) => ({
    id: course.id,
    code: course.code,
    title: course.title,
    units: course.units,
    prerequisites: course.prerequisites.map((p) => ({
      prerequisiteCourseId: p.prerequisiteCourseId,
      type: p.type,
      prerequisiteCourse: p.prerequisiteCourse, // Include full object if available/needed types
    })),
  }))

  // Transform completed courses for eligibility checking
  const completedCoursesInfo: CompletedCourseInfo[] = student.completedCourses.map((cc) => ({
    courseId: cc.courseId,
    grade: cc.grade,
    course: cc.course,
  }))

  // Get eligible courses using enhanced eligibility system
  const eligibleCourses = getEligibleCoursesWithDetails(
    transformedCourses,
    completedCoursesInfo,
    { university: student.university }
  )

  // Add descriptions and tags back for display
  const eligibleCoursesWithDisplay = eligibleCourses.map((ec) => {
    const originalCourse = courses.find((c) => c.id === ec.course.id)
    return {
      ...ec,
      course: {
        ...ec.course,
        description: originalCourse?.description ?? "",
        tags: originalCourse?.tags ?? [],
        termsOffered: originalCourse?.termsOffered ?? [],
      },
    }
  })

  return (
    <AppLayout>
      <div className="flex flex-col space-y-8 bg-background min-h-screen -m-6 p-10 md:-m-8 md:p-12">
        <header className="flex justify-between items-start border-b border-border pb-8">
          <div>
            <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
              Home <br />
            </h1>
          </div>
          <div className="text-right">
             <span className="block text-sm mt-1 uppercase tracking-wider font-medium text-foreground">
              Welcome back, {student.user.name}
             </span>
             <span className="font-serif text-xl italic text-muted-foreground">
               Year {student.year} • {student.major}
             </span>
          </div>
        </header>

        <StatCards
          student={studentForStats}
          totalUnits={student.completedCourses.reduce((sum, cc) => sum + cc.course.units, 0)}
        />

        <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">
            Eligible Courses for Next Semester
          </h3>
          <EligibleCoursesList courses={eligibleCoursesWithDisplay} />
        </div>
      </div>
    </AppLayout>
  )
}
