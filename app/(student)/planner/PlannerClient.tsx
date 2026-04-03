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
import { markChecklistItem } from "@/components/tutorial/checklistTracking"
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
import { AIRecommendationModal } from "@/components/planner/ai-recommendation-modal"

type PlannerClientProps = {
  initialData: PlannerState
  allCourses: AvailableCourse[]
  completedUnits?: number
  currentGpa?: number | null
  initialValidation: ValidationResult
  requiredUnits?: number
  majorName?: string | null
}

type AvailableCourse = {
  id: string
  code: string
  title: string
  units: number
}

type PlannedCourse = {
  id: string
  course: AvailableCourse
  semesterPlanId: string
  courseId?: string
  status?: string
  addedAt?: Date
}

type SemesterPlan = {
  id: string
  term: string
  year: number
  plannedCourses: PlannedCourse[]
  createdAt?: Date
  updatedAt?: Date
}

type PlannerState = {
  semesterPlans: SemesterPlan[]
} & Record<string, unknown>

type OptimisticAction =
  | { type: 'REMOVE_COURSE'; courseId: string }
  | { type: 'REMOVE_COURSES'; courseIds: string[] }
  | { type: 'ADD_COURSE'; planId: string; course: AvailableCourse }
  | { type: 'ADD_COURSES'; planId: string; courses: AvailableCourse[] }
  | { type: 'MOVE_COURSE'; courseId: string; targetPlanId: string }

