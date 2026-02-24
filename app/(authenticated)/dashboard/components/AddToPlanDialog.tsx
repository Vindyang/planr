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

export function AddToPlanDialog({ course, semesters, onClose }: AddToPlanDialogProps) {
  // Helper functions for smart defaults
  const getDefaultTerm = () => {
    const month = new Date().getMonth() + 1
    if (month >= 1 && month <= 3) return "Spring"
    if (month >= 4 && month <= 6) return "Summer"
    if (month >= 7 && month <= 9) return "Fall"
    return "Winter"
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
      const newSemesterId = await createSemesterPlan(newSemesterTerm, yearNum)
      toast.success("Semester created successfully")

      // Switch to selecting mode with new semester pre-selected
      setSelectedPlanId(newSemesterId)
      setViewMode("selecting")
      router.refresh()
    } catch (err: any) {
      if (err.message?.includes("already exists")) {
        setError("This semester already exists. Refreshing...")
        router.refresh()
        setTimeout(() => setViewMode("selecting"), 1000)
      } else if (err.message?.includes("maximum of 4 terms")) {
        setError(err.message)
        setNewSemesterYear((parseInt(newSemesterYear) + 1).toString())
      } else {
        setError(err.message || "Failed to create semester")
      }
    } finally {
      setIsCreatingSemester(false)
    }
  }

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
          <DialogTitle>
            {viewMode === "creating" ? "Create First Semester" : `Add ${course.code} to Plan`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {viewMode === "creating" ? (
            <>
              <div className="rounded-lg border p-4 space-y-4 bg-muted/50">
                <div>
                  <h4 className="font-medium mb-2">Create Your First Semester</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set up a semester plan to start organizing your courses.
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
                      <SelectItem value="Spring">Spring</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                      <SelectItem value="Fall">Fall</SelectItem>
                      <SelectItem value="Winter">Winter</SelectItem>
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
                  {isCreatingSemester ? "Creating..." : "Create Semester"}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
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
