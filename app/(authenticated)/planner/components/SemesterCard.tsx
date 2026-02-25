"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { CourseCard } from "./CourseCard"
import { Prisma } from "@prisma/client"
import { IconTrash, IconX } from "@tabler/icons-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type PlannedCourseWithCourse = Prisma.plannedCourseGetPayload<{
  include: { course: true }
}>

type SemesterCardProps = {
  planId: string
  term: string
  year: number
  courses: PlannedCourseWithCourse[]
  onRemoveCourse: (plannedCourseId: string) => void
  totalUnits: number
  isActive?: boolean
  onDeletePlan: (planId: string) => void
}

export function SemesterCard({ 
  planId, 
  term, 
  year, 
  courses, 
  onRemoveCourse,
  totalUnits,
  onDeletePlan
}: SemesterCardProps) {
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
        "flex flex-col h-full min-h-[300px] bg-[#F4F1ED] p-6 transition-colors",
        isOver ? "bg-[#DAD6CF]/50" : ""
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-[0.65rem] uppercase mb-1 block opacity-60 tracking-widest">{term}</span>
          {/* <span className="text-xs font-serif italic text-[#666460]">{year}</span> */}
        </div>
        
        <div className="flex items-center gap-2">
            <span className="text-[0.65rem] uppercase opacity-60 tracking-widest">{totalUnits} CU</span>
            <button 
              onClick={() => onDeletePlan(planId)}
              className="text-[#666460] hover:text-[#ef4444] transition-colors"
               title="Delete Semester"
            >
              <IconTrash size={14} />
            </button>
        </div>
      </div>

      {/* Course List - Mimicking the "Seminar Room" block style */}
      <div className="space-y-3 flex-1 flex flex-col">
          <div className="space-y-3">
            {courses.map((plannedCourse) => (
              <div key={plannedCourse.id} className="relative group/card">
                 {/* Delete Button (Overlay) */}
                 <button
                  onClick={() => onRemoveCourse(plannedCourse.id)}
                  className="absolute -top-2 -right-2 z-20 bg-white border border-[#DAD6CF] rounded-full p-1 opacity-0 group-hover/card:opacity-100 transition-opacity hover:border-[#ef4444] hover:text-[#ef4444]"
                >
                  <IconX size={10} />
                </button>
                
                <CourseCard
                  id={plannedCourse.id}
                  code={plannedCourse.course.code}
                  title={plannedCourse.course.title}
                  units={plannedCourse.course.units}
                />
              </div>
            ))}
            {courses.length === 0 && (
              <div className="flex flex-col items-center justify-center border border-dashed border-[#DAD6CF] opacity-50 p-6 min-h-[120px]">
                <span className="text-[0.65rem] uppercase tracking-widest text-[#666460]">Drop Courses</span>
              </div>
            )}
          </div>
      </div>
    </div>
  )
}
