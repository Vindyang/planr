"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { CourseCard } from "./CourseCard"
import { Prisma } from "@prisma/client"
import { IconTrash, IconX } from "@tabler/icons-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type PlannedCourseWithCourse = Prisma.plannedCourseGetPayload<{
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
    <Card 
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 shrink-0 border-border h-fit max-h-[calc(100vh-12rem)] transition-all",
        isOver ? "bg-muted/50 ring-2 ring-primary/20 border-primary/50" : "bg-card"
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex justify-between items-center bg-muted/20 rounded-t-lg sticky top-0 z-10 backdrop-blur-sm">
        <div>
          <h3 className="font-semibold text-foreground text-sm">{term} {year}</h3>
          <p className="text-xs text-muted-foreground">{totalUnits} Units</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon-xs"
          onClick={() => onDeletePlan(planId)}
          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete Semester"
        >
          <IconTrash size={14} />
        </Button>
      </div>

      {/* Course List */}
      <div className="p-2 space-y-2 overflow-y-auto min-h-[150px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {courses.map((plannedCourse) => (
          <div key={plannedCourse.id} className="relative group/card">
             {/* Delete Button (Overlay) */}
             <button
              onClick={() => onRemoveCourse(plannedCourse.id)}
              className="absolute -top-1.5 -right-1.5 z-20 bg-card shadow-sm border border-border rounded-full p-1 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground hover:border-destructive scale-75"
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
          <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-md bg-muted/5 gap-2">
            <span className="text-xs text-muted-foreground font-medium">Drop courses here</span>
          </div>
        )}
      </div>
    </Card>
  )
}
