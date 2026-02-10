"use client"

import { IconCheck } from "@tabler/icons-react"

interface GraduationTrackerProps {
  totalUnits: number
  requiredUnits?: number
  completedUnits: number
  majorCourses?: number
  requiredMajorCourses?: number
}

export function GraduationTracker({
  totalUnits,
  requiredUnits = 120, // Default for most universities
  completedUnits,
  majorCourses = 0,
  requiredMajorCourses = 10,
}: GraduationTrackerProps) {
  const plannedUnits = totalUnits
  const totalWithCompleted = completedUnits + plannedUnits
  const remainingUnits = Math.max(0, requiredUnits - totalWithCompleted)
  const progressPercentage = Math.min(100, (totalWithCompleted / requiredUnits) * 100)

  const isOnTrack = totalWithCompleted >= requiredUnits

  return (
    <div className="bg-card border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider font-medium text-foreground">
          Graduation Progress
        </h3>
        {isOnTrack && (
          <div className="flex items-center gap-1.5 text-green-600">
            <IconCheck className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider font-medium">On Track</span>
          </div>
        )}
      </div>

      {/* Total Units Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Total Units
          </span>
          <span className="font-serif italic text-lg">
            {totalWithCompleted} / {requiredUnits}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Completed: {completedUnits}</span>
          <span>Planned: {plannedUnits}</span>
          <span>Remaining: {remainingUnits}</span>
        </div>
      </div>

      {/* Major Requirements */}
      {requiredMajorCourses > 0 && (
        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Major Courses
            </span>
            <span className="font-serif italic text-lg">
              {majorCourses} / {requiredMajorCourses}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-300"
              style={{
                width: `${Math.min(100, (majorCourses / requiredMajorCourses) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Semester Breakdown */}
      <div className="pt-4 border-t border-border space-y-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Plan Summary
        </span>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Average per semester</p>
            <p className="font-medium">{plannedUnits > 0 ? "~15 units" : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Semesters to complete</p>
            <p className="font-medium">
              {remainingUnits > 0 ? Math.ceil(remainingUnits / 15) : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {!isOnTrack && remainingUnits > 0 && (
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            You need {remainingUnits} more units to meet graduation requirements.
          </p>
        </div>
      )}

      {isOnTrack && (
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-green-600">
            ✓ Your plan meets the minimum graduation requirements!
          </p>
        </div>
      )}
    </div>
  )
}
