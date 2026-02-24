"use client"

import { GraduationTracker } from "./GraduationTracker"
import { ValidationPanel } from "./ValidationPanel"
import { Prisma } from "@prisma/client"
import type { ValidationResult } from "@/lib/planner/types"

type Plan = Prisma.semesterPlanGetPayload<{
  include: { plannedCourses: { include: { course: true } } }
}>

interface PlannerRightSidebarProps {
  plans: Plan[]
  completedUnits?: number
  initialValidation?: ValidationResult
}

export function PlannerRightSidebar({ plans, completedUnits = 0, initialValidation }: PlannerRightSidebarProps) {
  const plannedUnits = plans.reduce(
    (total: number, plan) =>
      total + plan.plannedCourses.reduce((sum: number, item) => sum + item.course.units, 0),
    0
  )
  const totalUnits = (completedUnits || 0) + plannedUnits
  const requiredUnits = 120 // Default

  return (
    <aside className="w-[340px] border-l border-[#DAD6CF] bg-white h-full overflow-y-auto flex flex-col shrink-0">
        <div className="p-8 pb-0">
            <div className="mb-6">
                <div className="w-10 h-10 bg-[#F4F1ED] rounded-full flex items-center justify-center mb-4 border border-[#DAD6CF]">
                    <span className="font-serif italic text-lg">i</span>
                </div>
                <h2 className="text-xl font-serif text-[#0A0A0A]">Degree Progress</h2>
                <p className="text-xs text-[#666460] mt-1">
                    Track your graduation requirements and validate your plan.
                </p>
            </div>
            
            <GraduationTracker
                totalUnits={plannedUnits}
                completedUnits={completedUnits}
                requiredUnits={requiredUnits}
            />
        </div>

        <div className="p-8">
            {initialValidation && <ValidationPanel initialValidation={initialValidation} />}
        </div>
    </aside>
  )
}
