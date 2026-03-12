"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { CourseReviewCard } from "@/components/reviews/CourseReviewCard"
import { ProfessorReviewCard } from "@/components/reviews/ProfessorReviewCard"
import { ReviewSummaryCard } from "@/components/reviews/ReviewSummaryCard"
import { WriteReviewDialog } from "@/components/reviews/WriteReviewDialog"
import { toast } from "@/components/ui/toast"
import type {
  CourseReviewData,
  ProfessorReviewData,
  ReviewAggregates,
  ProfessorData,
} from "@/lib/types"

interface CompletedCourseOption {
  courseId: string
  code: string
  title: string
  term: string
}

interface CourseReviewsSectionProps {
  courseId: string
  studentId: string | null
  isCompleted: boolean
  hasReviewed: boolean
  initialCourseReviews: CourseReviewData[]
  initialAggregates: ReviewAggregates
  initialProfessors: Array<{ id: string; name: string; department: string }>
  completedCourses: CompletedCourseOption[]
}

export function CourseReviewsSection({
  courseId,
  studentId,
  isCompleted,
  hasReviewed,
  initialCourseReviews,
  initialAggregates,
  initialProfessors,
  completedCourses,
}: CourseReviewsSectionProps) {
  const [activeTab, setActiveTab] = useState<"courses" | "professors">("courses")
  const [courseReviews, setCourseReviews] = useState(initialCourseReviews)
  const [professorReviews, setProfessorReviews] = useState<ProfessorReviewData[]>([])
  const [profLoading, setProfLoading] = useState(true)

  // Compute aggregates client-side so they update after mutations
  const aggregates = useMemo<ReviewAggregates>(() => {
    if (courseReviews.length === 0) {
      return { averageRating: 0, averageDifficulty: 0, averageWorkload: 0, totalReviews: 0 }
    }
    return {
      averageRating: courseReviews.reduce((s, r) => s + r.rating, 0) / courseReviews.length,
      averageDifficulty: courseReviews.reduce((s, r) => s + r.difficultyRating, 0) / courseReviews.length,
      averageWorkload: courseReviews.reduce((s, r) => s + r.workloadRating, 0) / courseReviews.length,
      totalReviews: courseReviews.length,
    }
  }, [courseReviews])

  // Build professor data for WriteReviewDialog
  const professors = useMemo<ProfessorData[]>(
    () =>
      initialProfessors.map((p) => ({
        ...p,
        courses: [], // professors are already scoped to this course
      })),
    [initialProfessors]
  )

  const reviewedCourseIds = useMemo(
    () => new Set(courseReviews.filter((r) => r.isOwn).map((r) => r.course.id)),
    [courseReviews]
  )

  const reviewedProfessorIds = useMemo(
    () => new Set(professorReviews.filter((r) => r.isOwn).map((r) => r.professor.id)),
    [professorReviews]
  )

  const fetchCourseReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/courses?courseId=${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourseReviews(data.reviews || [])
      }
    } catch {
      // keep existing data
    }
  }, [courseId])

  const fetchProfessorReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/professors?courseId=${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setProfessorReviews(data.reviews || [])
      }
    } catch {
      // keep existing data
    } finally {
      setProfLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchProfessorReviews()
  }, [fetchProfessorReviews])

  const handleRefresh = () => {
    fetchCourseReviews()
    fetchProfessorReviews()
  }

  const handleDeleteCourseReview = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/courses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Review deleted")
      fetchCourseReviews()
    } catch {
      toast.error("Failed to delete review")
    }
  }

  const handleDeleteProfessorReview = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/professors/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Review deleted")
      fetchProfessorReviews()
    } catch {
      toast.error("Failed to delete review")
    }
  }

  const canWriteReview = isCompleted && studentId

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
          Reviews
        </h2>
        {canWriteReview && (
          <WriteReviewDialog
            completedCourses={completedCourses}
            professors={professors}
            reviewedCourseIds={reviewedCourseIds}
            reviewedProfessorIds={reviewedProfessorIds}
            onSuccess={handleRefresh}
            defaultMode="course"
            defaultCourseId={courseId}
          />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border">
        <button
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-2 text-xs uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "courses"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Course Reviews ({courseReviews.length})
        </button>
        <button
          onClick={() => setActiveTab("professors")}
          className={`px-4 py-2 text-xs uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "professors"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Professor Reviews ({profLoading ? "..." : professorReviews.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "courses" ? (
        <div className="space-y-4">
          {aggregates.totalReviews > 0 && <ReviewSummaryCard aggregates={aggregates} />}

          {courseReviews.length === 0 ? (
            <div className="border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No course reviews yet.{" "}
                {canWriteReview && !hasReviewed && "Be the first to write one!"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {courseReviews.map((review) => (
                <CourseReviewCard
                  key={review.id}
                  review={review}
                  onDelete={review.isOwn ? handleDeleteCourseReview : undefined}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {profLoading ? (
            <div className="border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Loading professor reviews...</p>
            </div>
          ) : professorReviews.length === 0 ? (
            <div className="border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No professor reviews yet for this course&apos;s instructors.
                {canWriteReview && " Be the first to write one!"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {professorReviews.map((review) => (
                <ProfessorReviewCard
                  key={review.id}
                  review={review}
                  onDelete={review.isOwn ? handleDeleteProfessorReview : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