export default function PlannerClient({
  initialData,
  allCourses,
  completedUnits = 0,
  currentGpa,
  initialValidation,
  requiredUnits = 120,
  majorName,
}: PlannerClientProps) {
  const [, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())

  // AI modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)


  // Optimistic state management with useOptimistic
  const [optimisticData] = useOptimistic(
    initialData,
    (state: PlannerState, action: OptimisticAction) => {
      switch (action.type) {
        case 'REMOVE_COURSE':
          return {
            ...state,
            semesterPlans: state.semesterPlans.map((plan) => ({
              ...plan,
              plannedCourses: plan.plannedCourses.filter(
                (pc) => pc.id !== action.courseId
              ),
            })),
          }

        case 'REMOVE_COURSES':
          return {
            ...state,
            semesterPlans: state.semesterPlans.map((plan) => ({
              ...plan,
              plannedCourses: plan.plannedCourses.filter(
                (pc) => !action.courseIds.includes(pc.id)
              ),
            })),
          }

        case 'ADD_COURSE':
          return {
            ...state,
            semesterPlans: state.semesterPlans.map((plan) =>
              plan.id === action.planId
                ? {
                    ...plan,
                    plannedCourses: [
                      ...plan.plannedCourses,
                      {
                        id: `temp-${Date.now()}`,
                        course: action.course,
                        semesterPlanId: action.planId,
                        courseId: action.course.id,
                        status: "PLANNED",
                        addedAt: new Date(),
                      },
                    ],
                  }
                : plan
            ),
          }

        case 'ADD_COURSES':
          return {
            ...state,
            semesterPlans: state.semesterPlans.map((plan) =>
              plan.id === action.planId
                ? {
                    ...plan,
                    plannedCourses: [
                      ...plan.plannedCourses,
                      ...action.courses.map((course, index) => ({
                        id: `temp-${Date.now()}-${index}`,
                        course,
                        semesterPlanId: action.planId,
                        courseId: course.id,
                        status: "PLANNED",
                        addedAt: new Date(),
                      })),
                    ],
                  }
                : plan
            ),
          }

        case 'MOVE_COURSE':
          const courseToMove = state.semesterPlans
            .flatMap((p) => p.plannedCourses)
            .find((pc) => pc.id === action.courseId)

          if (!courseToMove) return state

          return {
            ...state,
            semesterPlans: state.semesterPlans.map((plan) => ({
              ...plan,
              plannedCourses:
                plan.id === action.targetPlanId
                  ? [...plan.plannedCourses, courseToMove]
                  : plan.plannedCourses.filter(
                      (pc) => pc.id !== action.courseId
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

    const activeData = active.data.current as
      | { type?: "new-course" | "course"; courseId?: string }
      | undefined
    const overId = over.id as string // This is the planId (droppable)

    startTransition(async () => {
        try {
            if (activeData?.type === "new-course") {
                // Dragging from drawer - optimistically add to UI
                const courseId = activeData.courseId
                if (!courseId) return

                const course = allCourses.find(c => c.id === courseId)

                toast.promise(
                  addCourseToPlan(overId, courseId).then(() => {
                    markChecklistItem("ADDED_COURSE")
                  }),
                  {
                    loading: "Adding course...",
                    success: "Course added",
                    error: (err) => `Failed to add course: ${(err as Error).message}`
                  }
                )
            } else if (activeData?.type === "course") {
                // Find the current term plan for this course
                const currentPlan = optimisticData.semesterPlans.find((plan) =>
                  plan.plannedCourses.some((pc) => pc.id === active.id)
                )

                // If dropping into the same term, ignore the action
                if (currentPlan?.id === overId) {
                  return
                }

                // Moving existing course
                toast.promise(
                  moveCourse(active.id as string, overId),
                  {
                    loading: "Moving course...",
                    success: "Course moved",
                    error: (err) => `Failed to move course: ${err.message}`
                  }
                )
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
      .flatMap((plan) =>
        plan.plannedCourses.map((pc) => ({
          ...pc,
          semesterPlanId: plan.id
        }))
      )
      .find((pc) => pc.id === courseId)

    if (!courseToRemove) return

    const { semesterPlanId, course } = courseToRemove

    // Remove course immediately
    startTransition(() => {
      toast.promise(
        removeCourseFromPlan(courseId),
        {
          loading: "Removing course...",
          success: () => "Course removed",
          error: (err) => `Failed to remove course: ${err.message}`
        }
      )
    })
  }

  const confirmDeletePlan = () => {
    if (planToDelete) {
      // Close the dialog immediately
      setPlanToDelete(null)

      startTransition(async () => {
        try {
          await deleteSemesterPlan(planToDelete)
          toast.success("Term deleted", {
            description: "Successfully deleted term and all its courses",
          })
        } catch (error) {
          toast.error("Failed to delete term", {
            description: (error as Error).message,
          })
        }
      })
    }
  }

  const handleCreatePlan = async (term: string, year: number) => {
     // Check if year already has 4 terms
     const yearPlans = optimisticData.semesterPlans.filter((p) => p.year === year)
     if (yearPlans.length >= 4) {
         toast.error("Year Limit Reached", {
             description: `Academic year ${year} already has the maximum of 4 terms.`
         })
         return
     }

     startTransition(async () => {
         try {
             await createSemesterPlan(term, year)
             markChecklistItem("CREATED_TERM")
             toast.success("Term created", {
               description: `Successfully created ${term} ${year}`,
             })
         } catch (e) {
             toast.error("Failed to create term", {
                 description: (e as Error).message
             })
         }
     })
  }


  const handleAddCourse = async (planId: string, courseId: string) => {
    startTransition(() => {
      toast.promise(
        addCourseToPlan(planId, courseId).then(() => {
          markChecklistItem("ADDED_COURSE")
        }),
        {
          loading: "Adding course...",
          success: "Course added",
          error: (err) => `Failed to add course: ${(err as Error).message}`
        }
      )
    })
  }

  const handleAddCourses = async (planId: string, courseIds: string[]) => {
    startTransition(() => {
      toast.promise(
        addCoursesToPlan(planId, courseIds),
        {
          loading: "Adding courses...",
          success: `${courseIds.length} course${courseIds.length > 1 ? 's' : ''} added`,
          error: (err) => `Failed to add courses: ${(err as Error).message}`
        }
      )
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
      .flatMap((plan) =>
        plan.plannedCourses
          .filter((pc) => courseIds.includes(pc.id))
          .map((pc) => ({
            plannedCourseId: pc.id,
            courseId: pc.course.id,
            semesterPlanId: plan.id,
            course: pc.course
          }))
      )

    // Clear selection and exit selection mode immediately
    setSelectedCourses(new Set())
    setIsSelectionMode(false)

    // Update the UI
    startTransition(() => {
      toast.promise(
        removeCoursesFromPlan(courseIds),
        {
          loading: "Removing courses...",
          success: `Successfully removed ${courseIds.length} course${courseIds.length > 1 ? 's' : ''}`,
          error: (err) => `Failed to remove courses: ${err.message}`
        }
      )
    })
  }

  const handleCancelSelection = () => {
    setIsSelectionMode(false)
    setSelectedCourses(new Set())
  }

  return (
    <>
      <DndContext
        id="planner-dnd-context"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <PlannerBoard
          data={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              semesterPlans: optimisticData.semesterPlans as any,
              availableCourses: allCourses
          }}
          activeId={activeId}
          onRemoveCourse={handleRemoveCourse}
          onDeletePlan={setPlanToDelete}
          onCreatePlan={handleCreatePlan}
          onAddCourse={handleAddCourse}
          onAddCourses={handleAddCourses}
          completedUnits={completedUnits}
          currentGpa={currentGpa}
          initialValidation={initialValidation}
          requiredUnits={requiredUnits}
          isSelectionMode={isSelectionMode}
          selectedCourses={selectedCourses}
          onToggleSelection={handleToggleSelection}
          onToggleSelectionMode={() => setIsSelectionMode(!isSelectionMode)}
          onBulkDelete={handleBulkDelete}
          onCancelSelection={handleCancelSelection}
          onOpenAIModal={() => setIsAIModalOpen(true)}
        />
      </DndContext>

      {/* Delete Plan Dialog */}
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Term Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this term plan? All courses in it will be removed.
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

      {/* AI Recommendation Modal */}
      <AIRecommendationModal
        open={isAIModalOpen}
        onOpenChange={setIsAIModalOpen}
        majorName={majorName}
      />
    </>
  )
}
