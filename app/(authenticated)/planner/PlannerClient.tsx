"use client"

import { useState, useTransition, useOptimistic } from "react"
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

type OptimisticAction =
  | { type: 'REMOVE_COURSE'; courseId: string }
  | { type: 'DELETE_PLAN'; planId: string }
  | { type: 'ADD_COURSE'; planId: string; course: any }
  | { type: 'ADD_COURSES'; planId: string; courses: any[] }
  | { type: 'MOVE_COURSE'; courseId: string; targetPlanId: string }

export default function PlannerClient({ initialData, allCourses, completedUnits = 0, initialValidation }: PlannerClientProps) {
  const [, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)

  // Optimistic state management with useOptimistic
  const [optimisticData, addOptimisticUpdate] = useOptimistic(
    initialData,
    (state: any, action: OptimisticAction) => {
      switch (action.type) {
        case 'REMOVE_COURSE':
          return {
            ...state,
            semesterPlans: state.semesterPlans.map((plan: any) => ({
              ...plan,
              plannedCourses: plan.plannedCourses.filter(
                (pc: any) => pc.id !== action.courseId
              ),
            })),
          }

        case 'DELETE_PLAN':
          return {
            ...state,
            semesterPlans: state.semesterPlans.filter(
              (plan: any) => plan.id !== action.planId
            ),
          }

        case 'ADD_COURSE':
          return {
            ...state,
            semesterPlans: state.semesterPlans.map((plan: any) =>
              plan.id === action.planId
                ? {
                    ...plan,
                    plannedCourses: [
                      ...plan.plannedCourses,
                      {
                        id: `temp-${Date.now()}`,
                        course: action.course,
                        semesterPlanId: action.planId,
                      },
                    ],
                  }
                : plan
            ),
          }

        case 'ADD_COURSES':
          return {
            ...state,
            semesterPlans: state.semesterPlans.map((plan: any) =>
              plan.id === action.planId
                ? {
                    ...plan,
                    plannedCourses: [
                      ...plan.plannedCourses,
                      ...action.courses.map((course, index) => ({
                        id: `temp-${Date.now()}-${index}`,
                        course: course,
                        semesterPlanId: action.planId,
                      })),
                    ],
                  }
                : plan
            ),
          }

        case 'MOVE_COURSE':
          const courseToMove = state.semesterPlans
            .flatMap((p: any) => p.plannedCourses)
            .find((pc: any) => pc.id === action.courseId)

          if (!courseToMove) return state

          return {
            ...state,
            semesterPlans: state.semesterPlans.map((plan: any) => ({
              ...plan,
              plannedCourses:
                plan.id === action.targetPlanId
                  ? [...plan.plannedCourses, courseToMove]
                  : plan.plannedCourses.filter(
                      (pc: any) => pc.id !== action.courseId
                    ),
            })),
          }

        default:
          return state
      }
    }
  )

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
                // Dragging from drawer - optimistically add to UI
                const courseId = activeData.courseId
                const course = allCourses.find(c => c.id === courseId)

                if (course) {
                  // Optimistically add the course
                  addOptimisticUpdate({ type: 'ADD_COURSE', planId: overId, course })
                }

                await addCourseToPlan(overId, courseId)
            } else if (activeData?.type === "course") {
                // Moving existing course - optimistically update
                addOptimisticUpdate({
                  type: 'MOVE_COURSE',
                  courseId: active.id as string,
                  targetPlanId: overId
                })

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
      // Close the dialog immediately
      setCourseToRemove(null)

      // Optimistically update the UI (auto-reverts on error)
      startTransition(async () => {
        addOptimisticUpdate({ type: 'REMOVE_COURSE', courseId: courseToRemove })

        try {
          await removeCourseFromPlan(courseToRemove)
        } catch (error) {
          toast.error("Failed to remove course", {
            description: (error as Error).message,
          })
        }
      })
    }
  }

  const confirmDeletePlan = () => {
    if (planToDelete) {
      // Close the dialog immediately
      setPlanToDelete(null)

      // Optimistically update the UI (auto-reverts on error)
      startTransition(async () => {
        addOptimisticUpdate({ type: 'DELETE_PLAN', planId: planToDelete })

        try {
          await deleteSemesterPlan(planToDelete)
        } catch (error) {
          toast.error("Failed to delete semester", {
            description: (error as Error).message,
          })
        }
      })
    }
  }

  const handleCreatePlan = async (term: string, year: number) => {
     // Check if year already has 4 terms
     const yearPlans = optimisticData.semesterPlans.filter((p: any) => p.year === year)
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
      // Find the course data for optimistic update
      const course = allCourses.find(c => c.id === courseId)

      if (course) {
        // Optimistically add the course (auto-reverts on error)
        addOptimisticUpdate({ type: 'ADD_COURSE', planId, course })
      }

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
      // Find the course data for optimistic update
      const courses = courseIds
        .map(id => allCourses.find(c => c.id === id))
        .filter(Boolean) // Remove any undefined values

      if (courses.length > 0) {
        // Optimistically add all courses (auto-reverts on error)
        addOptimisticUpdate({ type: 'ADD_COURSES', planId, courses })
      }

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
              semesterPlans: optimisticData.semesterPlans,
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
