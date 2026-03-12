"use client"

import { Suspense, useEffect, useState, useMemo } from "react"
import { CourseReviewCard } from "@/components/reviews/CourseReviewCard"
import { ProfessorReviewCard } from "@/components/reviews/ProfessorReviewCard"
import { WriteReviewDialog } from "@/components/reviews/WriteReviewDialog"
import { EditReviewDialog } from "@/components/reviews/EditReviewDialog"
import { toast } from "@/components/ui/toast"
import type { CourseReviewData, ProfessorReviewData, ProfessorData } from "@/lib/types"
import { ReviewsPageSkeleton } from "./skeleton/ReviewsPageSkeleton"

interface CompletedCourseOption {
  courseId: string
  code: string
  title: string
  term: string
}

function MyReviewsContent() {
  const [activeTab, setActiveTab] = useState<"courses" | "professors">("courses")
  const [courseReviews, setCourseReviews] = useState<CourseReviewData[]>([])
  const [professorReviews, setProfessorReviews] = useState<ProfessorReviewData[]>([])
  const [completedCourses, setCompletedCourses] = useState<CompletedCourseOption[]>([])
  const [professors, setProfessors] = useState<ProfessorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingReview, setEditingReview] = useState<{
    review: CourseReviewData | ProfessorReviewData
    type: "course" | "professor"
  } | null>(null)

  const fetchData = async () => {
    try {
      const [courseRes, profRes, profileRes, professorsRes] = await Promise.all([
        fetch("/api/reviews/courses?mine=true"),
        fetch("/api/reviews/professors?mine=true"),
        fetch("/api/student/profile"),
        fetch("/api/professors"),
      ])

      if (courseRes.ok) {
        const data = await courseRes.json()
        setCourseReviews(data.reviews || [])
      }
      if (profRes.ok) {
        const data = await profRes.json()
        setProfessorReviews(data.reviews || [])
      }
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
      // handled by empty state
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
      if (!response.ok) throw new Error("Failed to delete")
      toast.success("Review deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete review")
    }
  }

  const handleDeleteProfessorReview = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/professors/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      toast.success("Review deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete review")
    }
  }

  const totalReviews = courseReviews.length + professorReviews.length

  if (isLoading) {
    return <ReviewsPageSkeleton />
  }

  return (
    <>
      <div className="flex flex-col space-y-8 bg-background min-h-screen -m-6 p-10 md:-m-8 md:p-12">
        <header className="flex justify-between items-end border-b border-border pb-8">
          <div>
            <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
              My Reviews
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-serif text-lg italic text-muted-foreground">
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </span>
            <WriteReviewDialog
              completedCourses={completedCourses}
              professors={professors}
              reviewedCourseIds={reviewedCourseIds}
              reviewedProfessorIds={reviewedProfessorIds}
              onSuccess={fetchData}
            />
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border">
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-6 py-3 text-xs uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "courses"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Course Reviews ({courseReviews.length})
          </button>
          <button
            onClick={() => setActiveTab("professors")}
            className={`px-6 py-3 text-xs uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "professors"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Professor Reviews ({professorReviews.length})
          </button>
        </div>

        {/* Review list */}
        {activeTab === "courses" ? (
          courseReviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>You haven&apos;t written any course reviews yet.</p>
            </div>
          ) : (
            <div className="grid gap-6">
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
          <div className="text-center py-16 text-muted-foreground">
            <p>You haven&apos;t written any professor reviews yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
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
      </div>

      {editingReview && (
        <EditReviewDialog
          review={editingReview.review}
          type={editingReview.type}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingReview(null)
          }}
          onSuccess={fetchData}
        />
      )}
    </>
  )
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<ReviewsPageSkeleton />}>
      <MyReviewsContent />
    </Suspense>
  )
}
