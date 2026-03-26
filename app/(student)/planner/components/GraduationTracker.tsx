"use client"

import { IconCheck, IconAlertTriangle } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface GraduationTrackerProps {
  totalUnits: number
  requiredUnits?: number
  completedUnits: number
  currentGpa?: number | null
  majorCourses?: number
  requiredMajorCourses?: number
}

function CircularProgress({ percentage, label, sublabel }: { percentage: number; label: string; sublabel: string }) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background Circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-[#EFECE7]"
        />
        {/* Progress Circle (black) */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-1000 ease-out",
            percentage >= 100 ? "text-green-600" : "text-[#0A0A0A]"
          )}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-serif italic text-3xl text-[#0A0A0A] leading-none mb-0.5">{label}</span>
        <span className="text-[10px] uppercase tracking-widest text-[#666460]">{sublabel}</span>
      </div>
    </div>
  )
}

export function GraduationTracker({
  totalUnits,
  requiredUnits = 120, // Default for most universities
  completedUnits,
  currentGpa,
  majorCourses = 0,
  requiredMajorCourses = 10,
}: GraduationTrackerProps) {
  const plannedUnits = totalUnits
  const totalWithCompleted = completedUnits + plannedUnits
  const remainingUnits = Math.max(0, requiredUnits - totalWithCompleted)
  
  const progressPercentage = Math.min(100, Math.round((totalWithCompleted / requiredUnits) * 100))
  
  // Requirement Definitions (Mocked for now, flexible for future)
  const requirements = [
    { 
        id: "core",
        label: "University Core", 
        completed: true, 
        progressText: "All constraints met",
        details: ["Writing Seminar (Done)", "Quantitative Reasoning (Done)", "Language (Done)"]
    },
    { 
        id: "major",
        label: "Major Requirements", 
        completed: majorCourses >= requiredMajorCourses, 
        progressText: `${majorCourses} / ${requiredMajorCourses} Courses`,
        details: ["Core Fundamentals", "Electives Focus Area", "Capstone Project"]
    },
    { 
        id: "electives",
        label: "General Electives", 
        completed: false, 
        progressText: "0 / 4 Courses",
        details: ["Any university level electives to meet the 120 credit requirement."]
    },
  ]

  return (
    <div className="space-y-6">
      
      {/* Visual Stats Row */}
      <div className="flex items-center gap-6 border-b border-[#DAD6CF] pb-6">
         <CircularProgress 
            percentage={progressPercentage} 
            label={totalWithCompleted.toString()} 
            sublabel={`/ ${requiredUnits}`} 
         />
         <div className="flex flex-col gap-4 flex-1">
            <div>
               <span className="block text-[10px] uppercase tracking-widest text-[#666460] mb-1">Current GPA</span>
               <div className="flex items-baseline gap-1">
                 <span className="font-serif italic text-2xl text-[#0A0A0A]">
                   {typeof currentGpa === "number" ? currentGpa.toFixed(2) : "N/A"}
                 </span>
               </div>
            </div>
            <div>
               <span className="block text-[10px] uppercase tracking-widest text-[#666460] mb-1">Academic Status</span>
               <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500" />
                   <span className="text-xs font-medium text-[#0A0A0A]">In Good Standing</span>
               </div>
            </div>
         </div>
      </div>

      {/* Alert / Insight Box */}
      {remainingUnits > 0 && (
         <div className="bg-[#0A0A0A] p-4 flex gap-3 items-start shadow-sm rounded-sm">
            <IconAlertTriangle size={16} className="text-[#F4F1ED] mt-0.5 shrink-0" />
            <p className="text-sm text-[#F4F1ED] leading-relaxed">
               You need <span className="font-semibold text-white">{remainingUnits} more units</span> to meet the minimum graduation requirement of {requiredUnits} units.
            </p>
         </div>
      )}

      {/* Degree Requirements Accordion List */}
      <div>
         <div className="flex items-center justify-between xl:justify-start lg:gap-3 mb-3">
            <h3 className="text-sm font-semibold text-[#0A0A0A]">Degree Requirements</h3>
            <span className="text-[10px] uppercase tracking-widest text-[#666460] xl:bg-[#F4F1ED] xl:px-2 xl:py-1 xl:rounded-sm">
                {requirements.filter(r => r.completed).length} / {requirements.length} Completed
            </span>
         </div>
         
         <Accordion type="single" collapsible className="w-full bg-white border border-[#DAD6CF] rounded-sm shadow-sm">
            {requirements.map((req) => (
                <AccordionItem 
                    value={req.id} 
                    key={req.id} 
                    className={cn(
                        "border-b border-[#DAD6CF] last:border-0",
                        req.completed && "bg-[#F9F8F6]"
                    )}
                >
                    <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-[#F4F1ED]/50 transition-colors data-[state=open]:bg-[#F4F1ED]">
                        <div className="flex items-center gap-3 w-full pr-2 text-left">
                            <div className={cn(
                                "flex items-center justify-center shrink-0 w-5 h-5 rounded-full border border-[#DAD6CF] bg-white transition-colors",
                                req.completed && "bg-[#0A0A0A] border-[#0A0A0A] text-white",
                            )}>
                                {req.completed ? <IconCheck size={12} stroke={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-[#DAD6CF]" />}
                            </div>
                            <div className="flex flex-col gap-0.5 flex-1 items-start">
                                <span className={cn(
                                    "text-sm font-medium",
                                    req.completed ? "text-[#666460]" : "text-[#0A0A0A]"
                                )}>{req.label}</span>
                                <span className="text-[10px] text-[#0A0A0A] uppercase tracking-wider font-semibold opacity-70">
                                    {req.progressText}
                                </span>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-3 bg-white border-t border-[#DAD6CF]/50">
                        <ul className="space-y-2">
                            {req.details.map((detail, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-xs text-[#666460]">
                                    <div className="w-1 h-1 rounded-full bg-[#0A0A0A]/30 shrink-0" />
                                    <span>{detail}</span>
                                </li>
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            ))}
         </Accordion>
      </div>

    </div>
  )
}
