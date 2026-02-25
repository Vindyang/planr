"use client"

import { useState, useTransition } from "react"
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import { PlannerBoard } from "./components/PlannerBoard"
import { addCourseToPlan, addCoursesToPlan, moveCourse, removeCourseFromPlan, deleteSemesterPlan, createSemesterPlan } from "@/lib/planner/actions"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/toast"
import type { ValidationResult } from "@/lib/planner/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type PlannerClientProps = {
  initialData: any
  allCourses: any[]
  completedUnits?: number
  initialValidation: ValidationResult
}

export default function PlannerClient({ initialData, allCourses, completedUnits = 0, initialValidation }: PlannerClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  
  // Dialog States
  const [courseToRemove, setCourseToRemove] = useState<string | null>(null)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeData = active.data.current
    const overId = over.id as string // This is the planId (droppable)

    console.log("DROP", activeData, "ON", overId)

    startTransition(async () => {
        try {
            if (activeData?.type === "new-course") {
                // Dragging from drawer
                const courseId = activeData.courseId
                await addCourseToPlan(overId, courseId)
            } else if (activeData?.type === "course") {
                // Moving existing course
                await moveCourse(active.id as string, overId)
            }
        } catch (error) {
            console.error("Move failed", error)
            toast.error("Failed to move course", {
                description: (error as Error).message
            })
        }
    })
  }

  const confirmRemoveCourse = () => {
    if (courseToRemove) {
      startTransition(async () => {
        await removeCourseFromPlan(courseToRemove)
        setCourseToRemove(null)
      })
    }
  }

  const confirmDeletePlan = () => {
    if (planToDelete) {
      startTransition(async () => {
        await deleteSemesterPlan(planToDelete)
        setPlanToDelete(null)
      })
    }
  }

  const handleCreatePlan = async (term: string, year: number) => {
     // Check if year already has 4 terms
     const yearPlans = initialData.semesterPlans.filter((p: any) => p.year === year)
     if (yearPlans.length >= 4) {
         toast.error("Year Limit Reached", {
             description: `Academic year ${year} already has the maximum of 4 terms.`
         })
         return
     }

     startTransition(async () => {
         try {
             await createSemesterPlan(term, year)
         } catch (e) {
             toast.error("Failed to create semester", {
                 description: (e as Error).message
             })
         }
     })
  }


  const handleAddCourse = async (planId: string, courseId: string) => {
    startTransition(async () => {
      try {
        await addCourseToPlan(planId, courseId)
      } catch (e) {
        toast.error("Failed to add course", {
          description: (e as Error).message
        })
      }
    })
  }

  const handleAddCourses = async (planId: string, courseIds: string[]) => {
    startTransition(async () => {
      try {
        await addCoursesToPlan(planId, courseIds)
      } catch (e) {
        toast.error("Failed to add courses", {
          description: (e as Error).message
        })
      }
    })
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <PlannerBoard
          data={{
              semesterPlans: initialData.semesterPlans,
              availableCourses: allCourses
          }}
          activeId={activeId}
          onRemoveCourse={setCourseToRemove}
          onDeletePlan={setPlanToDelete}
          onCreatePlan={handleCreatePlan}
          onAddCourse={handleAddCourse}
          onAddCourses={handleAddCourses}
          completedUnits={completedUnits}
          initialValidation={initialValidation}
        />
      </DndContext>

      {/* Delete Course Dialog */}
      <AlertDialog open={!!courseToRemove} onOpenChange={(open) => !open && setCourseToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this course from your plan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Plan Dialog */}
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Semester Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this semester plan? All courses in it will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePlan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
