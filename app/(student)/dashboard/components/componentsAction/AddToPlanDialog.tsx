"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addCourseToPlan, createSemesterPlan } from "@/lib/planner/actions"
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return fallback
}

export function AddToPlanDialog({ course, semesters, onClose }: AddToPlanDialogProps) {
  // Helper functions for smart defaults
  const getDefaultTerm = () => {
    const month = new Date().getMonth() + 1
    if (month >= 1 && month <= 4) return "Term 2"
    if (month >= 5 && month <= 7) return "Term 3"
    return "Term 1"
  }

  const getDefaultYear = () => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    if (month >= 9) return year + 1
    return year
  }

  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState<"creating" | "selecting">(
    semesters.length === 0 ? "creating" : "selecting"
  )
  const [isCreatingSemester, setIsCreatingSemester] = useState(false)
  const [newSemesterTerm, setNewSemesterTerm] = useState(getDefaultTerm())
  const [newSemesterYear, setNewSemesterYear] = useState(getDefaultYear().toString())
  const router = useRouter()

  const handleCreateSemester = async () => {
    const yearNum = parseInt(newSemesterYear)

    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2040) {
      setError("Year must be between 2020 and 2040")
      return
    }

    setIsCreatingSemester(true)
    setError("")

    try {
      await createSemesterPlan(newSemesterTerm, yearNum)
      toast.success("Term created successfully. Please add the course again.")
      router.refresh()
      onClose()
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create term")

      if (message.includes("already exists")) {
        setError("This term already exists. Refreshing...")
        router.refresh()
        setTimeout(() => setViewMode("selecting"), 1000)
      } else if (message.includes("maximum of 4 terms")) {
        setError(message)
        setNewSemesterYear((parseInt(newSemesterYear) + 1).toString())
      } else {
        setError(message)
      }
    } finally {
      setIsCreatingSemester(false)
    }
  }

  const handleAdd = async () => {
    if (!selectedPlanId) {
      setError("Please select a term")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await addCourseToPlan(selectedPlanId, course.id)
      toast.success(`${course.code} added to plan`)
      router.refresh()
      onClose()
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to add course")
      setError(message)
      toast.error("Failed to add course", {
        description: message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {viewMode === "creating" ? "Create First Term" : `Add ${course.code} to Plan`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {viewMode === "creating" ? (
            <>
              <div className="rounded-lg border p-4 space-y-4 bg-muted/50">
                <div>
                  <h4 className="font-medium mb-2">Create Your First Term</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set up a term plan to start organizing your courses.
                  </p>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="term" className="text-right">
                    Term
                  </Label>
                  <Select value={newSemesterTerm} onValueChange={setNewSemesterTerm}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1 (Aug-Jan)</SelectItem>
                      <SelectItem value="Term 2">Term 2 (Jan-Apr)</SelectItem>
                      <SelectItem value="Term 3">Term 3 (May-Aug)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Year
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    min="2020"
                    max="2040"
                    value={newSemesterYear}
                    onChange={(e) => setNewSemesterYear(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <Button onClick={handleCreateSemester} disabled={isCreatingSemester}>
                  {isCreatingSemester ? "Creating..." : "Create Term"}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="term-select">Select Term</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Choose term..." />
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

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Course"}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
