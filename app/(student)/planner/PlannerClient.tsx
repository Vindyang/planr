"use client"

import { useEffect, useRef, useState, useTransition, useOptimistic } from "react"
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
  const [isMutating, setIsMutating] = useState(false)
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null)
  const createTermLockRef = useRef(false)
  const [pendingCreatedTerm, setPendingCreatedTerm] = useState<{ term: string; year: number } | null>(null)
  const [pendingDeletedPlanId, setPendingDeletedPlanId] = useState<string | null>(null)
  const [pendingAddedCourses, setPendingAddedCourses] = useState<{ planId: string; courseIds: string[] } | null>(null)
  const [pendingRemovedCourseIds, setPendingRemovedCourseIds] = useState<string[] | null>(null)

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

  // Keep term creation locked until the new term is visible in frontend state.
  useEffect(() => {
    if (!pendingCreatedTerm) return

    const createdTermVisible = optimisticData.semesterPlans.some(
      (plan) => plan.term === pendingCreatedTerm.term && plan.year === pendingCreatedTerm.year
    )

    if (createdTermVisible) {
      setPendingCreatedTerm(null)
      createTermLockRef.current = false
      setIsMutating(false)
    }
  }, [optimisticData.semesterPlans, pendingCreatedTerm])

  // Keep term deletion locked until the deleted term is removed from frontend state.
  useEffect(() => {
    if (!pendingDeletedPlanId) return

    const deletedTermGone = !optimisticData.semesterPlans.some(
      (plan) => plan.id === pendingDeletedPlanId
    )

    if (deletedTermGone) {
      setPendingDeletedPlanId(null)
      setDeletingPlanId(null)
      setIsMutating(false)
    }
  }, [optimisticData.semesterPlans, pendingDeletedPlanId])

  // Keep course additions locked until added courses are visible in the target term.
  useEffect(() => {
    if (!pendingAddedCourses) return

    const targetPlan = optimisticData.semesterPlans.find((plan) => plan.id === pendingAddedCourses.planId)
    if (!targetPlan) return

    const addedCoursesVisible = pendingAddedCourses.courseIds.every((courseId) =>
      targetPlan.plannedCourses.some((pc) => pc.course.id === courseId)
    )

    if (addedCoursesVisible) {
      setPendingAddedCourses(null)
      setIsMutating(false)
    }
  }, [optimisticData.semesterPlans, pendingAddedCourses])

  // Keep course removals locked until removed courses disappear from frontend state.
  useEffect(() => {
    if (!pendingRemovedCourseIds || pendingRemovedCourseIds.length === 0) return

    const remainingPlannedCourseIds = new Set(
      optimisticData.semesterPlans.flatMap((plan) => plan.plannedCourses.map((pc) => pc.id))
    )

    const allRemoved = pendingRemovedCourseIds.every((id) => !remainingPlannedCourseIds.has(id))
    if (allRemoved) {
      setPendingRemovedCourseIds(null)
      setDeletingCourseId(null)
      setIsMutating(false)
    }
  }, [optimisticData.semesterPlans, pendingRemovedCourseIds])

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

    if (!over || isMutating) return

    const activeData = active.data.current as
      | { type?: "new-course" | "course"; courseId?: string }
      | undefined
    const overId = over.id as string // This is the planId (droppable)

    startTransition(async () => {
        let waitForCourseSync = false
        try {
            setIsMutating(true)
            if (activeData?.type === "new-course") {
                // Dragging from drawer - optimistically add to UI
                const courseId = activeData.courseId
                if (!courseId) return

                let addSucceeded = false
                const addPromise = addCourseToPlan(overId, courseId).then(() => {
                  addSucceeded = true
                  waitForCourseSync = true
                  setPendingAddedCourses({ planId: overId, courseIds: [courseId] })
                  markChecklistItem("ADDED_COURSE")
                })
                toast.promise(addPromise, {
                  loading: "Adding course...",
                  success: "Course added",
                  error: (err) => `Failed to add course: ${(err as Error).message}`
                })
                try {
                  await addPromise
                } finally {
                  if (!addSucceeded) {
                    setIsMutating(false)
                  }
                }
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
                const movePromise = moveCourse(active.id as string, overId)
                toast.promise(movePromise, {
                  loading: "Moving course...",
                  success: "Course moved",
                  error: (err) => `Failed to move course: ${err.message}`
                })
                await movePromise
            }
        } catch (error) {
            console.error("Move failed", error)
            toast.error("Failed to move course", {
                description: (error as Error).message
            })
        } finally {
            // For add-course, unlock waits for frontend sync in effect above.
            // For move-course and failures, unlock immediately.
            if (!waitForCourseSync) {
              setIsMutating(false)
            }
        }
    })
  }

  const handleRemoveCourse = (courseId: string) => {
    if (isMutating) return

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

    // Show loading state immediately before request starts
    setIsMutating(true)
    setDeletingCourseId(courseId)
    let removeSucceeded = false
    const removePromise = removeCourseFromPlan(courseId)
    toast.promise(removePromise, {
      loading: "Removing course...",
      success: () => "Course removed",
      error: (err) => `Failed to remove course: ${err.message}`
    })
    void removePromise.then(() => {
      removeSucceeded = true
      setPendingRemovedCourseIds([courseId])
    }).finally(() => {
      if (!removeSucceeded) {
        setDeletingCourseId(null)
        setIsMutating(false)
      }
    })
  }

  const confirmDeletePlan = () => {
    if (planToDelete && !isMutating) {
      const targetPlanId = planToDelete
      // Close the dialog immediately
      setPlanToDelete(null)

      // Show loading state immediately before request starts
      setIsMutating(true)
      setDeletingPlanId(targetPlanId)
      let deleteSucceeded = false
      const deletePromise = deleteSemesterPlan(targetPlanId)
      void deletePromise
        .then(() => {
          deleteSucceeded = true
          setPendingDeletedPlanId(targetPlanId)
          toast.success("Term deleted", {
            description: "Successfully deleted term and all its courses",
          })
        })
        .catch((error) => {
          toast.error("Failed to delete term", {
            description: (error as Error).message,
          })
        })
        .finally(() => {
          if (!deleteSucceeded) {
            setDeletingPlanId(null)
            setIsMutating(false)
          }
        })
    }
  }

  const handleCreatePlan = async (term: string, year: number) => {
     if (isMutating || createTermLockRef.current || pendingCreatedTerm) return

     // Check if year already has 4 terms
     const yearPlans = optimisticData.semesterPlans.filter((p) => p.year === year)
     if (yearPlans.length >= 4) {
         toast.error("Year Limit Reached", {
             description: `Academic year ${year} already has the maximum of 4 terms.`
         })
         return
     }

     // Show loading state immediately before request starts
     createTermLockRef.current = true
     setIsMutating(true)
     let createSucceeded = false
     const createPromise = createSemesterPlan(term, year)
     void createPromise
       .then(() => {
         createSucceeded = true
         setPendingCreatedTerm({ term, year })
         markChecklistItem("CREATED_TERM")
         toast.success("Term created", {
           description: `Successfully created ${term} ${year}`,
         })
       })
       .catch((e) => {
         toast.error("Failed to create term", {
           description: (e as Error).message
         })
       })
       .finally(() => {
         if (!createSucceeded) {
           createTermLockRef.current = false
           setIsMutating(false)
         }
       })
  }


  const handleAddCourse = async (planId: string, courseId: string) => {
    if (isMutating) return

    setIsMutating(true)
    let addSucceeded = false
    const addPromise = addCourseToPlan(planId, courseId).then(() => {
      addSucceeded = true
      setPendingAddedCourses({ planId, courseIds: [courseId] })
      markChecklistItem("ADDED_COURSE")
    })
    toast.promise(addPromise, {
      loading: "Adding course...",
      success: "Course added",
      error: (err) => `Failed to add course: ${(err as Error).message}`
    })
    try {
      await addPromise
    } finally {
      if (!addSucceeded) {
        setIsMutating(false)
      }
    }
  }

  const handleAddCourses = async (planId: string, courseIds: string[]) => {
    if (isMutating) return

    setIsMutating(true)
    let addManySucceeded = false
    const addManyPromise = addCoursesToPlan(planId, courseIds).then(() => {
      addManySucceeded = true
      setPendingAddedCourses({ planId, courseIds })
    })
    toast.promise(addManyPromise, {
      loading: "Adding courses...",
      success: `${courseIds.length} course${courseIds.length > 1 ? 's' : ''} added`,
      error: (err) => `Failed to add courses: ${(err as Error).message}`
    })
    try {
      await addManyPromise
    } finally {
      if (!addManySucceeded) {
        setIsMutating(false)
      }
    }
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
    if (selectedCourses.size === 0 || isMutating) return

    const courseIds = Array.from(selectedCourses)

    // Clear selection and exit selection mode immediately
    setSelectedCourses(new Set())
    setIsSelectionMode(false)

    // Update the UI
    startTransition(async () => {
      setIsMutating(true)
      let removeManySucceeded = false
      const removeManyPromise = removeCoursesFromPlan(courseIds).then(() => {
        removeManySucceeded = true
        setPendingRemovedCourseIds(courseIds)
      })
      toast.promise(removeManyPromise, {
        loading: "Removing courses...",
        success: `Successfully removed ${courseIds.length} course${courseIds.length > 1 ? 's' : ''}`,
        error: (err) => `Failed to remove courses: ${err.message}`
      })
      try {
        await removeManyPromise
      } finally {
        if (!removeManySucceeded) {
          setIsMutating(false)
        }
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
          isMutating={isMutating}
          deletingCourseId={deletingCourseId}
          deletingPlanId={deletingPlanId}
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
