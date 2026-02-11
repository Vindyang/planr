"use client"

import { SemesterColumn } from "./SemesterColumn"
import { CourseDrawer } from "./CourseDrawer"
import { ValidationPanel } from "./components/ValidationPanel"
import { GraduationTracker } from "./components/GraduationTracker"
import { Prisma } from "@prisma/client"
import { DragOverlay } from "@dnd-kit/core"
import { CourseCard } from "./CourseCard"
import { CreateSemesterDialog } from "./components/CreateSemesterDialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { IconPlus } from "@tabler/icons-react"

// Actually, ScrollArea was not in the list. I will use standard div with nice styling.

type PlannerData = {
  semesterPlans: (Prisma.semesterPlanGetPayload<{
    include: { plannedCourses: { include: { course: true } } }
  }>)[]
  availableCourses: any[] // Using any for now to simplify
}

type PlannerBoardProps = {
  data: PlannerData
  activeId: string | null
  onRemoveCourse: (id: string) => void
  onDeletePlan: (id: string) => void
  onCreatePlan: (term: string, year: number) => Promise<void>
  completedUnits?: number
}

export function PlannerBoard({
  data,
  activeId,
  onRemoveCourse,
  onDeletePlan,
  onCreatePlan,
  completedUnits = 0,
}: PlannerBoardProps) {

  // Find active item for overlay
  let activeCourse: any = null

  if (activeId) {
    if (activeId.startsWith("drawer-")) {
      const courseId = activeId.replace("drawer-", "")
      activeCourse = data.availableCourses.find((c: any) => c.id === courseId)
    } else {
      for (const plan of data.semesterPlans) {
        const course = plan.plannedCourses.find((pc) => pc.id === activeId)
        if (course) {
          activeCourse = course.course
          break
        }
      }
    }
  }

  // Calculate total planned units
  const totalPlannedUnits = data.semesterPlans.reduce(
    (sum: number, plan) => sum + plan.plannedCourses.reduce((s: number, pc) => s + pc.course.units, 0),
    0
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Sidebar / Drawer */}
      <CourseDrawer availableCourses={data.availableCourses} />

      {/* Main Board Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar / Header */}
        <div className="px-8 py-6 border-b bg-card flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-serif font-medium text-foreground">Degree Planner</h1>
            <p className="text-sm text-muted-foreground mt-1">Drag and drop courses to plan your semesters</p>
          </div>
            
          <div className="flex gap-2">
            <CreateSemesterDialog 
              onCreate={onCreatePlan} 
              defaultYear={data.semesterPlans.length > 0 ? data.semesterPlans[data.semesterPlans.length - 1].year + (data.semesterPlans[data.semesterPlans.length - 1].term === "Fall" ? 1 : 0) : undefined}
              defaultTerm={data.semesterPlans.length > 0 ? (data.semesterPlans[data.semesterPlans.length - 1].term === "Fall" ? "Spring" : "Fall") : undefined}
            />
          </div>
        </div>

        {/* Horizontal Scroll Area */}
        {/* Using native scroll for now but styling it */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-8 bg-muted/20">
          <div className="flex gap-6 h-full min-w-fit">
            {data.semesterPlans.map((plan) => (
              <SemesterColumn
                key={plan.id}
                planId={plan.id}
                term={plan.term}
                year={plan.year}
                courses={plan.plannedCourses}
                onRemoveCourse={onRemoveCourse}
                totalUnits={plan.plannedCourses.reduce((sum: number, item) => sum + item.course.units, 0)}
                onDeletePlan={onDeletePlan}
              />
            ))}

            {data.semesterPlans.length === 0 && (
                <div className="flex flex-col items-center justify-center w-full h-[60vh] text-muted-foreground gap-4 border-2 border-dashed border-border rounded-xl bg-card/50 m-auto max-w-2xl">
                  <div className="p-4 rounded-full bg-muted">
                    <IconPlus className="w-8 h-8 opacity-50" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-lg">No semesters planned</h3>
                    <p className="text-sm mt-1">Start by adding your first semester.</p>
                  </div>
                  <CreateSemesterDialog onCreate={onCreatePlan} />
                </div>
            )}

            {/* Spacer for right padding */}
            <div className="w-8 shrink-0" />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Validation & Tracker */}
      <div className="w-80 border-l border-border bg-card overflow-y-auto shrink-0 shadow-sm z-10">
        <div className="p-6 space-y-8">
          <GraduationTracker
            totalUnits={totalPlannedUnits}
            completedUnits={completedUnits}
            requiredUnits={120}
          />
          <Separator />
          <ValidationPanel />
        </div>
      </div>

      <DragOverlay>
        {activeId && activeCourse ? (
             <div className="opacity-90 rotate-2 cursor-grabbing">
               <CourseCard
                id={activeId}
                code={activeCourse.code}
                title={activeCourse.title}
                units={activeCourse.units}
                isOverlay
              />
             </div>
        ) : null}
      </DragOverlay>
    </div>
  )
}
