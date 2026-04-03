"use client"

import { SemesterCard } from "./SemesterCard"
import { Prisma } from "@prisma/client"

type SemesterPlanWithCourses = Prisma.semesterPlanGetPayload<{
    include: { plannedCourses: { include: { course: true } } }
}>

import { IconPlus } from "@tabler/icons-react"

type YearSectionProps = {
  year: number
  plans: SemesterPlanWithCourses[]
  onRemoveCourse: (id: string) => void
  onDeletePlan: (id: string) => void
  onCreatePlan: (term: string, year: number) => Promise<void>
  isSelectionMode: boolean
  selectedCourses: Set<string>
  onToggleSelection: (courseId: string) => void
  isMutating: boolean
  deletingCourseId: string | null
  deletingPlanId: string | null
}

export function YearSection({ year, plans, onRemoveCourse, onDeletePlan, onCreatePlan, isSelectionMode, selectedCourses, onToggleSelection, isMutating, deletingCourseId, deletingPlanId }: YearSectionProps) {
  // Sort plans: Term 1 -> Term 2 -> Term 3
  const termOrder: Record<string, number> = { "Term 1": 1, "Term 2": 2, "Term 3": 3 }
  
  const sortedPlans = [...plans].sort((a, b) => {
      return (termOrder[a.term] || 99) - (termOrder[b.term] || 99)
  })

  // Calculate default term for next term based on existing plans
  const getNextTerm = () => {
      const terms = ["Term 1", "Term 2", "Term 3"]
      if (sortedPlans.length === 0) return "Term 1"
      const lastTerm = sortedPlans[sortedPlans.length - 1].term
      const idx = terms.indexOf(lastTerm)
      if (idx === -1 || idx === terms.length - 1) return "Term 1"
      return terms[idx + 1]
  }

  return (
    <div className="mb-16">
      <span className="uppercase text-xs tracking-[0.1em] font-medium border-b border-[#DAD6CF] pb-3 mb-8 block text-[#0A0A0A]">
          Academic Year {year}
      </span>
      
      {/* Calculate grid columns: existing plans + 1 for add button (if < 4) */}
      <div className={`grid grid-cols-1 md:grid-cols-${Math.min(sortedPlans.length + (sortedPlans.length < 4 ? 1 : 0), 4) || 1} lg:grid-cols-${Math.min(sortedPlans.length + (sortedPlans.length < 4 ? 1 : 0), 4) || 1} xl:grid-cols-${Math.min(sortedPlans.length + (sortedPlans.length < 4 ? 1 : 0), 4) || 1} gap-[1px] bg-[#DAD6CF] border border-[#DAD6CF]`}>
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
             isSelectionMode={isSelectionMode}
             selectedCourses={selectedCourses}
             onToggleSelection={onToggleSelection}
             isMutating={isMutating}
             deletingCourseId={deletingCourseId}
             deletingPlanId={deletingPlanId}
           />
        ))}

        {/* Add Term Button - Only show if less than 4 terms */}
        {sortedPlans.length < 4 && (
            <button
                onClick={() => onCreatePlan(getNextTerm(), year)}
                className="bg-[#F4F1ED] p-6 h-full min-h-[280px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#E5E2DE] transition-colors group w-full disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isMutating}
            >
                <div className="w-12 h-12 rounded-full border border-[#DAD6CF] bg-white flex items-center justify-center text-[#DAD6CF] group-hover:text-[#0A0A0A] group-hover:border-[#0A0A0A] transition-all mb-4">
                    <IconPlus size={24} stroke={1.5} />
                </div>
                <span className="text-xs uppercase tracking-[0.1em] font-medium text-[#666460] group-hover:text-[#0A0A0A] transition-colors">
                    {isMutating ? "Creating..." : "Add Term"}
                </span>
            </button>
        )}
      </div>
    </div>
  )
}
