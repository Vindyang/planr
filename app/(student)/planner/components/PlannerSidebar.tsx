"use client"

import { GraduationTracker } from "./GraduationTracker"
import { ValidationPanel } from "./ValidationPanel"
import { Prisma } from "@prisma/client"
import { IconX, IconChevronRight, IconChevronLeft } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { ValidationResult } from "@/lib/planner/types"

type Plan = Prisma.semesterPlanGetPayload<{
  include: { plannedCourses: { include: { course: true } } }
}>

// Draggable Item Wrapper removed because it is no longer used here.

interface PlannerSidebarProps {
  plans: Plan[]
  completedUnits?: number
  currentGpa?: number | null
  initialValidation: ValidationResult
  isCollapsed: boolean
  onToggle: () => void
  requiredUnits?: number
}

export function PlannerSidebar({
  plans,
  completedUnits = 0,
  currentGpa,
  initialValidation,
  isCollapsed,
  onToggle,
  requiredUnits = 120
}: PlannerSidebarProps) {
  // Progress Data Calculation
  const plannedUnits = plans.reduce(
    (total: number, plan) =>
      total + plan.plannedCourses.reduce((sum: number, item) => sum + item.course.units, 0),
    0
  )

  return (
    <div className={cn(
        "relative md:h-full transition-all duration-300 ease-in-out shrink-0 z-30 flex",
        isCollapsed ? "w-0 md:w-0" : "w-[400px]",
        "absolute right-0 h-[calc(100vh-65px)] md:relative"
    )}>
        {/* Toggle Button - now hidden, using main header button instead */}
        <div className="hidden">
            <button
                onClick={onToggle}
                className="w-8 h-8 bg-white border border-[#DAD6CF] shadow-sm rounded-full flex items-center justify-center text-[#666460] hover:text-[#0A0A0A] hover:bg-[#F9F8F6] transition-all"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? <IconChevronLeft size={16} /> : <IconChevronRight size={16} />}
            </button>
        </div>

        <aside className={cn(
            "w-[400px] border-l border-[#DAD6CF] bg-white h-full flex flex-col font-sans transition-all duration-300 ease-in-out overflow-hidden shadow-[-4px_0_24px_rgba(0,0,0,0.02)] md:shadow-none",
            isCollapsed && "translate-x-full md:translate-x-0 md:opacity-0"
        )}>
            {/* Always visible Progress Content */}
            <div className="flex-1 overflow-y-auto w-[400px] scrollbar-thin">
                <div className="p-10 pb-0">
                    <div className="mb-10 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-serif text-[#0A0A0A]">Degree Progress</h2>
                            <p className="text-sm text-[#666460] mt-2 leading-relaxed">
                                Track your graduation requirements. ensure you meet all major and core units.
                            </p>
                        </div>
                        {/* Mobile close button */}
                        <button onClick={onToggle} className="md:hidden p-2 bg-[#F4F1ED] rounded-full">
                            <IconX size={20} />
                        </button>
                    </div>
                    
                    <GraduationTracker
                        totalUnits={plannedUnits}
                        completedUnits={completedUnits}
                        currentGpa={currentGpa}
                        requiredUnits={requiredUnits}
                    />
                </div>

                <div className="p-10 pt-0 mt-8">
                    <ValidationPanel initialValidation={initialValidation} />
                </div>
            </div>
        </aside>
    </div>
  )
}
