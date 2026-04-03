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
  availableCourses: Array<{
    id: string
    code: string
    title: string
    units: number
  }>
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
  currentGpa?: number | null
  initialValidation: ValidationResult
  isSelectionMode: boolean
  selectedCourses: Set<string>
  onToggleSelection: (courseId: string) => void
  onToggleSelectionMode: () => void
  onBulkDelete: () => void
  onCancelSelection: () => void
  onOpenAIModal: () => void
  requiredUnits?: number
  isMutating: boolean
  deletingCourseId: string | null
  deletingPlanId: string | null
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
  currentGpa,
  initialValidation,
  isSelectionMode,
  selectedCourses,
  onToggleSelection,
  onToggleSelectionMode,
  onBulkDelete,
  onCancelSelection,
  onOpenAIModal,
  requiredUnits = 120,
  isMutating,
  deletingCourseId,
  deletingPlanId,
}: PlannerBoardProps) {
  
  // Find active item for overlay
  let activeCourse: PlannerData["availableCourses"][number] | null = null

  if (activeId) {
    if (activeId.startsWith("drawer-")) {
      const courseId = activeId.replace("drawer-", "")
      activeCourse = data.availableCourses.find((c) => c.id === courseId) || null
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
                        {!isSelectionMode && (
                            <>
                                {/* AI Recommendation Button - Always show */}
                                <button
                                    className="uppercase text-xs tracking-[0.1em] font-medium bg-[#0A0A0A] border border-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-white gap-2 mt-1 h-9 px-4 flex items-center justify-center rounded-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                    onClick={onOpenAIModal}
                                    disabled={isMutating}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <span>AI Recommend</span>
                                </button>
                                {/* Show Add Course and Delete buttons only when plans exist */}
                                {data.semesterPlans.length > 0 && (
                                    <>
                                        <AddCourseDialog
                                            availableCourses={data.availableCourses}
                                            plannedCourseIds={plannedCourseIds}
                                            semesterPlans={data.semesterPlans}
                                            onAddCourse={onAddCourse}
                                            onAddCourses={onAddCourses}
                                            isMutating={isMutating}
                                        />
                                        {/* Select Courses Button */}
                                        {plannedCourseIds.size > 0 && (
                                            <button
                                                className="uppercase text-xs tracking-[0.1em] font-medium bg-white border border-[#DAD6CF] hover:bg-[#F4F1ED] text-[#0A0A0A] gap-2 mt-1 h-9 px-4 flex items-center justify-center rounded-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                                onClick={onToggleSelectionMode}
                                                disabled={isMutating}
                                            >
                                                <IconChecks size={18} stroke={1.5} />
                                                <span>Select Courses</span>
                                            </button>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        
                        {isSelectionMode && (
                            <>
                                {/* Cancel Selection Button */}
                                <button
                                    className="uppercase text-xs tracking-[0.1em] font-medium bg-white border border-[#DAD6CF] hover:bg-[#F4F1ED] text-[#0A0A0A] gap-2 mt-1 h-9 px-4 flex items-center justify-center rounded-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                    onClick={onCancelSelection}
                                    disabled={isMutating}
                                >
                                    <IconX size={18} stroke={1.5} />
                                    <span>Cancel</span>
                                </button>
                                
                                {/* Delete Selected Button */}
                                {selectedCourses.size > 0 && (
                                    <button
                                        onClick={onBulkDelete}
                                        className="uppercase text-xs tracking-[0.1em] font-medium bg-[#0A0A0A] border border-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-white gap-2 mt-1 h-9 px-4 flex items-center justify-center rounded-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                        disabled={isMutating}
                                    >
                                        <IconTrash size={16} stroke={1.5} />
                                        <span>{isMutating ? "Deleting..." : `Delete ${selectedCourses.size} Course${selectedCourses.size > 1 ? 's' : ''}`}</span>
                                    </button>
                                )}
                            </>
                        )}
                        {/* Sidebar Toggle Button */}
                        <button
                            className="uppercase text-xs tracking-[0.1em] font-medium bg-[#0A0A0A] border border-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-white gap-2 mt-1 h-9 px-4 flex items-center justify-center rounded-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            disabled={isMutating}
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
                     <div data-tour-id="planner-create-term" className="flex flex-col items-center justify-center p-12 border border-[#DAD6CF] bg-white text-center">
                        <div className="p-4 rounded-full bg-[#F4F1ED] mb-4">
                            <IconPlus className="w-8 h-8 opacity-50" />
                        </div>
                        <h3 className="text-lg font-serif italic mb-2">Start Planning</h3>
                        <p className="text-[#666460] mb-6 text-sm max-w-md">Create your first term to start adding courses to your academic plan.</p>
                        <CreateSemesterDialog onCreate={onCreatePlan} disabled={isMutating} />
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
                            isMutating={isMutating}
                            deletingCourseId={deletingCourseId}
                            deletingPlanId={deletingPlanId}
                        />
                    ))}

                    {/* Add Next Year Section */}
                    {sortedYears.length > 0 && (
                        <div className="pt-12 pb-8">
                            <button
                                onClick={() => onCreatePlan("Term 1", sortedYears[sortedYears.length - 1] + 1)}
                                className="flex items-center w-full group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={isMutating}
                            >
                                <div className="flex-1 h-px bg-[#DAD6CF] group-hover:bg-[#0A0A0A] transition-colors" />
                                <div className="px-6 py-2 border border-[#DAD6CF] rounded-full mx-8 flex items-center gap-2 group-hover:border-[#0A0A0A] transition-colors bg-[#F4F1ED] group-hover:bg-white text-[#666460] group-hover:text-[#0A0A0A]">
                                    <IconPlus size={14} stroke={2} className="transition-colors" />
                                    <span className="text-xs uppercase tracking-[0.1em] font-medium transition-colors">
                                        {isMutating
                                          ? "Creating..."
                                          : `Add Academic Year ${sortedYears[sortedYears.length - 1] + 1}`}
                                    </span>
                                </div>
                                <div className="flex-1 h-px bg-[#DAD6CF] group-hover:bg-[#0A0A0A] transition-colors" />
                            </button>
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
                 currentGpa={currentGpa}
                 initialValidation={initialValidation}
                 isCollapsed={!isSidebarOpen}
                 onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                 requiredUnits={requiredUnits}
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

      {/* Floating Action Bar removed in favor of top header actions */}
    </div>
  )
}
