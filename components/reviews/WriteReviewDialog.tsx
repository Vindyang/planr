"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "./StarRating"
import type { ProfessorData } from "@/lib/types"

interface CompletedCourseOption {
  courseId: string
  code: string
  title: string
  term: string
}

interface WriteReviewDialogProps {
  completedCourses: CompletedCourseOption[]
  professors: ProfessorData[]
  reviewedCourseIds: Set<string>
  reviewedProfessorIds: Set<string>
  onSuccess: () => void
  children?: React.ReactNode
  defaultMode?: "course" | "professor"
  defaultCourseId?: string
}

export function WriteReviewDialog({
  completedCourses,
  professors,
  reviewedCourseIds,
  reviewedProfessorIds,
  onSuccess,
  children,
  defaultMode = "course",
  defaultCourseId,
}: WriteReviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"course" | "professor">(defaultMode)
  const [selectedCourseId, setSelectedCourseId] = useState(defaultCourseId || "")
  const [selectedProfessorId, setSelectedProfessorId] = useState("")
  const [profCourseId, setProfCourseId] = useState("")
  const [rating, setRating] = useState(0)
  const [difficultyRating, setDifficultyRating] = useState(0)
  const [workloadRating, setWorkloadRating] = useState(0)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  const availableCourses = completedCourses.filter((c) => !reviewedCourseIds.has(c.courseId))
  const availableProfessors = professors.filter((p) => !reviewedProfessorIds.has(p.id))

  const resetForm = () => {
    setSelectedCourseId(defaultCourseId || "")
    setSelectedProfessorId("")
    setProfCourseId("")
    setRating(0)
    setDifficultyRating(0)
    setWorkloadRating(0)
    setContent("")
  }

  const handleSubmit = async () => {
    if (rating === 0 || difficultyRating === 0 || workloadRating === 0) {
      toast.error("Please fill in all ratings")
      return
    }
    if (content.length < 10) {
      toast.error("Review must be at least 10 characters")
      return
    }

    try {
      setLoading(true)

      if (mode === "course") {
        if (!selectedCourseId) {
          toast.error("Please select a course")
          return
        }

        const response = await fetch("/api/reviews/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: selectedCourseId,
            rating,
            difficultyRating,
            workloadRating,
            content,
            isAnonymous: true,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }
      } else {
        if (!selectedProfessorId) {
          toast.error("Please select a professor")
          return
        }

        const response = await fetch("/api/reviews/professors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            professorId: selectedProfessorId,
            courseId: profCourseId || undefined,
            rating,
            difficultyRating,
            workloadRating,
            content,
            isAnonymous: true,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }
      }

      toast.success("Review submitted successfully")
      resetForm()
      setOpen(false)
      onSuccess()
    } catch (error) {
      toast.error("Failed to submit review", {
        description: (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetForm(); setMode(defaultMode) } }}>
      <DialogTrigger asChild>
        {children || (
          <Button className="text-xs uppercase tracking-wider">
            + Write Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience anonymously
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Mode tabs */}
          <div className="flex gap-0 border-b border-border">
            <button
              type="button"
              onClick={() => { setMode("course"); resetForm() }}
              className={`px-4 py-2 text-xs uppercase tracking-wider border-b-2 transition-colors ${
                mode === "course"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Course
            </button>
            <button
              type="button"
              onClick={() => { setMode("professor"); resetForm() }}
              className={`px-4 py-2 text-xs uppercase tracking-wider border-b-2 transition-colors ${
                mode === "professor"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Professor
            </button>
          </div>

          {/* Selection */}
          {mode === "course" ? (
            <div className="space-y-2">
              <Label>Course</Label>
              {availableCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No completed courses available to review.
                </p>
              ) : (
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a completed course" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((c) => (
                      <SelectItem key={c.courseId} value={c.courseId}>
                        {c.code} - {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Professor</Label>
                {availableProfessors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No professors available to review.
                  </p>
                ) : (
                  <Select value={selectedProfessorId} onValueChange={setSelectedProfessorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a professor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProfessors.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Course context (optional)</Label>
                <Select value={profCourseId} onValueChange={setProfCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedCourses.map((c) => (
                      <SelectItem key={c.courseId} value={c.courseId}>
                        {c.code} - {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Ratings */}
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Overall Rating</Label>
              <StarRating value={rating} onChange={setRating} size={20} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <StarRating value={difficultyRating} onChange={setDifficultyRating} size={18} />
              </div>
              <div className="space-y-1.5">
                <Label>Workload</Label>
                <StarRating value={workloadRating} onChange={setWorkloadRating} size={18} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Your Review</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {content.length}/2000 characters (min 10)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (mode === "course" ? !selectedCourseId : !selectedProfessorId)}
          >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
