"use client"

import { useState, useEffect } from "react"
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet" // Removed
import { YearSection } from "./YearSection"
// import { CourseDrawer } from "./CourseDrawer" // Removed
// import { PlannerRightSidebar } from "./PlannerRightSidebar" // Removed
import { PlannerSidebar } from "./PlannerSidebar"
import { Prisma } from "@prisma/client"
import { DragOverlay } from "@dnd-kit/core"
import { CourseCard } from "./CourseCard"
import { CreateSemesterDialog } from "./CreateSemesterDialog"
import { IconPlus, IconLayoutSidebarRightCollapse, IconLayoutSidebarRightExpand } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import type { ValidationResult } from "@/lib/planner/types"

import { AddCourseDialog } from "./AddCourseDialog"

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
  onAddCourse: (planId: string, courseId: string) => Promise<void>
  onAddCourses: (planId: string, courseIds: string[]) => Promise<void>
  completedUnits?: number
  initialValidation: ValidationResult
}

export function PlannerBoard({
  data,
  activeId,
  onRemoveCourse,
  onDeletePlan,
  onCreatePlan,
  onAddCourse,
  onAddCourses,
  completedUnits = 0,
  initialValidation,
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

  // Group plans by year
  const plansByYear = data.semesterPlans.reduce((acc, plan) => {
    const year = plan.year
    if (!acc[year]) acc[year] = []
    acc[year].push(plan)
    return acc
  }, {} as Record<number, typeof data.semesterPlans>)

  // Sort years
  const sortedYears = Object.keys(plansByYear).map(Number).sort((a, b) => a - b)
  
  // Compute plannedCourseIds to pass down to AddCourseDialog
  const plannedCourseIds = new Set<string>()
  data.semesterPlans.forEach(plan => {
    plan.plannedCourses.forEach(pc => {
        plannedCourseIds.add(pc.course.id)
    })
  })

  return (
    <div className="flex items-start h-full bg-[#F4F1ED] overflow-hidden">
      
      <div className="flex flex-1 h-full overflow-hidden">
          {/* Center - Scrollable Canvas */}
          <main className="flex-1 h-full overflow-y-auto scroll-smooth bg-[#F4F1ED]">
             <div className="px-[60px] py-12 max-w-[1400px] mx-auto space-y-16">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b border-[#DAD6CF] pb-8">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-6 mb-4">
                            <span className="flex items-center justify-center uppercase text-xs tracking-[0.1em] font-medium bg-[#F4F1ED] px-3 h-8 border border-[#DAD6CF]">
                                {totalPlannedUnits} Units Planned
                            </span>
                        </div>
                        <h1 className="text-5xl font-normal uppercase leading-none text-[#0A0A0A]">
                            Degree <span className="font-serif italic">Planner</span>
                        </h1>
                    </div>

                    <div className="pt-2">
                        <AddCourseDialog 
                            availableCourses={data.availableCourses}
                            plannedCourseIds={plannedCourseIds}
                            semesterPlans={data.semesterPlans}
                            onAddCourse={onAddCourse}
                            onAddCourses={onAddCourses}
                        />
                    </div>
                </div>

                {/* Empty State */}
                {sortedYears.length === 0 && (
                     <div className="flex flex-col items-center justify-center p-12 border border-[#DAD6CF] bg-white text-center">
                        <div className="p-4 rounded-full bg-[#F4F1ED] mb-4">
                            <IconPlus className="w-8 h-8 opacity-50" />
                        </div>
                        <h3 className="text-lg font-serif italic mb-2">Start Planning</h3>
                        <p className="text-[#666460] mb-6 text-sm max-w-md">Create your first semester to start adding courses to your academic plan.</p>
                        <CreateSemesterDialog onCreate={onCreatePlan} />
                     </div>
                )}

                {/* Year Groups */}
                <div className="space-y-16">
                    {sortedYears.map(year => (
                        <YearSection 
                            key={year} 
                            year={year} 
                            plans={plansByYear[year]} 
                            onRemoveCourse={onRemoveCourse}
                            onDeletePlan={onDeletePlan}
                            onCreatePlan={onCreatePlan}
                        />
                    ))}

                    {/* Add Next Year Section */}
                    {sortedYears.length > 0 && (
                        <div className="pt-8">
                            <div className="w-full h-px bg-[#DAD6CF] mb-12" />
                            <div className="flex justify-center">
                                <CreateSemesterDialog 
                                    onCreate={onCreatePlan}
                                    defaultYear={sortedYears[sortedYears.length - 1] + 1}
                                    defaultTerm="Fall"
                                >
                                    <button className="flex flex-col items-center gap-4 group">
                                        <div className="w-16 h-16 rounded-full border border-[#DAD6CF] bg-white flex items-center justify-center text-[#DAD6CF] group-hover:text-[#0A0A0A] group-hover:border-[#0A0A0A] transition-all">
                                            <IconPlus size={32} stroke={1.5} />
                                        </div>
                                        <span className="text-xs uppercase tracking-[0.1em] font-medium text-[#666460] group-hover:text-[#0A0A0A] transition-colors">
                                            Add Academic Year {sortedYears[sortedYears.length - 1] + 1}
                                        </span>
                                    </button>
                                </CreateSemesterDialog>
                            </div>
                        </div>
                    )}
                </div>
             </div>
          </main>

          {/* Unified Right Sidebar */}
          <div className="md:relative h-full flex shrink-0">
              <PlannerSidebar
                 plans={data.semesterPlans}
                 completedUnits={completedUnits}
                 initialValidation={initialValidation}
              />
          </div>
      </div>

      <DragOverlay>
        {activeId && activeCourse ? (
             <div className="opacity-90 rotate-2 cursor-grabbing shadow-xl pointer-events-none">
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
