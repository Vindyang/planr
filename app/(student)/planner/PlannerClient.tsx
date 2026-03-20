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
import { addCourseToPlan, addCoursesToPlan, moveCourse, removeCourseFromPlan, removeCoursesFromPlan, deleteSemesterPlan, createSemesterPlan } from "@/lib/planner/actions"
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
  | { type: 'REMOVE_COURSES'; courseIds: string[] }
  | { type: 'DELETE_PLAN'; planId: string }
  | { type: 'ADD_COURSE'; planId: string; course: any }
  | { type: 'ADD_COURSES'; planId: string; courses: any[] }
  | { type: 'MOVE_COURSE'; courseId: string; targetPlanId: string }

export default function PlannerClient({ initialData, allCourses, completedUnits = 0, initialValidation }: PlannerClientProps) {
  const [, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())

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

        case 'REMOVE_COURSES':
          return {
            ...state,
            semesterPlans: state.semesterPlans.map((plan: any) => ({
              ...plan,
              plannedCourses: plan.plannedCourses.filter(
                (pc: any) => !action.courseIds.includes(pc.id)
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
                toast.success("Course added", {
                  description: "Successfully added course via drag & drop",
                })
            } else if (activeData?.type === "course") {
                // Find the current semester plan for this course
                const currentPlan = optimisticData.semesterPlans.find((plan: any) =>
                  plan.plannedCourses.some((pc: any) => pc.id === active.id)
                )

                // If dropping into the same semester, ignore the action
                if (currentPlan?.id === overId) {
                  return
                }

                // Moving existing course - optimistically update
                addOptimisticUpdate({
                  type: 'MOVE_COURSE',
                  courseId: active.id as string,
                  targetPlanId: overId
                })

                await moveCourse(active.id as string, overId)
                toast.success("Course moved", {
                  description: "Successfully moved course to another term",
                })
            }
        } catch (error) {
            console.error("Move failed", error)
            toast.error("Failed to move course", {
                description: (error as Error).message
            })
        }
    })
  }

  const handleRemoveCourse = (courseId: string) => {
    // Find the course data before deletion for potential undo
    const courseToRemove = optimisticData.semesterPlans
      .flatMap((plan: any) =>
        plan.plannedCourses.map((pc: any) => ({
          ...pc,
          semesterPlanId: plan.id
        }))
      )
      .find((pc: any) => pc.id === courseId)

    if (!courseToRemove) return

    const { semesterPlanId, course } = courseToRemove

    // Optimistically remove course immediately (no confirmation dialog)
    startTransition(async () => {
      addOptimisticUpdate({ type: 'REMOVE_COURSE', courseId })

      try {
        await removeCourseFromPlan(courseId)
        toast.success("Course removed", {
          description: "Successfully removed course from your plan",
          action: {
            label: "Undo",
            onClick: () => {
              startTransition(async () => {
                // Optimistically add the course back
                addOptimisticUpdate({ type: 'ADD_COURSE', planId: semesterPlanId, course })

                try {
                  await addCourseToPlan(semesterPlanId, course.id)
                  toast.success("Course restored", {
                    description: "Successfully restored the course",
                  })
                } catch (error) {
                  toast.error("Failed to restore course", {
                    description: (error as Error).message,
                  })
                }
              })
            }
          }
        })
      } catch (error) {
        toast.error("Failed to remove course", {
          description: (error as Error).message,
        })
      }
    })
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
          toast.success("Semester deleted", {
            description: "Successfully deleted semester and all its courses",
          })
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
             toast.success("Semester created", {
               description: `Successfully created ${term} ${year}`,
             })
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
        toast.success("Course added", {
          description: "Successfully added course to your plan",
        })
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
        toast.success("Courses added", {
          description: `Successfully added ${courseIds.length} course${courseIds.length > 1 ? 's' : ''} to your plan`,
        })
      } catch (e) {
        toast.error("Failed to add courses", {
          description: (e as Error).message
        })
      }
    })
  }

  const handleToggleSelection = (courseId: string) => {
    setSelectedCourses((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
      } else {
        newSet.add(courseId)
      }
      return newSet
    })
  }

  const handleBulkDelete = () => {
    if (selectedCourses.size === 0) return

    const courseIds = Array.from(selectedCourses)

    // Capture all courses data before deletion for potential undo
    const coursesToRemove = optimisticData.semesterPlans
      .flatMap((plan: any) =>
        plan.plannedCourses
          .filter((pc: any) => courseIds.includes(pc.id))
          .map((pc: any) => ({
            plannedCourseId: pc.id,
            courseId: pc.course.id,
            semesterPlanId: plan.id,
            course: pc.course
          }))
      )

    // Clear selection and exit selection mode immediately
    setSelectedCourses(new Set())
    setIsSelectionMode(false)

    // Optimistically update the UI (auto-reverts on error)
    startTransition(async () => {
      addOptimisticUpdate({ type: 'REMOVE_COURSES', courseIds })

      try {
        await removeCoursesFromPlan(courseIds)
        toast.success("Courses removed", {
          description: `Successfully removed ${courseIds.length} course${courseIds.length > 1 ? 's' : ''}`,
          action: {
            label: "Undo",
            onClick: () => {
              startTransition(async () => {
                // Group courses by semester plan for efficient restoration
                const coursesBySemester: Record<string, any[]> = coursesToRemove.reduce((acc: Record<string, any[]>, item: any) => {
                  if (!acc[item.semesterPlanId]) {
                    acc[item.semesterPlanId] = []
                  }
                  acc[item.semesterPlanId].push(item.course)
                  return acc
                }, {})

                // Optimistically add all courses back
                Object.entries(coursesBySemester).forEach(([planId, courses]) => {
                  addOptimisticUpdate({ type: 'ADD_COURSES', planId, courses: courses as any[] })
                })

                try {
                  // Restore courses to their original semesters
                  await Promise.all(
                    Object.entries(coursesBySemester).map(([planId, courses]) =>
                      addCoursesToPlan(planId, (courses as any[]).map((c: any) => c.id))
                    )
                  )

                  toast.success("Courses restored", {
                    description: `Successfully restored ${coursesToRemove.length} course${coursesToRemove.length > 1 ? 's' : ''}`,
                  })
                } catch (error) {
                  toast.error("Failed to restore courses", {
                    description: (error as Error).message,
                  })
                }
              })
            }
          }
        })
      } catch (error) {
        toast.error("Failed to remove courses", {
          description: (error as Error).message,
        })
      }
    })
  }

  const handleCancelSelection = () => {
    setIsSelectionMode(false)
    setSelectedCourses(new Set())
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
          onRemoveCourse={handleRemoveCourse}
          onDeletePlan={setPlanToDelete}
          onCreatePlan={handleCreatePlan}
          onAddCourse={handleAddCourse}
          onAddCourses={handleAddCourses}
          completedUnits={completedUnits}
          initialValidation={initialValidation}
          isSelectionMode={isSelectionMode}
          selectedCourses={selectedCourses}
          onToggleSelection={handleToggleSelection}
          onToggleSelectionMode={() => setIsSelectionMode(!isSelectionMode)}
          onBulkDelete={handleBulkDelete}
          onCancelSelection={handleCancelSelection}
        />
      </DndContext>

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
