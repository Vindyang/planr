"use client"

import { IconEdit, IconTrash } from "@tabler/icons-react"
import { StarRating } from "./StarRating"
import { RatingBadge } from "./RatingBadge"
import type { CourseReviewData } from "@/lib/types"

interface CourseReviewCardProps {
  review: CourseReviewData
  onEdit?: (review: CourseReviewData) => void
  onDelete?: (id: string) => void
}

export function CourseReviewCard({ review, onEdit, onDelete }: CourseReviewCardProps) {
  const date = new Date(review.createdAt)

  return (
    <div className="border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              {review.course.code}
            </span>
            <span className="text-xs text-muted-foreground">
              {review.term}
            </span>
          </div>
          <h3 className="font-serif text-base font-medium">{review.course.title}</h3>
        </div>

        {review.isOwn && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="p-1.5 hover:bg-muted transition-colors"
              >
                <IconEdit size={14} className="text-muted-foreground" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(review.id)}
                className="p-1.5 hover:bg-muted transition-colors"
              >
                <IconTrash size={14} className="text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <StarRating value={review.rating} readonly />
        <div className="flex gap-2">
          <RatingBadge label="Difficulty" value={review.difficultyRating} />
          <RatingBadge label="Workload" value={review.workloadRating} />
        </div>
      </div>

      <p className="text-sm text-foreground leading-relaxed">{review.content}</p>

      <div className="flex items-center justify-between border-t border-muted pt-3">
        <span className="text-xs text-muted-foreground italic">
          {review.studentName ?? "Anonymous"}
        </span>
        <span className="text-xs text-muted-foreground">
          {date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  )
}
