"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addCourseToPlan } from "@/lib/planner/actions"
import { useRouter } from "next/navigation"
import { Prisma } from "@prisma/client"
import { toast } from "@/components/ui/toast"

type SemesterPlan = Prisma.semesterPlanGetPayload<{
  include: { plannedCourses: { include: { course: true } } }
}>

type Course = {
  id: string
  code: string
  title: string
}

type AddToPlanDialogProps = {
  course: Course
  semesters: SemesterPlan[]
  onClose: () => void
}

export function AddToPlanDialog({ course, semesters, onClose }: AddToPlanDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleAdd = async () => {
    if (!selectedPlanId) {
      setError("Please select a semester")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await addCourseToPlan(selectedPlanId, course.id)
      toast.success(`${course.code} added to plan`)
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to add course")
      toast.error("Failed to add course", {
        description: err.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {course.code} to Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="semester-select">Select Semester</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Choose semester..." />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((sem) => (
                  <SelectItem key={sem.id} value={sem.id}>
                    {sem.term} {sem.year} ({sem.plannedCourses.length} courses)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Course"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
