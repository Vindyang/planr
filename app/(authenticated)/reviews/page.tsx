"use client"

import { Suspense, useEffect, useState, useMemo } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"
import { CourseReviewCard } from "@/components/reviews/CourseReviewCard"
import { ProfessorReviewCard } from "@/components/reviews/ProfessorReviewCard"
import { WriteReviewDialog } from "@/components/reviews/WriteReviewDialog"
import { toast } from "@/components/ui/toast"
import type { CourseReviewData, ProfessorReviewData, ProfessorData } from "@/lib/types"

interface CompletedCourseOption {
  courseId: string
  code: string
  title: string
  term: string
}

function ReviewsContent() {
  const [activeTab, setActiveTab] = useState<"courses" | "professors">("courses")
  const [courseReviews, setCourseReviews] = useState<CourseReviewData[]>([])
  const [professorReviews, setProfessorReviews] = useState<ProfessorReviewData[]>([])
  const [completedCourses, setCompletedCourses] = useState<CompletedCourseOption[]>([])
  const [professors, setProfessors] = useState<ProfessorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "rating">("recent")

  const fetchData = async () => {
    try {
      const [courseRes, profRes, profileRes, professorsRes] = await Promise.all([
        fetch("/api/reviews/courses"),
        fetch("/api/reviews/professors"),
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
        const courses = (data.student?.completedCourses || []).map(
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
    () => new Set(courseReviews.filter((r) => r.isOwn).map((r) => r.course.id)),
    [courseReviews]
  )

  const reviewedProfessorIds = useMemo(
    () => new Set(professorReviews.filter((r) => r.isOwn).map((r) => r.professor.id)),
    [professorReviews]
  )

  const filteredCourseReviews = useMemo(() => {
    let filtered = courseReviews
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.course.code.toLowerCase().includes(q) ||
          r.course.title.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q)
      )
    }
    if (sortBy === "rating") {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating)
    }
    return filtered
  }, [courseReviews, search, sortBy])

  const filteredProfessorReviews = useMemo(() => {
    let filtered = professorReviews
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.professor.name.toLowerCase().includes(q) ||
          r.professor.department.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q)
      )
    }
    if (sortBy === "rating") {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating)
    }
    return filtered
  }, [professorReviews, search, sortBy])

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

  const totalReviews =
    activeTab === "courses" ? filteredCourseReviews.length : filteredProfessorReviews.length

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading reviews...</p>
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
              Reviews
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
            Course Reviews
          </button>
          <button
            onClick={() => setActiveTab("professors")}
            className={`px-6 py-3 text-xs uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "professors"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Professor Reviews
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={
                activeTab === "courses"
                  ? "Search by course code, title, or content..."
                  : "Search by professor name, department, or content..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("recent")}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                sortBy === "recent"
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              }`}
            >
              Most Recent
            </button>
            <button
              onClick={() => setSortBy("rating")}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                sortBy === "rating"
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              }`}
            >
              Highest Rated
            </button>
          </div>
        </div>

        {/* Review list */}
        {activeTab === "courses" ? (
          filteredCourseReviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No course reviews yet. Be the first to write one!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredCourseReviews.map((review) => (
                <CourseReviewCard
                  key={review.id}
                  review={review}
                  onDelete={review.isOwn ? handleDeleteCourseReview : undefined}
                />
              ))}
            </div>
          )
        ) : filteredProfessorReviews.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No professor reviews yet. Be the first to write one!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredProfessorReviews.map((review) => (
              <ProfessorReviewCard
                key={review.id}
                review={review}
                onDelete={review.isOwn ? handleDeleteProfessorReview : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function ReviewsPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading reviews...</p>
          </div>
        </AppLayout>
      }
    >
      <ReviewsContent />
    </Suspense>
  )
}
