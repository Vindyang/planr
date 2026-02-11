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
import { PlannerBoard } from "./PlannerBoard"
import { addCourseToPlan, moveCourse, removeCourseFromPlan, deleteSemesterPlan, createSemesterPlan } from "@/lib/planner/actions"
import { useRouter } from "next/navigation"

type PlannerClientProps = {
  initialData: any
  allCourses: any[]
  completedUnits?: number
}

export default function PlannerClient({ initialData, allCourses, completedUnits = 0 }: PlannerClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  
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
            alert("Failed to move course: " + (error as Error).message)
        }
    })
  }

  const handleRemoveCourse = (id: string) => {
    if (confirm("Remove this course from plan?")) {
        startTransition(async () => {
            await removeCourseFromPlan(id)
        })
    }
  }

  const handleDeletePlan = (id: string) => {
    if (confirm("Delete this semester plan? All courses in it will be removed.")) {
        startTransition(async () => {
            await deleteSemesterPlan(id)
        })
    }
  }

  const handleCreatePlan = () => {
     const lastPlan = initialData.semesterPlans[initialData.semesterPlans.length - 1]
     
     let defaultTerm = "Fall"
     let defaultYear = new Date().getFullYear()

     if (lastPlan) {
        if (lastPlan.term === "Fall") {
            defaultTerm = "Spring"
            defaultYear = lastPlan.year + 1
        } else {
            defaultTerm = "Fall"
            defaultYear = lastPlan.year
        }
     }

     const term = prompt("Enter Term (Spring, Fall):", defaultTerm)
     if (!term) return
     
     const yearStr = prompt("Enter Year:", defaultYear.toString())
     if (!yearStr) return
     const year = parseInt(yearStr)

     startTransition(async () => {
         try {
             await createSemesterPlan(term, year)
         } catch (e) {
             alert((e as Error).message)
         }
     })
  }

  return (
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
        onRemoveCourse={handleRemoveCourse}
        onDeletePlan={handleDeletePlan}
        onCreatePlan={handleCreatePlan}
        completedUnits={completedUnits}
      />
    </DndContext>
  )
}
