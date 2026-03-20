import { getSession } from "@/lib/auth"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { IconArrowLeft, IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react"
import { EligibilityStatus } from "@/lib/eligibility"
import { getCourseWithPrerequisites } from "@/lib/data/courses"
import { getStudentProfile } from "@/lib/data/students"
import { getEligibilityForCourse } from "@/lib/eligibility/service"
import { getCourseReviewsByCourse, getReviewAggregates } from "@/lib/data/reviews"
import { getProfessorsByCourse } from "@/lib/data/professors"
import { getPlannerData } from "@/lib/planner/actions"
import { CourseReviewsSection } from "./_components/CourseReviewsSection"
import { AddToPlanButton } from "./_components/AddToPlanButton"

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) {
    redirect("/login")
  }

  const { id } = await params

  // 1. Parallel Data Fetching
  const [course, student, courseReviews, reviewAggregates, fetchedProfessors] = await Promise.all([
    getCourseWithPrerequisites(id),
    getStudentProfile(session.user.id),
    getCourseReviewsByCourse(id),
    getReviewAggregates(id),
    getProfessorsByCourse(id),
  ])

  // Transform professors to use department name as string
  const courseProfessors = fetchedProfessors.map((prof) => ({
    id: prof.id,
    name: prof.name,
    department: prof.department.name,
  }))

  if (!course) {
    notFound()
  }

  // Fetch planner data if student exists
  const plannerData = student ? await getPlannerData(student.id) : null

  // 2. Derive State
  const completedCourses = student?.completedCourses
  const completedIds = new Set(completedCourses?.map((c) => c.courseId))
  const completedGrades = new Map(completedCourses?.map((c) => [c.courseId, c.grade] as const))
  const isCompleted = completedIds.has(course.id)

  // 3. Check Eligibility (if needed)
  let eligibility = null
  if (!isCompleted && student) {
    // Pass pre-fetched objects to avoid re-fetching
    eligibility = await getEligibilityForCourse(session.user.id, id, student, course)
  }

  // Helper for UI logic
  const typeLabel: Record<string, string> = {
    HARD: "Required",
    SOFT: "Recommended",
    COREQUISITE: "Corequisite",
  }

  const getGradeDeficiency = (prereqCourseId: string) => {
    return eligibility?.eligibility.gradeDeficiencies.find(
      (g) => g.courseId === prereqCourseId
    )
  }

  return (
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
            {!isCompleted && eligibility && (
              <span
                className={`text-xs uppercase tracking-wider px-2 py-0.5 ${
                  eligibility.eligibility.status === EligibilityStatus.ELIGIBLE
                    ? "bg-green-100 text-green-800"
                    : eligibility.eligibility.status === EligibilityStatus.WARNING
                      ? "bg-amber-100 text-amber-800"
                      : eligibility.eligibility.status === EligibilityStatus.COREQUISITE_NEEDED
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                }`}
              >
                {eligibility.eligibility.status === EligibilityStatus.ELIGIBLE
                  ? "Eligible"
                  : eligibility.eligibility.status === EligibilityStatus.WARNING
                    ? "Eligible (with warnings)"
                    : eligibility.eligibility.status === EligibilityStatus.COREQUISITE_NEEDED
                      ? "Needs Corequisite"
                      : "Not Eligible"}
              </span>
            )}
          </div>
          <h1 className="text-4xl font-serif italic text-foreground">
            {course.title}
          </h1>
        </header>

{/* Main Content Area */}
        <div className="pt-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-transparent border-b border-border w-full flex justify-start h-auto rounded-none p-0 mb-8 space-x-8">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-medium uppercase text-xs tracking-wider"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="requirements" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-medium uppercase text-xs tracking-wider"
              >
                Requirements & Eligibility
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-medium uppercase text-xs tracking-wider"
              >
                Reviews
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="mt-0">
              <div className="grid gap-12 md:grid-cols-3">
                <div className="md:col-span-2 space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                      Description
                    </h2>
                    <p className="text-foreground leading-relaxed {course.description.length > 300 ? 'text-lg' : 'text-xl'}">
                      {course.description}
                    </p>
                  </div>
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

                    {!isCompleted && plannerData && (
                      <AddToPlanButton
                        course={{
                          id: course.id,
                          code: course.code,
                          title: course.title,
                        }}
                        semesterPlans={plannerData.semesterPlans}
                        isEligible={eligibility?.eligibility.isEligible ?? false}
                        className="w-full text-xs uppercase tracking-wider"
                      />
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* REQUIREMENTS TAB */}
            <TabsContent value="requirements" className="mt-0">
              <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
                <div className="md:col-span-2 space-y-12">
                  
                  {/* Eligibility Issues */}
                  {eligibility && !eligibility.eligibility.isEligible && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                          Why Not Eligible
                        </h2>
                        <div className="border border-border p-5 bg-transparent space-y-3">
                          {eligibility.eligibility.reasons.map((reason, i) => (
                            <p key={i} className="text-sm text-foreground flex items-baseline gap-2">
                              <span className="text-red-500">•</span> {reason}
                            </p>
                          ))}
                        </div>
                      </div>
                      
                      {eligibility.eligibility.suggestions.length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mt-6">
                            Suggestions
                          </h2>
                          <div className="border border-border p-5 bg-transparent space-y-3">
                            {eligibility.eligibility.suggestions.map((suggestion, i) => (
                              <p key={i} className="text-sm text-foreground flex items-baseline gap-2">
                                <span className="text-foreground">•</span> {suggestion}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prerequisites */}
                  {course.prerequisites.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                        Prerequisites
                      </h2>
                      <div className="space-y-3">
                        {course.prerequisites.map((prereq: (typeof course.prerequisites)[number]) => {
                          const completed = completedIds.has(prereq.prerequisiteCourse.id)
                          const grade = completedGrades.get(prereq.prerequisiteCourse.id)
                          const gradeDeficiency = getGradeDeficiency(prereq.prerequisiteCourse.id)

                          return (
                            <Link
                              key={prereq.id}
                              href={`/courses/${prereq.prerequisiteCourse.id}`}
                              className="flex items-center justify-between p-5 border border-border bg-card hover:border-foreground transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                {completed && !gradeDeficiency ? (
                                  <IconCheck className="h-5 w-5 text-green-600" />
                                ) : gradeDeficiency ? (
                                  <IconAlertTriangle className="h-5 w-5 text-red-500" />
                                ) : prereq.type === "SOFT" ? (
                                  <IconAlertTriangle className="h-5 w-5 text-amber-500" />
                                ) : (
                                  <IconX className="h-5 w-5 text-red-500" />
                                )}
                                <div>
                                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                                    {prereq.prerequisiteCourse.code}
                                  </span>
                                  <p className="font-medium text-foreground text-base">
                                    {prereq.prerequisiteCourse.title}
                                  </p>
                                  {gradeDeficiency && (
                                    <p className="text-sm text-red-600 mt-1">
                                      Grade {gradeDeficiency.actualGrade} does not meet minimum {gradeDeficiency.requiredGrade}
                                    </p>
                                  )}
                                  {completed && grade && !gradeDeficiency && (
                                    <p className="text-sm text-green-600 mt-1">
                                      Completed with grade {grade}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`text-xs uppercase tracking-wider px-3 py-1 ${
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

                  {/* Unlocks */}
                  {course.prerequisiteFor.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                        Unlocks
                      </h2>
                      <div className="grid gap-3 md:grid-cols-2">
                        {course.prerequisiteFor.map((dep: (typeof course.prerequisiteFor)[number]) => (
                          <Link
                            key={dep.id}
                            href={`/courses/${dep.course.id}`}
                            className="p-5 border border-border bg-card hover:border-foreground transition-colors"
                          >
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">
                              {dep.course.code}
                            </span>
                            <p className="font-medium text-foreground text-base">
                              {dep.course.title}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Sequence if exists */}
                {eligibility && eligibility.suggestedSequence.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                      Suggested Course Sequence
                    </h2>
                    <div className="space-y-3">
                      {eligibility.suggestedSequence.map((suggested) => (
                        <Link
                          key={suggested.courseId}
                          href={`/courses/${suggested.courseId}`}
                          className="flex items-start gap-4 p-4 border border-border bg-card hover:border-foreground transition-colors"
                        >
                          <span className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                            {suggested.order}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">
                              {suggested.courseCode}
                            </span>
                            <p className="font-medium text-foreground text-base">
                              {suggested.courseTitle}
                            </p>
                            <span className="text-sm text-muted-foreground mt-1">
                              {suggested.reason}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* REVIEWS TAB */}
            <TabsContent value="reviews" className="mt-0">
              <div className="max-w-4xl">
                 <CourseReviewsSection
                  courseId={course.id}
                  studentId={student?.id ?? null}
                  isCompleted={isCompleted}
                  hasReviewed={courseReviews.some((r) => r.studentId === student?.id)}
                  initialCourseReviews={courseReviews.map((r) => ({
                    id: r.id,
                    rating: r.rating,
                    difficultyRating: r.difficultyRating,
                    workloadRating: r.workloadRating,
                    content: r.content,
                    term: r.term,
                    isAnonymous: r.isAnonymous,
                    createdAt: r.createdAt.toISOString(),
                    course: r.course,
                    studentName: r.isAnonymous ? null : r.student.user.name,
                    isOwn: r.studentId === student?.id,
                  }))}
                  initialAggregates={reviewAggregates}
                  initialProfessors={courseProfessors}
                  completedCourses={
                    student?.completedCourses
                      .filter((cc) => cc.status === "COMPLETED")
                      .map((cc) => ({
                        courseId: cc.courseId,
                        code: cc.course.code,
                        title: cc.course.title,
                        term: cc.term,
                      })) ?? []
                  }
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </div>
  )
}
