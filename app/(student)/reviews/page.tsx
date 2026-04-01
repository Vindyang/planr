"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { CourseReviewCard } from "@/components/reviews/CourseReviewCard"
import { ProfessorReviewCard } from "@/components/reviews/ProfessorReviewCard"
import { WriteReviewDialog } from "@/components/reviews/WriteReviewDialog"
import { EditReviewDialog } from "@/components/reviews/EditReviewDialog"
import { toast } from "@/components/ui/toast"
import type { CourseReviewData, ProfessorReviewData, ProfessorData } from "@/lib/types"
import { ReviewsPageSkeleton } from "./skeleton/ReviewsPageSkeleton"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle, EmptyMedia, EmptyContent } from "@/components/ui/empty"
import { IconBook, IconUser } from "@tabler/icons-react"
interface CompletedCourseOption {
  courseId: string
  code: string
  title: string
  term: string
}

async function parseApiError(response: Response, fallback: string) {
  try {
    const data = await response.json()
    if (typeof data?.error === "string" && data.error.trim().length > 0) {
      return data.error
    }
  } catch {
    // ignore non-JSON errors and use fallback
  }

  return fallback
}

function MyReviewsContent() {
  const [activeTab, setActiveTab] = useState<"courses" | "professors">("courses")
  const [courseReviews, setCourseReviews] = useState<CourseReviewData[]>([])
  const [professorReviews, setProfessorReviews] = useState<ProfessorReviewData[]>([])
  const [completedCourses, setCompletedCourses] = useState<CompletedCourseOption[]>([])
  const [professors, setProfessors] = useState<ProfessorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReviewFormDataReady, setIsReviewFormDataReady] = useState(false)
  const [editingReview, setEditingReview] = useState<{
    review: CourseReviewData | ProfessorReviewData
    type: "course" | "professor"
  } | null>(null)

  const fetchReviews = useCallback(async () => {
    let courses: CourseReviewData[] = []
    let professorsData: ProfessorReviewData[] = []

    try {
      const [courseRes, profRes] = await Promise.all([
        fetch("/api/reviews/courses?mine=true"),
        fetch("/api/reviews/professors?mine=true"),
      ])

      if (courseRes.ok) {
        const data = await courseRes.json()
        courses = data.reviews || []
        setCourseReviews(courses)
      }
      if (profRes.ok) {
        const data = await profRes.json()
        professorsData = data.reviews || []
        setProfessorReviews(professorsData)
      }
    } catch {
      // keep existing state
    }

    return {
      courseCount: courses.length,
      professorCount: professorsData.length,
    }
  }, [])

  const fetchReviewFormData = useCallback(async () => {
    try {
      const [profileRes, professorsRes] = await Promise.all([
        fetch("/api/student/profile"),
        fetch("/api/professors"),
      ])

      if (profileRes.ok) {
        const data = await profileRes.json()
        const courses = (data.student?.completedCourses || [])
          .filter(
            (cc: { status: string }) => cc.status === "COMPLETED"
          )
          .map(
            (cc: { courseId: string; term: string; course: { code: string; title: string } }) => ({
              courseId: cc.courseId,
              code: cc.course.code,
              title: cc.course.title,
              term: cc.term,
            })
          )
        setCompletedCourses(courses)
      }

      if (professorsRes.ok) {
        const data = await professorsRes.json()
        setProfessors(data.professors || [])
      }
    } catch {
      // empty arrays are acceptable fallbacks
    } finally {
      setIsReviewFormDataReady(true)
    }
  }, [])

  const refreshReviews = useCallback(async () => {
    await fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    const loadInitialData = async () => {
      const { courseCount, professorCount } = await fetchReviews()
      setIsLoading(false)

      // Load review form options only when they are likely needed by empty states.
      if (courseCount === 0 || professorCount === 0) {
        void fetchReviewFormData()
      }
    }

    void loadInitialData()
  }, [fetchReviews, fetchReviewFormData])

  useEffect(() => {
    if (!isLoading && !isReviewFormDataReady && (courseReviews.length === 0 || professorReviews.length === 0)) {
      void fetchReviewFormData()
    }
  }, [isLoading, isReviewFormDataReady, courseReviews.length, professorReviews.length, fetchReviewFormData])

  const reviewedCourseIds = useMemo(
    () => new Set(courseReviews.map((r) => r.course.id)),
    [courseReviews]
  )

  const reviewedProfessorIds = useMemo(
    () => new Set(professorReviews.map((r) => r.professor.id)),
    [professorReviews]
  )

  const handleDeleteCourseReview = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/courses/${id}`, { method: "DELETE" })
      if (!response.ok) {
        const message = await parseApiError(response, "Failed to delete review")

        // If it no longer exists, treat as successful cleanup to avoid false negatives.
        if (response.status === 404 && message === "Review not found") {
          toast.success("Review deleted")
          await refreshReviews()
          return
        }

        throw new Error(message)
      }

      toast.success("Review deleted")
      await refreshReviews()
    } catch (error) {
      toast.error("Failed to delete review", {
        description: (error as Error).message,
      })
    }
  }

  const handleDeleteProfessorReview = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/professors/${id}`, { method: "DELETE" })
      if (!response.ok) {
        const message = await parseApiError(response, "Failed to delete review")

        // If it no longer exists, treat as successful cleanup to avoid false negatives.
        if (response.status === 404 && message === "Review not found") {
          toast.success("Review deleted")
          await refreshReviews()
          return
        }

        throw new Error(message)
      }

      toast.success("Review deleted")
      await refreshReviews()
    } catch (error) {
      toast.error("Failed to delete review", {
        description: (error as Error).message,
      })
    }
  }

  const totalReviews = courseReviews.length + professorReviews.length

  if (isLoading) {
    return <ReviewsPageSkeleton />
  }

  return (
    <>
      <div className="flex flex-col gap-6 bg-background min-h-[calc(100vh-65px)]">
        <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
              My Reviews
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Track and manage your course and professor feedback.
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Total Submitted
            </p>
            <p className="font-serif text-lg italic text-muted-foreground">
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>
        </header>

        <div className="flex gap-2 border-b border-border pb-3">
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-4 py-2 text-xs uppercase tracking-wider border transition-colors cursor-pointer ${
              activeTab === "courses"
                ? "border-foreground text-foreground bg-card"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            Course Reviews ({courseReviews.length})
          </button>
          <button
            onClick={() => setActiveTab("professors")}
            className={`px-4 py-2 text-xs uppercase tracking-wider border transition-colors cursor-pointer ${
              activeTab === "professors"
                ? "border-foreground text-foreground bg-card"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            Professor Reviews ({professorReviews.length})
          </button>
        </div>

        <section className="min-h-[420px] pt-2">
          {activeTab === "courses" ? (
            courseReviews.length === 0 ? (
              <Empty className="mt-6 border border-border bg-card px-6 py-10 rounded-none">
                <EmptyMedia>
                  <IconBook className="h-6 w-6" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No course reviews found</EmptyTitle>
                  <EmptyDescription>
                    You haven&apos;t written any course reviews yet.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  {isReviewFormDataReady ? (
                    <WriteReviewDialog
                      completedCourses={completedCourses}
                      professors={professors}
                      reviewedCourseIds={reviewedCourseIds}
                      reviewedProfessorIds={reviewedProfessorIds}
                      onSuccess={refreshReviews}
                    />
                  ) : (
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Loading review options...
                    </p>
                  )}
                </EmptyContent>
              </Empty>
            ) : (
              <div className="grid gap-5">
                {courseReviews.map((review) => (
                  <CourseReviewCard
                    key={review.id}
                    review={review}
                    onEdit={(r) => setEditingReview({ review: r, type: "course" })}
                    onDelete={handleDeleteCourseReview}
                  />
                ))}
              </div>
            )
          ) : professorReviews.length === 0 ? (
            <Empty className="mt-6 border border-border bg-card px-6 py-10 rounded-none">
              <EmptyMedia>
                <IconUser className="h-6 w-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No professor reviews found</EmptyTitle>
                <EmptyDescription>
                  You haven&apos;t written any professor reviews yet.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {isReviewFormDataReady ? (
                  <WriteReviewDialog
                    completedCourses={completedCourses}
                    professors={professors}
                    reviewedCourseIds={reviewedCourseIds}
                    reviewedProfessorIds={reviewedProfessorIds}
                    onSuccess={refreshReviews}
                  />
                ) : (
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Loading review options...
                  </p>
                )}
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-5">
              {professorReviews.map((review) => (
                <ProfessorReviewCard
                  key={review.id}
                  review={review}
                  onEdit={(r) => setEditingReview({ review: r, type: "professor" })}
                  onDelete={handleDeleteProfessorReview}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {editingReview && (
        <EditReviewDialog
          review={editingReview.review}
          type={editingReview.type}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingReview(null)
          }}
          onSuccess={refreshReviews}
        />
      )}
    </>
  )
}

export default function ReviewsPage() {
  return <MyReviewsContent />
}
