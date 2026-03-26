"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { IconCheck, IconX, IconMinus, IconListCheck, IconArrowRight, IconRoute, IconLock } from "@tabler/icons-react"
import { CHECKLIST_KEYS, getChecklistState } from "./checklistTracking"
import type { TourType } from "./tourSteps"

const STEPS = [
  { key: "VISITED_COURSES" as const, label: "Browse the course catalog", href: "/courses", pendingTour: "browse-courses" as TourType },
  { key: "CREATED_TERM" as const, label: "Create your first semester", href: "/planner", pendingTour: "create-term" as TourType },
  { key: "ADDED_COURSE" as const, label: "Add a course to your plan", href: "/planner", pendingTour: "add-course" as TourType },
]

export function OnboardingChecklist() {
  const [done, setDone] = useState({ VISITED_COURSES: false, CREATED_TERM: false, ADDED_COURSE: false })
  const [isDismissed, setIsDismissed] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const state = getChecklistState()
    if (state.DISMISSED) {
      setIsDismissed(true)
      return
    }
    setDone({ VISITED_COURSES: state.VISITED_COURSES, CREATED_TERM: state.CREATED_TERM, ADDED_COURSE: state.ADDED_COURSE })

    const onUpdate = () => {
      const s = getChecklistState()
      setDone({ VISITED_COURSES: s.VISITED_COURSES, CREATED_TERM: s.CREATED_TERM, ADDED_COURSE: s.ADDED_COURSE })
    }
    window.addEventListener("planr_checklist_update", onUpdate)
    return () => window.removeEventListener("planr_checklist_update", onUpdate)
  }, [])

  if (!mounted || isDismissed) return null

  const completedCount = STEPS.filter((s) => done[s.key]).length
  const allDone = completedCount === STEPS.length

  // Auto-hide after all done — show a brief celebration then fade
  if (allDone) return null

  const handleDismiss = () => {
    localStorage.setItem(CHECKLIST_KEYS.DISMISSED, "true")
    setIsDismissed(true)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#0A0A0A] text-white px-4 h-10 text-xs uppercase tracking-[0.1em] font-medium hover:bg-[#0A0A0A]/90 transition-colors shadow-lg"
      >
        <IconListCheck size={16} stroke={1.5} />
        <span>Getting Started ({completedCount}/3)</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-72 bg-white border border-[#DAD6CF] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#DAD6CF] bg-[#F4F1ED]">
        <div>
          <p className="text-xs uppercase tracking-[0.1em] font-medium text-[#0A0A0A]">
            Getting Started
          </p>
          <p className="text-xs text-[#666460] mt-0.5">{completedCount} of 3 complete</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-[#DAD6CF]/60 transition-colors"
            aria-label="Minimise"
          >
            <IconMinus size={14} stroke={1.5} className="text-[#666460]" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-[#DAD6CF]/60 transition-colors"
            aria-label="Dismiss"
          >
            <IconX size={14} stroke={1.5} className="text-[#666460]" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-[#DAD6CF]">
        <div
          className="h-full bg-[#0A0A0A] transition-all duration-500"
          style={{ width: `${(completedCount / 3) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="p-5 space-y-2">
        {STEPS.map(({ key, label, href, pendingTour }) => {
          const isDone = done[key]
          const isLocked = key === "ADDED_COURSE" && !done.CREATED_TERM
          return (
            <div key={key} className={`flex items-center gap-3 group ${isLocked ? "opacity-40" : ""}`}>
              <div
                className={`w-5 h-5 shrink-0 flex items-center justify-center border transition-colors ${
                  isDone ? "bg-[#0A0A0A] border-[#0A0A0A]" : "border-[#DAD6CF] bg-white"
                }`}
              >
                {isDone && <IconCheck size={11} stroke={2.5} className="text-white" />}
                {isLocked && !isDone && <IconLock size={9} stroke={2} className="text-[#999693]" />}
              </div>
              <span
                className={`flex-1 text-xs leading-snug ${
                  isDone ? "line-through text-[#999693]" : "text-[#0A0A0A]"
                }`}
              >
                {label}
              </span>
              {!isDone && !isLocked && (
                <Link
                  href={`${href}?tour=${pendingTour}`}
                  className="p-1 text-[#666460] hover:text-[#0A0A0A] transition-colors"
                  aria-label={`Go to ${label}`}
                >
                  <IconArrowRight size={18} stroke={2.5} />
                </Link>
              )}
            </div>
          )
        })}

        {/* Take a tour CTA */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("planr_start_tour"))}
          className="w-full mt-2 flex items-center justify-center gap-2 border border-[#DAD6CF] py-2.5 text-xs uppercase tracking-[0.1em] font-medium text-[#666460] hover:text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors"
        >
          <IconRoute size={14} stroke={1.5} />
          Take a tour
        </button>
      </div>
    </div>
  )
}
