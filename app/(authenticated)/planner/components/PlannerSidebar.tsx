"use client"

import { useState, useEffect } from "react"
import { GraduationTracker } from "./GraduationTracker"
import { ValidationPanel } from "./ValidationPanel"
import { Prisma } from "@prisma/client"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { IconSearch, IconX, IconBook, IconChartBar, IconChevronRight, IconChevronLeft } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ValidationResult } from "@/lib/planner/types"

type Plan = Prisma.semesterPlanGetPayload<{
  include: { plannedCourses: { include: { course: true } } }
}>

// Draggable Item Wrapper removed because it is no longer used here.

interface PlannerSidebarProps {
  plans: Plan[]
  completedUnits?: number
  initialValidation: ValidationResult
}

export function PlannerSidebar({
  plans,
  completedUnits = 0,
  initialValidation,
}: PlannerSidebarProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
      setMounted(true)
  }, [])

  // Progress Data Calculation
  const plannedUnits = plans.reduce(
    (total: number, plan) =>
      total + plan.plannedCourses.reduce((sum: number, item) => sum + item.course.units, 0),
    0
  )
  const totalUnits = (completedUnits || 0) + plannedUnits
  const requiredUnits = 120 

  return (
    <div className={cn(
        "relative md:h-full transition-all duration-300 ease-in-out shrink-0 z-30 flex",
        "w-[340px]",
        "absolute right-0 h-[calc(100vh-65px)] md:relative"
    )}>
        <aside className={cn(
            "w-[340px] border-l border-[#DAD6CF] bg-white h-full flex flex-col font-sans transition-all duration-300 ease-in-out overflow-hidden shadow-[-4px_0_24px_rgba(0,0,0,0.02)] md:shadow-none"
        )}>
            {/* Always visible Progress Content */}
            <div className="flex-1 overflow-y-auto w-[340px] scrollbar-thin">
                <div className="p-8 pb-0">
                    <div className="mb-8">
                        <h2 className="text-xl font-serif text-[#0A0A0A]">Degree Progress</h2>
                        <p className="text-xs text-[#666460] mt-2 leading-relaxed">
                            Track your graduation requirements. ensure you meet all major and core units.
                        </p>
                    </div>
                    
                    <GraduationTracker
                        totalUnits={plannedUnits}
                        completedUnits={completedUnits}
                        requiredUnits={requiredUnits}
                    />
                </div>

                <div className="p-8 pt-0">
                    <ValidationPanel initialValidation={initialValidation} />
                </div>
            </div>
        </aside>
    </div>
  )
}
