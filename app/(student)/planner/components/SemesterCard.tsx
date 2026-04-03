"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { CourseCard } from "./CourseCard"
import { Prisma } from "@prisma/client"
import { IconTrash, IconX, IconPlus, IconLoader2 } from "@tabler/icons-react"

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
  isSelectionMode: boolean
  selectedCourses: Set<string>
  onToggleSelection: (courseId: string) => void
  isMutating: boolean
  deletingCourseId: string | null
  deletingPlanId: string | null
}

export function SemesterCard({
  planId,
  term,
  year,
  courses,
  onRemoveCourse,
  totalUnits,
  onDeletePlan,
  isSelectionMode,
  selectedCourses,
  onToggleSelection,
  isMutating,
  deletingCourseId,
  deletingPlanId
}: SemesterCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: planId,
    data: {
      type: "semester",
      term,
      year
    }
  })

  const isDeletingThisPlan = deletingPlanId === planId

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
              className="text-[#666460] hover:text-[#ef4444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isDeletingThisPlan ? "Deleting term..." : "Delete Term"}
              disabled={isMutating}
            >
              {isDeletingThisPlan ? <IconLoader2 size={14} className="animate-spin" /> : <IconTrash size={14} />}
            </button>
        </div>
      </div>

      {/* Course List - Mimicking the "Seminar Room" block style */}
      <div className="space-y-3 flex-1 flex flex-col">
          <div className="space-y-3">
            {courses.map((plannedCourse) => {
              const isDeletingThisCourse = deletingCourseId === plannedCourse.id
              return (
              <div key={plannedCourse.id} className="relative group/card">
                {/* Delete Button (Overlay) - Only show when NOT in selection mode */}
                {!isSelectionMode && (
                  <button
                   onClick={() => onRemoveCourse(plannedCourse.id)}
                   className={cn(
                     "absolute -top-2 -right-2 z-20 bg-white border border-[#DAD6CF] rounded-full p-1 transition-opacity hover:border-[#ef4444] hover:text-[#ef4444] disabled:opacity-50 disabled:cursor-not-allowed",
                     isDeletingThisCourse ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
                   )}
                   disabled={isMutating}
                   title={isDeletingThisCourse ? "Deleting course..." : "Remove course"}
                 >
                   {isDeletingThisCourse ? (
                     <IconLoader2 size={10} className="animate-spin" />
                   ) : (
                     <IconX size={10} />
                   )}
                 </button>
                )}

                <CourseCard
                  id={plannedCourse.id}
                  code={plannedCourse.course.code}
                  title={plannedCourse.course.title}
                  units={plannedCourse.course.units}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedCourses.has(plannedCourse.id)}
                  onToggleSelection={onToggleSelection}
                />
              </div>
              )
            })}
            {courses.length === 0 ? (
              <button 
                data-tour-id="planner-add-course-btn"
                onClick={() => window.dispatchEvent(new CustomEvent("planr_open_add_course"))}
                className="w-full flex-1 flex flex-col items-center justify-center border border-dashed border-[#DAD6CF] min-h-[200px] hover:bg-[#DAD6CF]/30 transition-colors cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isMutating}
              >
                <div className="flex items-center gap-2 mb-1.5 text-[#999693] group-hover:text-[#0A0A0A] transition-colors">
                  <IconPlus size={16} stroke={2} />
                  <span className="text-xs uppercase tracking-[0.1em] font-bold">
                    {isMutating ? "Loading..." : "Add Courses"}
                  </span>
                </div>
                {!isMutating && (
                  <span className="text-[10px] text-[#999693] font-medium uppercase tracking-[0.1em] max-w-[140px] text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    Click or drag here
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("planr_open_add_course"))}
                className="w-full py-3 flex items-center justify-center border border-dashed border-[#DAD6CF] hover:bg-[#DAD6CF]/30 transition-colors cursor-pointer group mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isMutating}
              >
                <IconPlus size={14} stroke={1.5} className="mr-2 text-[#666460] group-hover:text-[#0A0A0A] transition-colors" />
                <span className="text-[0.65rem] uppercase tracking-widest text-[#666460] group-hover:text-[#0A0A0A] transition-colors">
                  {isMutating ? "Loading..." : "Add Course"}
                </span>
              </button>
            )}
          </div>
      </div>
    </div>
  )
}
