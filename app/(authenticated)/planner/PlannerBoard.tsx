"use client"

import { SemesterColumn } from "./SemesterColumn"
import { CourseDrawer } from "./CourseDrawer"
import { ValidationPanel } from "./components/ValidationPanel"
import { GraduationTracker } from "./components/GraduationTracker"
import { Prisma } from "@prisma/client"
import { DragOverlay } from "@dnd-kit/core"
import { CourseCard } from "./CourseCard"

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
  onCreatePlan: () => void
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50/30">
      {/* Sidebar / Drawer */}
      <CourseDrawer availableCourses={data.availableCourses} />

      {/* Main Board Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar / Header */}
        <div className="px-6 py-4 border-b bg-white flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Multi-Semester Plan</h1>
            <div className="flex gap-2">
                <button
                  onClick={onCreatePlan}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition w-fit whitespace-nowrap"
                >
                    + Add Semester
                </button>
            </div>
        </div>

        {/* Horizontal Scroll Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex gap-4 h-full">
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
                <div className="flex flex-col items-center justify-center w-full h-full text-zinc-400 gap-4">
                  <p>No semesters planned yet. Start by adding a semester.</p>
                </div>
            )}

            {/* Spacer for right padding */}
            <div className="w-2 shrink-0" />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Validation & Tracker */}
      <div className="w-96 border-l border-border bg-background overflow-y-auto">
        <div className="p-6 space-y-6">
          <ValidationPanel />
          <GraduationTracker
            totalUnits={totalPlannedUnits}
            completedUnits={completedUnits}
            requiredUnits={120}
          />
        </div>
      </div>

      <DragOverlay>
        {activeId && activeCourse ? (
             <CourseCard
             id={activeId}
             code={activeCourse.code}
             title={activeCourse.title}
             units={activeCourse.units}
             isOverlay
           />
        ) : null}
      </DragOverlay>
    </div>
  )
}
