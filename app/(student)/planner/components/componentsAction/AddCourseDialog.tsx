import * as React from "react"
import { IconPlus, IconArrowLeft, IconCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

type AvailableCourse = {
  id: string
  code: string
  title: string
  units: number
}

type SemesterPlanOption = {
  id: string
  term: string
  year: number
  plannedCourses: Array<{ id: string }>
}

interface AddCourseDialogProps {
  availableCourses: AvailableCourse[]
  plannedCourseIds: Set<string>
  semesterPlans: SemesterPlanOption[]
  onAddCourse: (planId: string, courseId: string) => void
  onAddCourses: (planId: string, courseIds: string[]) => void
}

export function AddCourseDialog({
  availableCourses,
  plannedCourseIds,
  semesterPlans,
  onAddCourse,
  onAddCourses,
}: AddCourseDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = React.useState<Set<string>>(new Set())
  const [step, setStep] = React.useState<"courses" | "semesters">("courses")

  // Reset state when dialog fully closes
  React.useEffect(() => {
    if (!open) {
      // small delay to let exit animation finish before changing content
      setTimeout(() => {
          setSelectedCourseIds(new Set())
          setStep("courses")
      }, 300)
    }
  }, [open])

  // Listen for global open events
  React.useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener("planr_open_add_course", onOpen)
    return () => window.removeEventListener("planr_open_add_course", onOpen)
  }, [])

  // Filter out courses that are already planned
  const eligibleCourses = React.useMemo(() => {
    return availableCourses.filter((course) => !plannedCourseIds.has(course.id))
  }, [availableCourses, plannedCourseIds])

  // Sort plans logically Term 1 -> Term 2 -> Term 3, and by Year
  const sortedPlans = React.useMemo(() => {
    const termOrder: Record<string, number> = { "Term 1": 1, "Term 2": 2, "Term 3": 3 }
    return [...semesterPlans].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return (termOrder[a.term] || 99) - (termOrder[b.term] || 99)
    })
  }, [semesterPlans])

  const toggleCourse = (courseId: string) => {
      setSelectedCourseIds(prev => {
          const next = new Set(prev)
          if (next.has(courseId)) {
              next.delete(courseId)
          } else {
              next.add(courseId)
          }
          return next
      })
  }

  const handleContinue = () => {
      if (selectedCourseIds.size > 0) {
          setStep("semesters")
      }
  }

  return (
    <>
      {/* Headless dialog triggered by custom event */}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
        {step === "courses" ? (
            <div className="flex flex-col h-full">
                <CommandInput 
                    placeholder="Search catalog by course code or title..." 
                />
                <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                <CommandEmpty>No courses found.</CommandEmpty>
                <CommandGroup heading="Available Courses">
                    {eligibleCourses.map((course) => {
                        const isSelected = selectedCourseIds.has(course.id)
                        return (
                            <CommandItem
                                key={course.id}
                                value={`${course.code} ${course.title}`}
                                onSelect={() => toggleCourse(course.id)}
                                className={cn(
                                    "flex items-center gap-3 py-3 cursor-pointer",
                                    isSelected && "bg-[#F4F1ED]" // optional visual highlight
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                                    isSelected ? "bg-[#0A0A0A] border-[#0A0A0A] text-white" : "border-[#DAD6CF] bg-white"
                                )}>
                                    {isSelected && <IconCheck size={12} stroke={3} />}
                                </div>
                                <div className="flex flex-col items-start gap-1 flex-1">
                                    <div className="flex w-full justify-between items-center">
                                        <span className="font-bold text-sm text-[#0A0A0A]">{course.code}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-[#F4F1ED] text-[#666460] rounded-sm font-medium">{course.units} U</span>
                                    </div>
                                    <span className="text-xs text-[#666460] line-clamp-1">{course.title}</span>
                                </div>
                            </CommandItem>
                        )
                    })}
                </CommandGroup>
                </CommandList>
                {selectedCourseIds.size > 0 && (
                    <div className="p-3 bg-white border-t border-[#DAD6CF] mt-auto">
                        <Button 
                            className="w-full bg-[#0A0A0A] text-white hover:bg-[#0A0A0A]/90"
                            onClick={handleContinue}
                        >
                            Continue ({selectedCourseIds.size} selected)
                        </Button>
                    </div>
                )}
            </div>
        ) : (
            <>
                <div className="flex items-center border-b px-3 gap-2 py-2">
                    <button 
                         onClick={() => setStep("courses")}
                         className="p-1 hover:bg-[#F4F1ED] rounded-sm transition-colors text-[#666460] hover:text-[#0A0A0A]"
                    >
                        <IconArrowLeft size={16} />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Select Term</span>
                        <span className="text-sm font-medium">Adding {selectedCourseIds.size} {selectedCourseIds.size === 1 ? 'course' : 'courses'}</span>
                    </div>
                </div>
                <div className="flex items-center border-b px-3" style={{ display: 'none' }}>
                    {/* Hidden input to keep Command component happy and focusable */}
                    <CommandInput value="" onValueChange={() => {}} />
                </div>
                <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                <CommandEmpty>No terms found.</CommandEmpty>
                <CommandGroup heading="Select a Term">
                    {sortedPlans.length > 0 ? sortedPlans.map((plan) => (
                    <CommandItem
                        key={plan.id}
                        value={`${plan.term} ${plan.year}`}
                        onSelect={() => {
                            if (selectedCourseIds.size === 1) {
                                onAddCourse(plan.id, Array.from(selectedCourseIds)[0])
                            } else {
                                onAddCourses(plan.id, Array.from(selectedCourseIds))
                            }
                            setOpen(false)
                        }}
                        className="flex py-3 cursor-pointer items-center justify-between"
                    >
                        <span className="font-medium text-sm text-[#0A0A0A]">{plan.term} {plan.year}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">{plan.plannedCourses.length} Courses</span>
                    </CommandItem>
                    )) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            You have not created any terms yet.
                        </div>
                    )}
                </CommandGroup>
                </CommandList>
            </>
        )}
        </Command>
      </CommandDialog>
    </>
  )
}
