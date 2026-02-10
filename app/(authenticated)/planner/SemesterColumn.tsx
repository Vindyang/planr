"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { CourseCard } from "./CourseCard"
import { Prisma } from "@prisma/client"
import { IconTrash, IconX } from "@tabler/icons-react"

type PlannedCourseWithCourse = Prisma.PlannedCourseGetPayload<{
  include: { course: true }
}>

type SemesterColumnProps = {
  planId: string
  term: string
  year: number
  courses: PlannedCourseWithCourse[]
  onRemoveCourse: (plannedCourseId: string) => void
  totalUnits: number
  isActive?: boolean
  onDeletePlan: (planId: string) => void
}

export function SemesterColumn({ 
  planId, 
  term, 
  year, 
  courses, 
  onRemoveCourse,
  totalUnits,
  onDeletePlan
}: SemesterColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: planId,
    data: {
      type: "semester",
      term,
      year
    }
  })

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 shrink-0 rounded-lg bg-gray-50/50 border h-fit max-h-full transition-colors",
        isOver && "bg-blue-50 border-blue-200 ring-2 ring-blue-100"
      )}
    >
      {/* Header */}
      <div className="p-3 border-b flex justify-between items-center bg-white rounded-t-lg sticky top-0 z-10">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{term} {year}</h3>
          <p className="text-xs text-gray-500">{totalUnits} Units</p>
        </div>
        <button 
          onClick={() => onDeletePlan(planId)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          title="Delete Semester"
        >
          <IconTrash size={14} />
        </button>
      </div>

      {/* Course List */}
      <div className="p-2 space-y-2 overflow-y-auto min-h-[150px]">
        {courses.map((plannedCourse) => (
          <div key={plannedCourse.id} className="relative group/card">
             {/* Delete Button (Overlay) */}
             <button
              onClick={() => onRemoveCourse(plannedCourse.id)}
              className="absolute -top-1 -right-1 z-20 bg-white shadow-sm border rounded-full p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-50 text-gray-400 hover:text-red-600 scale-90"
            >
              <IconX size={12} />
            </button>
            
            <CourseCard
              id={plannedCourse.id}
              code={plannedCourse.course.code}
              title={plannedCourse.course.title}
              units={plannedCourse.course.units}
              // In real implementation, check eligibility here and pass error
            />
          </div>
        ))}
        {courses.length === 0 && (
          <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md">
            <span className="text-xs text-gray-400">Drop courses here</span>
          </div>
        )}
      </div>
    </div>
  )
}
