"use client"

import { IconCheck, IconCircle, IconAlertTriangle } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface GraduationTrackerProps {
  totalUnits: number
  requiredUnits?: number
  completedUnits: number
  majorCourses?: number
  requiredMajorCourses?: number
}

export function GraduationTracker({
  totalUnits,
  requiredUnits = 120, // Default for most universities
  completedUnits,
  majorCourses = 0,
  requiredMajorCourses = 10,
}: GraduationTrackerProps) {
  const plannedUnits = totalUnits
  const totalWithCompleted = completedUnits + plannedUnits
  const remainingUnits = Math.max(0, requiredUnits - totalWithCompleted)
  
  // Requirement Definitions (Mocked for now, flexible for future)
  const requirements = [
    { label: "University Core", completed: true, icon: IconCheck },
    { label: "Major Requirements", completed: majorCourses >= requiredMajorCourses, icon: majorCourses >= requiredMajorCourses ? IconCheck : IconCircle },
    { label: "General Electives", completed: false, icon: IconCircle },
  ]

  return (
    <div className="space-y-8">
      
      {/* Editorial Stats Row */}
      <div className="grid grid-cols-2 gap-4 border-b border-[#DAD6CF] pb-8">
        <div>
           <span className="block text-[10px] uppercase tracking-widest text-[#666460] mb-2">Units Earned</span>
           <div className="flex items-baseline gap-1">
             <span className="font-serif italic text-4xl text-[#0A0A0A]">{totalWithCompleted}</span>
             <span className="text-xs text-[#666460] font-medium">/ {requiredUnits}</span>
           </div>
        </div>
        <div>
           <span className="block text-[10px] uppercase tracking-widest text-[#666460] mb-2">Current GPA</span>
           <div className="flex items-baseline gap-1">
             <span className="font-serif italic text-4xl text-[#0A0A0A]">3.8</span>
           </div>
        </div>
      </div>

      {/* Degree Requirements List */}
      <div>
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#0A0A0A]">Degree Requirements</h3>
            <span className="text-[10px] uppercase tracking-widest text-[#666460]">
                {requirements.filter(r => r.completed).length} / {requirements.length} Completed
            </span>
         </div>
         
         <div className="space-y-px bg-[#DAD6CF] border border-[#DAD6CF]">
            {requirements.map((req, i) => (
                <div key={i} className="flex items-center justify-between bg-white p-4 h-14">
                    <span className="text-xs font-medium text-[#0A0A0A]">{req.label}</span>
                    <req.icon 
                        size={16} 
                        className={cn(
                            req.completed ? "text-[#0A0A0A]" : "text-[#DAD6CF]"
                        )} 
                        stroke={1.5}
                    />
                </div>
            ))}
             {/* Dynamic Major Count Row */}
             <div className="flex items-center justify-between bg-white p-4 h-14">
                <span className="text-xs font-medium text-[#0A0A0A]">Major Courses</span>
                <span className="font-serif italic text-sm text-[#666460]">
                    {majorCourses} / {requiredMajorCourses}
                </span>
             </div>
         </div>
      </div>

      {/* Alert / Insight Box */}
      {remainingUnits > 0 && (
         <div className="bg-[#F4F1ED] p-4 border border-[#DAD6CF] flex gap-3 items-start">
            <IconAlertTriangle size={16} className="text-[#666460] mt-0.5 shrink-0" />
            <p className="text-xs text-[#666460] leading-relaxed">
               You need <span className="font-semibold text-[#0A0A0A]">{remainingUnits} more units</span> to meet the minimum graduation requirement of {requiredUnits} units.
            </p>
         </div>
      )}

    </div>
  )
}

