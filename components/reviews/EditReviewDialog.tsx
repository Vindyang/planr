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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "./StarRating"
import type { CourseReviewData, ProfessorReviewData } from "@/lib/types"

interface EditReviewDialogProps {
  review: CourseReviewData | ProfessorReviewData
  type: "course" | "professor"
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditReviewDialog({
  review,
  type,
  open,
  onOpenChange,
  onSuccess,
}: EditReviewDialogProps) {
  const [rating, setRating] = useState(review.rating)
  const [difficultyRating, setDifficultyRating] = useState(review.difficultyRating)
  const [workloadRating, setWorkloadRating] = useState(review.workloadRating)
  const [content, setContent] = useState(review.content)
  const [loading, setLoading] = useState(false)

  const label =
    type === "course"
      ? `${(review as CourseReviewData).course.code} - ${(review as CourseReviewData).course.title}`
      : `${(review as ProfessorReviewData).professor.name} (${(review as ProfessorReviewData).professor.department.name})`

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
      const endpoint =
        type === "course"
          ? `/api/reviews/courses/${review.id}`
          : `/api/reviews/professors/${review.id}`

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, difficultyRating, workloadRating, content }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success("Review updated")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error("Failed to update review", {
        description: (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Review</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
