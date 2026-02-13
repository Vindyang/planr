"use client"

import { StarRating } from "./StarRating"
import type { ReviewAggregates } from "@/lib/types"

interface ReviewSummaryCardProps {
  aggregates: ReviewAggregates
}

export function ReviewSummaryCard({ aggregates }: ReviewSummaryCardProps) {
  if (aggregates.totalReviews === 0) {
    return (
      <div className="border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No reviews yet</p>
      </div>
    )
  }

  return (
    <div className="border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-serif italic">
            {aggregates.averageRating.toFixed(1)}
          </span>
          <div className="space-y-0.5">
            <StarRating value={Math.round(aggregates.averageRating)} readonly size={14} />
            <p className="text-xs text-muted-foreground">
              {aggregates.totalReviews} {aggregates.totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-muted pt-4">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Difficulty
          </span>
          <p className="text-lg font-serif italic">
            {aggregates.averageDifficulty.toFixed(1)}/5
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Workload
          </span>
          <p className="text-lg font-serif italic">
            {aggregates.averageWorkload.toFixed(1)}/5
          </p>
        </div>
      </div>
    </div>
  )
}
