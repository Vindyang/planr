"use client"

import { SemesterCard } from "./SemesterCard"
import { Prisma } from "@prisma/client"

type PlannedCourseWithCourse = Prisma.plannedCourseGetPayload<{
  include: { course: true }
}>

type SemesterPlanWithCourses = Prisma.semesterPlanGetPayload<{
    include: { plannedCourses: { include: { course: true } } }
}>

import { IconPlus } from "@tabler/icons-react"
import { CreateSemesterDialog } from "./CreateSemesterDialog"

type YearSectionProps = {
  year: number
  plans: SemesterPlanWithCourses[]
  onRemoveCourse: (id: string) => void
  onDeletePlan: (id: string) => void
  onCreatePlan: (term: string, year: number) => Promise<void>
}

export function YearSection({ year, plans, onRemoveCourse, onDeletePlan, onCreatePlan }: YearSectionProps) {
  // Sort plans: Fall -> Winter -> Spring -> Summer
  const termOrder: Record<string, number> = { "Fall": 1, "Winter": 2, "Spring": 3, "Summer": 4 }
  
  const sortedPlans = [...plans].sort((a, b) => {
      return (termOrder[a.term] || 99) - (termOrder[b.term] || 99)
  })

  // Calculate default term for next semester based on existing plans
  const getNextTerm = () => {
      const terms = ["Fall", "Winter", "Spring", "Summer"]
      if (sortedPlans.length === 0) return "Fall"
      const lastTerm = sortedPlans[sortedPlans.length - 1].term
      const idx = terms.indexOf(lastTerm)
      if (idx === -1 || idx === terms.length - 1) return "Fall"
      return terms[idx + 1]
  }

  return (
    <div className="mb-16">
      <span className="uppercase text-xs tracking-[0.1em] font-medium border-b border-[#DAD6CF] pb-3 mb-8 block text-[#0A0A0A]">
          Academic Year {year}
      </span>
      
      <div className={`grid grid-cols-1 md:grid-cols-${Math.min(sortedPlans.length, 4) || 1} lg:grid-cols-${Math.min(sortedPlans.length, 4) || 1} xl:grid-cols-${Math.min(sortedPlans.length, 4) || 1} gap-[1px] bg-[#DAD6CF] border border-[#DAD6CF]`}>
        {sortedPlans.map(plan => (
           <SemesterCard
             key={plan.id}
             planId={plan.id}
             term={plan.term}
             year={plan.year}
             courses={plan.plannedCourses}
             onRemoveCourse={onRemoveCourse}
             onDeletePlan={onDeletePlan}
             totalUnits={plan.plannedCourses.reduce((sum, item) => sum + item.course.units, 0)}
           />
        ))}


      </div>
    </div>
  )
}
