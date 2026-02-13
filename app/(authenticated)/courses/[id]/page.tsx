import { getSession } from "@/lib/auth"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react"
import { EligibilityStatus } from "@/lib/eligibility"
import { getCourseWithPrerequisites } from "@/lib/data/courses"
import { getStudentProfile, type StudentProfile } from "@/lib/data/students"
import { getEligibilityForCourse } from "@/lib/eligibility/service"
import { getCourseReviewsByCourse, getReviewAggregates } from "@/lib/data/reviews"
import { getProfessorsByCourse } from "@/lib/data/professors"
import { CourseReviewsSection } from "./_components/CourseReviewsSection"

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) {
    redirect("/login")
  }

  const { id } = await params

  // 1. Parallel Data Fetching
  const [course, student, courseReviews, reviewAggregates, courseProfessors] = await Promise.all([
    getCourseWithPrerequisites(id),
    getStudentProfile(session.user.id),
    getCourseReviewsByCourse(id),
    getReviewAggregates(id),
    getProfessorsByCourse(id),
  ])

  if (!course) {
    notFound()
  }

  // 2. Derive State
  const completedCourses: StudentProfile['completedCourses'] = student?.completedCourses ?? []
  const completedIds = new Set(completedCourses.map((c) => c.courseId))
  const completedGrades = new Map(completedCourses.map((c) => [c.courseId, c.grade] as const))
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

            {/* Eligibility Issues */}
            {eligibility && !eligibility.eligibility.isEligible && (
              <div className="space-y-3">
                <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Why Not Eligible
                </h2>
                <div className="bg-red-50 border border-red-200 p-4 space-y-2">
                  {eligibility.eligibility.reasons.map((reason, i) => (
                    <p key={i} className="text-sm text-red-700">
                      • {reason}
                    </p>
                  ))}
                </div>
                {eligibility.eligibility.suggestions.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wider font-medium text-blue-700">
                      Suggestions
                    </p>
                    {eligibility.eligibility.suggestions.map((suggestion, i) => (
                      <p key={i} className="text-sm text-blue-700">
                        • {suggestion}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggested Sequence */}
            {eligibility && eligibility.suggestedSequence.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Suggested Course Sequence
                </h2>
                <div className="space-y-2">
                  {eligibility.suggestedSequence.map((suggested) => (
                    <Link
                      key={suggested.courseId}
                      href={`/courses/${suggested.courseId}`}
                      className="flex items-center gap-3 p-3 border border-border bg-card hover:border-foreground transition-colors"
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                        {suggested.order}
                      </span>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                          {suggested.courseCode}
                        </span>
                        <p className="font-medium text-foreground text-sm">
                          {suggested.courseTitle}
                        </p>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {suggested.reason}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Prerequisites
                </h2>
                <div className="space-y-2">
                  {course.prerequisites.map((prereq: (typeof course.prerequisites)[number]) => {
                    const completed = completedIds.has(prereq.prerequisiteCourse.id)
                    const grade = completedGrades.get(prereq.prerequisiteCourse.id)
                    const gradeDeficiency = getGradeDeficiency(prereq.prerequisiteCourse.id)

                    return (
                      <Link
                        key={prereq.id}
                        href={`/courses/${prereq.prerequisiteCourse.id}`}
                        className="flex items-center justify-between p-4 border border-border bg-card hover:border-foreground transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {completed && !gradeDeficiency ? (
                            <IconCheck className="h-4 w-4 text-green-600" />
                          ) : gradeDeficiency ? (
                            <IconAlertTriangle className="h-4 w-4 text-red-500" />
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
                            {gradeDeficiency && (
                              <p className="text-xs text-red-600">
                                Grade {gradeDeficiency.actualGrade} does not meet minimum {gradeDeficiency.requiredGrade}
                              </p>
                            )}
                            {completed && grade && !gradeDeficiency && (
                              <p className="text-xs text-green-600">
                                Completed with grade {grade}
                              </p>
                            )}
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
                  {course.prerequisiteFor.map((dep: (typeof course.prerequisiteFor)[number]) => (
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

            {/* Reviews Section */}
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

              {!isCompleted && eligibility?.eligibility.isEligible && (
                <Link href="/planner">
                  <Button className="w-full text-xs uppercase tracking-wider">
                    Add to Plan
                  </Button>
                </Link>
              )}

              {!isCompleted && !eligibility?.eligibility.isEligible && (
                <Button className="w-full text-xs uppercase tracking-wider" disabled>
                  Prerequisites Required
                </Button>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}
