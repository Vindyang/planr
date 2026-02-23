import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StatCards } from "./components/StatCards"
import { EligibleCoursesList } from "./components/EligibleCoursesList"
import {
  getEligibleCoursesWithDetails,
  CourseWithPrereqs,
  CompletedCourseInfo,
} from "@/lib/eligibility"
import { getStudentProfile } from "@/lib/data/students"
import { getCoursesWithDisplayData } from "@/lib/data/courses"
import { getPlannerData } from "@/lib/planner/actions"
import { PlanSummary } from "./components/PlanSummary"
import { UpcomingDeadlines } from "./components/UpcomingDeadlines"

function getNextSemesterFromPlans(
  semesterPlans: Awaited<ReturnType<typeof getPlannerData>>["semesterPlans"]
) {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const targetTerm = month >= 0 && month <= 4 ? "Spring" : "Fall"

  const plan = semesterPlans.find(
    (p) => p.term === targetTerm && p.year === year
  )

  return {
    coursesCount: plan?.plannedCourses.length ?? 0,
    totalUnits:
      plan?.plannedCourses.reduce((sum, pc) => sum + pc.course.units, 0) ?? 0,
    term: targetTerm,
    year,
  }
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) {
    redirect("/login")
  }

  const student = await getStudentProfile(session.user.id)

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Student profile not found</p>
      </div>
    )
  }

  // Fetch courses and planner data in parallel (2 cached queries)
  const [courses, plannerData] = await Promise.all([
    getCoursesWithDisplayData(student.university),
    getPlannerData(student.id),
  ])

  const nextSemester = getNextSemesterFromPlans(plannerData.semesterPlans)

  // Transform completed courses for eligibility checking
  const completedCoursesInfo: CompletedCourseInfo[] = student.completedCourses.map((cc) => ({
    courseId: cc.courseId,
    grade: cc.grade,
    course: cc.course,
  }))

  // Get eligible courses - courses already have all display fields (description, tags, termsOffered)
  const eligibleCourses = getEligibleCoursesWithDetails(
    courses as CourseWithPrereqs[],
    completedCoursesInfo,
    { university: student.university }
  )

  // Filter out courses that are already in the planner
  const plannedCourseIds = new Set<string>()
  plannerData.semesterPlans.forEach((plan) => {
    plan.plannedCourses.forEach((pc) => {
      plannedCourseIds.add(pc.courseId)
    })
  })

  const filteredEligibleCourses = eligibleCourses.filter(
    (ec) => !plannedCourseIds.has(ec.course.id)
  )

  // Calculate statistics
  const completedUnits = student.completedCourses.reduce(
    (sum, cc) => sum + cc.course.units,
    0
  )

  const plannedUnits = plannerData.semesterPlans.reduce(
    (sum, plan) => sum + plan.plannedCourses.reduce((s, pc) => s + pc.course.units, 0),
    0
  )

  const remainingUnits = Math.max(0, 120 - completedUnits - plannedUnits)

  return (
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

      {/* Enhanced Stat Cards - 3x2 Grid */}
      <StatCards
        gpa={student.gpa}
        unitsEarned={completedUnits}
        year={student.year}
        major={student.major}
        nextSemesterCourses={nextSemester.coursesCount}
        totalCoursesTaken={student.completedCourses.length}
        remainingUnits={remainingUnits}
      />

      {/* Main Content: Eligible Courses + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold tracking-tight mb-4">
            Eligible Courses for Next Semester
          </h3>
          <EligibleCoursesList
            courses={filteredEligibleCourses}
            semesterPlans={plannerData.semesterPlans}
          />
        </div>

        <div className="space-y-6">
          <PlanSummary semesterPlans={plannerData.semesterPlans} />
          <UpcomingDeadlines />
        </div>
      </div>
    </div>
  )
}
