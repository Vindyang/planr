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

type DrawerCourse = {
  id: string
  code: string
  title: string
  units: number
}

// Draggable Item Wrapper
function DraggableCourseItem({ course }: { course: DrawerCourse }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `drawer-${course.id}`, 
    data: {
      type: "new-course",
      courseId: course.id,
      code: course.code,
      title: course.title,
      units: course.units
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-80 border p-3 rounded-sm bg-background shadow-lg w-full z-50">
         <div className="font-bold text-sm">{course.code}</div>
         <div className="text-xs text-muted-foreground">{course.title}</div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="p-3 bg-white border border-[#DAD6CF] hover:border-[#0A0A0A] hover:shadow-sm cursor-grab active:cursor-grabbing group transition-all mb-2"
    >
      <div className="flex justify-between items-center mb-1">
          <div className="font-bold text-sm text-[#0A0A0A]">{course.code}</div>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#F4F1ED] text-[#666460] rounded-sm font-medium">{course.units} U</span>
      </div>
      <div className="text-xs text-[#666460] line-clamp-2 leading-tight group-hover:text-[#0A0A0A] transition-colors">{course.title}</div>
    </div>
  )
}

interface PlannerSidebarProps {
  plans: Plan[]
  completedUnits?: number
  availableCourses: DrawerCourse[]
  activeTab?: "progress" | "catalog"
  onTabChange?: (tab: "progress" | "catalog") => void
  initialValidation: ValidationResult
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}

export function PlannerSidebar({
  plans,
  completedUnits = 0,
  availableCourses,
  activeTab = "progress",
  onTabChange,
  initialValidation,
  isCollapsed,
  setIsCollapsed
}: PlannerSidebarProps) {
  const [mounted, setMounted] = useState(false)

  // Local state if not controlled, but we prefer controlled for the header button to work
  const [internalTab, setInternalTab] = useState<"progress" | "catalog">("progress")
  const currentTab = onTabChange ? activeTab : internalTab
  
  useEffect(() => {
      setMounted(true)
  }, [])
  
  // If controlled tab changes from outside, auto-expand
  useEffect(() => {
    if (activeTab && mounted && isCollapsed) {
        setIsCollapsed(false)
    }
  }, [activeTab, mounted])

  const handleTabChange = (tab: "progress" | "catalog") => {
      if (onTabChange) onTabChange(tab)
      else setInternalTab(tab)
      if (isCollapsed) setIsCollapsed(false)
  }

  // Progress Data Calculation
  const plannedUnits = plans.reduce(
    (total: number, plan) =>
      total + plan.plannedCourses.reduce((sum: number, item) => sum + item.course.units, 0),
    0
  )
  const totalUnits = (completedUnits || 0) + plannedUnits
  const requiredUnits = 120 

  // Search State
  const [searchTerm, setSearchTerm] = useState("")
  const filteredCourses = availableCourses.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={cn(
        "relative md:h-full transition-all duration-300 ease-in-out shrink-0 z-30 flex",
        isCollapsed ? "w-0" : "w-[340px]",
        "absolute right-0 h-[calc(100vh-65px)] md:relative"
    )}>
        {/* Collapsed State toggle removed, handled by PlannerBoard header */}

        <aside className={cn(
            "w-[340px] border-l border-[#DAD6CF] bg-white h-full flex flex-col font-sans transition-all duration-300 ease-in-out overflow-hidden shadow-[-4px_0_24px_rgba(0,0,0,0.02)] md:shadow-none",
            isCollapsed && "border-transparent opacity-0 pointer-events-none"
        )}>
            {/* Custom Tab Switcher */}
            <div className="flex border-b border-[#DAD6CF]">
                <button 
                    onClick={() => handleTabChange("progress")}
                    className={cn(
                        "flex-1 py-4 text-xs uppercase tracking-[0.1em] font-medium transition-colors flex items-center justify-center gap-2",
                        currentTab === "progress" 
                            ? "bg-[#F4F1ED] text-[#0A0A0A] shadow-[inset_0_-2px_0_#0A0A0A]" 
                            : "text-[#666460] hover:bg-[#F4F1ED]/50 hover:text-[#0A0A0A]"
                    )}
                >
                    <IconChartBar size={14} />
                    Progress
                </button>
                <div className="w-px bg-[#DAD6CF]" />
                <button 
                    onClick={() => handleTabChange("catalog")}
                    className={cn(
                        "flex-1 py-4 text-xs uppercase tracking-[0.1em] font-medium transition-colors flex items-center justify-center gap-2",
                        currentTab === "catalog" 
                            ? "bg-[#F4F1ED] text-[#0A0A0A] shadow-[inset_0_-2px_0_#0A0A0A]" 
                            : "text-[#666460] hover:bg-[#F4F1ED]/50 hover:text-[#0A0A0A]"
                    )}
                >
                    <IconBook size={14} />
                    Catalog
                </button>
            </div>

            {/* Tab Content: Progress */}
            {currentTab === "progress" && (
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
            )}

            {/* Tab Content: Catalog */}
            {currentTab === "catalog" && (
                <div className="flex-1 flex flex-col overflow-hidden w-[340px]">
                    <div className="p-6 border-b border-[#DAD6CF]">
                        <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666460]" />
                            <Input 
                                type="text" 
                                placeholder="Search courses..." 
                                className="pl-9 pr-8 h-10 text-sm bg-[#F4F1ED] border-none rounded-sm placeholder:text-[#666460]/70 focus-visible:ring-1 focus-visible:ring-[#0A0A0A]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button 
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666460] hover:text-[#0A0A0A]"
                                >
                                <IconX size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#F9F8F6] scrollbar-thin">
                        {filteredCourses.length > 0 ? (
                        filteredCourses.map(course => (
                            <DraggableCourseItem key={course.id} course={course} />
                        ))
                        ) : (
                        <div className="text-center py-12 text-[#666460] text-sm font-serif italic">
                            <p>No courses found</p>
                        </div>
                        )}
                    </div>
                </div>
            )}
        </aside>
    </div>
  )
}
