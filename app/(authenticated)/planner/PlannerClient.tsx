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
import { addCourseToPlan, moveCourse, removeCourseFromPlan, deleteSemesterPlan, createSemesterPlan } from "@/lib/planner/actions"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/toast"
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
}

export default function PlannerClient({ initialData, allCourses, completedUnits = 0 }: PlannerClientProps) {
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
     startTransition(async () => {
         try {
             await createSemesterPlan(term, year)
         } catch (e) {
             alert((e as Error).message)
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
          completedUnits={completedUnits}
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
