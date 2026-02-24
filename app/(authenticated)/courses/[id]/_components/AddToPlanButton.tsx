"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AddToPlanDialog } from "@/app/(authenticated)/dashboard/components/AddToPlanDialog"
import { Prisma } from "@prisma/client"

type SemesterPlan = Prisma.semesterPlanGetPayload<{
  include: { plannedCourses: { include: { course: true } } }
}>

type AddToPlanButtonProps = {
  course: {
    id: string
    code: string
    title: string
  }
  semesterPlans: SemesterPlan[]
  isEligible: boolean
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
}

export function AddToPlanButton({
  course,
  semesterPlans,
  isEligible,
  size = "default",
  variant = "default",
  className = "w-full"
}: AddToPlanButtonProps) {
  const [showDialog, setShowDialog] = useState(false)

  if (!isEligible) {
    return (
      <Button
        size={size}
        variant={variant}
        className={className}
        disabled
      >
        Prerequisites Required
      </Button>
    )
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => setShowDialog(true)}
      >
        Add to Plan
      </Button>

      {showDialog && (
        <AddToPlanDialog
          course={course}
          semesters={semesterPlans}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  )
}
