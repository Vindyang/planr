"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { GraduationTracker } from "./GraduationTracker"
import { ValidationPanel } from "./ValidationPanel"
import { Separator } from "@/components/ui/separator"
import { IconChartBar } from "@tabler/icons-react"
import { Prisma } from "@prisma/client"
import type { ValidationResult } from "@/lib/planner/types"

type Plan = Prisma.semesterPlanGetPayload<{
  include: { plannedCourses: { include: { course: true } } }
}>


interface PlannerProgressSheetProps {
  plans: Plan[]
  completedUnits?: number
  initialValidation?: ValidationResult
}

export function PlannerProgressSheet({ plans, completedUnits = 0, initialValidation }: PlannerProgressSheetProps) {
  const plannedUnits = plans.reduce(
    (total: number, plan) =>
      total + plan.plannedCourses.reduce((sum: number, item) => sum + item.course.units, 0),
    0
  )
  const totalUnits = (completedUnits || 0) + plannedUnits
  const requiredUnits = 120 // Default

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all group">
          <IconChartBar className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-serif italic text-muted-foreground group-hover:text-foreground">
             Progress: <span className="font-semibold not-italic font-sans text-foreground">{totalUnits}/{requiredUnits} Units</span>
          </span>
          <span className="sm:hidden">Progress</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="font-serif text-2xl">Academic Progress</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-8 pb-10">
            <GraduationTracker
                totalUnits={plannedUnits}
                completedUnits={completedUnits}
                requiredUnits={requiredUnits}
            />
            {initialValidation && <ValidationPanel initialValidation={initialValidation} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
