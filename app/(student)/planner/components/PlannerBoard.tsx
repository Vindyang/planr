"use client"

import { useState } from "react"
import { YearSection } from "./YearSection"
import { PlannerSidebar } from "./PlannerSidebar"
import { Prisma } from "@prisma/client"
import { DragOverlay } from "@dnd-kit/core"
import { CourseCard } from "./CourseCard"
import { CreateSemesterDialog } from "./componentsAction/CreateSemesterDialog"
import { IconPlus, IconLayoutSidebarRightCollapse, IconLayoutSidebarRightExpand, IconChecks, IconTrash, IconX } from "@tabler/icons-react"
import type { ValidationResult } from "@/lib/planner/types"

import { AddCourseDialog } from "./componentsAction/AddCourseDialog"

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
  isSelectionMode: boolean
  selectedCourses: Set<string>
  onToggleSelection: (courseId: string) => void
  onToggleSelectionMode: () => void
  onBulkDelete: () => void
  onCancelSelection: () => void
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
  isSelectionMode,
  selectedCourses,
  onToggleSelection,
  onToggleSelectionMode,
  onBulkDelete,
  onCancelSelection,
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex items-start h-full bg-[#F4F1ED] overflow-hidden">
      
      <div className="flex flex-1 h-full overflow-hidden">
          {/* Center - Scrollable Canvas */}
          <main className="flex-1 h-full overflow-y-auto scroll-smooth bg-[#F4F1ED]">
             <div className="px-6 md:px-8 py-8 md:py-12 space-y-12">
                
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

                    <div className="pt-2 flex items-center gap-4">
                        {!isSelectionMode && data.semesterPlans.length > 0 && (
                            <>
                                <AddCourseDialog
                                    availableCourses={data.availableCourses}
                                    plannedCourseIds={plannedCourseIds}
                                    semesterPlans={data.semesterPlans}
                                    onAddCourse={onAddCourse}
                                    onAddCourses={onAddCourses}
                                />
                                {/* Delete Courses Button */}
                                {plannedCourseIds.size > 0 && (
                                    <button
                                        className="uppercase text-xs tracking-[0.1em] font-medium bg-white border border-[#DAD6CF] hover:bg-[#F4F1ED] text-[#0A0A0A] gap-2 mt-1 h-9 px-4 flex items-center justify-center rounded-sm transition-colors"
                                        onClick={onToggleSelectionMode}
                                    >
                                        <IconChecks size={18} stroke={1.5} />
                                        <span>Delete Courses</span>
                                    </button>
                                )}
                            </>
                        )}
                        {isSelectionMode && (
                            <>
                                {/* Cancel Selection Button */}
                                <button
                                    className="uppercase text-xs tracking-[0.1em] font-medium bg-white border border-[#DAD6CF] hover:bg-[#F4F1ED] text-[#0A0A0A] gap-2 mt-1 h-9 px-4 flex items-center justify-center rounded-sm transition-colors"
                                    onClick={onCancelSelection}
                                >
                                    <IconX size={18} stroke={1.5} />
                                    <span>Cancel</span>
                                </button>
                            </>
                        )}
                        {/* Sidebar Toggle Button */}
                        <button
                            className="uppercase text-xs tracking-[0.1em] font-medium bg-[#0A0A0A] border border-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-white gap-2 mt-1 h-9 px-4 flex items-center justify-center rounded-sm transition-colors"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? (
                                <>
                                    <IconLayoutSidebarRightCollapse size={18} stroke={1.5} />
                                    <span>Hide Progress</span>
                                </>
                            ) : (
                                <>
                                    <IconLayoutSidebarRightExpand size={18} stroke={1.5} />
                                    <span>Show Progress</span>
                                </>
                            )}
                        </button>
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
                            isSelectionMode={isSelectionMode}
                            selectedCourses={selectedCourses}
                            onToggleSelection={onToggleSelection}
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
                 isCollapsed={!isSidebarOpen}
                 onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
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

      {/* Floating Action Bar - Show when courses are selected */}
      {isSelectionMode && selectedCourses.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-[#0A0A0A] text-white px-6 py-4 rounded-lg shadow-2xl border border-[#0A0A0A] flex items-center gap-6">
            <span className="text-sm font-medium">
              {selectedCourses.size} course{selectedCourses.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onCancelSelection}
                className="uppercase text-xs tracking-[0.1em] font-medium bg-white/10 hover:bg-white/20 text-white gap-2 h-9 px-4 flex items-center justify-center rounded-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onBulkDelete}
                className="uppercase text-xs tracking-[0.1em] font-medium bg-[#ef4444] hover:bg-[#dc2626] text-white gap-2 h-9 px-4 flex items-center justify-center rounded-sm transition-colors"
              >
                <IconTrash size={16} stroke={1.5} />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
