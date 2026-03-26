"use client"

import { useEffect, useState, useCallback } from "react"
import { IconArrowLeft, IconArrowRight, IconX } from "@tabler/icons-react"
import { getStepsForTourType, type TourType } from "./tourSteps"

type Rect = { top: number; left: number; width: number; height: number }

const PADDING = 10
const TOOLTIP_WIDTH = 288
const GAP = 16

function getTooltipStyle(
  rect: Rect,
  placement: "right" | "left" | "bottom" | "top",
  viewportW: number,
  viewportH: number
): React.CSSProperties {
  switch (placement) {
    case "right": {
      const left = rect.left + rect.width + GAP
      // Clamp top so tooltip doesn't go off-screen
      const top = Math.max(
        8,
        Math.min(rect.top + rect.height / 2 - 80, viewportH - 220)
      )
      // If not enough space on right, flip to left
      if (left + TOOLTIP_WIDTH > viewportW - 8) {
        return { top, right: viewportW - rect.left + GAP }
      }
      return { top, left }
    }
    case "left": {
      const top = Math.max(8, Math.min(rect.top + rect.height / 2 - 80, viewportH - 220))
      return { top, right: viewportW - rect.left + GAP }
    }
    case "bottom": {
      return {
        top: rect.top + rect.height + GAP,
        left: Math.max(8, Math.min(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, viewportW - TOOLTIP_WIDTH - 8)),
      }
    }
    case "top": {
      return {
        bottom: viewportH - rect.top + GAP,
        left: Math.max(8, Math.min(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, viewportW - TOOLTIP_WIDTH - 8)),
      }
    }
  }
}

export function TourOverlay({
  onClose,
  initialStep = 0,
  tourType = "overview",
}: {
  onClose: () => void
  initialStep?: number
  tourType?: TourType
}) {
  const steps = getStepsForTourType(tourType)
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [rect, setRect] = useState<Rect | null>(null)
  const [viewport, setViewport] = useState({ w: typeof window !== "undefined" ? window.innerWidth : 0, h: typeof window !== "undefined" ? window.innerHeight : 0 })

  const step = steps[currentStep]

  const updateRect = useCallback(() => {
    const el = document.querySelector(`[data-tour-id="${step.id}"]`)
    if (el) {
      const r = el.getBoundingClientRect()
      setRect({
        top: r.top - PADDING,
        left: r.left - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      })
    } else {
      setRect(null)
    }
    setViewport({ w: window.innerWidth, h: window.innerHeight })
  }, [step.id])

  useEffect(() => {
    // Retry finding the element — page may still be rendering after navigation
    let attempts = 0
    const MAX_ATTEMPTS = 10
    const tryFind = () => {
      const el = document.querySelector(`[data-tour-id="${step.id}"]`)
      if (el) {
        updateRect()
      } else if (attempts < MAX_ATTEMPTS) {
        attempts++
        setTimeout(tryFind, 150)
      }
    }
    tryFind()
    window.addEventListener("resize", updateRect)
    return () => window.removeEventListener("resize", updateRect)
  }, [updateRect, step.id])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight" && currentStep < steps.length - 1) setCurrentStep((s) => s + 1)
      if (e.key === "ArrowLeft" && currentStep > 0) setCurrentStep((s) => s - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, currentStep])

  const isLast = currentStep === steps.length - 1
  const isFirst = currentStep === 0

  // Spotlight clip-path: cuts a rectangular hole for the highlighted element
  const clipPath = rect
    ? `polygon(
        0% 0%,
        0% 100%,
        ${rect.left}px 100%,
        ${rect.left}px ${rect.top}px,
        ${rect.left + rect.width}px ${rect.top}px,
        ${rect.left + rect.width}px ${rect.top + rect.height}px,
        ${rect.left}px ${rect.top + rect.height}px,
        ${rect.left}px 100%,
        100% 100%,
        100% 0%
      )`
    : undefined

  // If element not found, center the tooltip on screen as fallback
  const tooltipStyle =
    viewport.w > 0
      ? rect
        ? getTooltipStyle(rect, step.placement, viewport.w, viewport.h)
        : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
      : undefined

  return (
    <>
      {/* Spotlight backdrop — has a hole cut out over the target element */}
      <div
        className="fixed inset-0 bg-black/60 pointer-events-none"
        style={{ zIndex: 9998, clipPath }}
      />

      {/* Highlight ring around the target element */}
      {rect && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: 9999,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 2px #ffffff, 0 0 0 5px rgba(255,255,255,0.25)",
            borderRadius: 2,
          }}
        />
      )}

      {/* Clickable backdrop to close */}
      <div
        className="fixed inset-0 cursor-pointer"
        style={{ zIndex: 9997 }}
        onClick={onClose}
      />

      {/* Tooltip card */}
      {tooltipStyle && (
        <div
          className="fixed w-72 bg-white border border-[#DAD6CF] shadow-2xl"
          style={{ zIndex: 10000, ...tooltipStyle }}
        >
          {/* Step indicator + close */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <span className="text-xs uppercase tracking-[0.1em] font-medium text-[#666460]">
              {currentStep + 1} / {steps.length}
            </span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#F4F1ED] transition-colors"
              aria-label="Close tour"
            >
              <IconX size={14} stroke={1.5} className="text-[#666460]" />
            </button>
          </div>

          {/* Step dot progress */}
          <div className="flex gap-1.5 px-5 mb-4">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1 flex-1 transition-colors ${
                  i === currentStep ? "bg-[#0A0A0A]" : i < currentStep ? "bg-[#DAD6CF]" : "bg-[#F4F1ED]"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="px-5 pb-5">
            <p className="text-sm font-medium text-[#0A0A0A] mb-1.5">{step.title}</p>
            <p className="text-xs text-[#666460] leading-relaxed">{step.description}</p>
          </div>

          {/* Navigation */}
          <div className="flex border-t border-[#DAD6CF]">
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={isFirst}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs uppercase tracking-[0.1em] font-medium text-[#666460] hover:bg-[#F4F1ED] disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-[#DAD6CF]"
            >
              <IconArrowLeft size={14} stroke={2} />
              Back
            </button>
            <button
              onClick={isLast ? onClose : () => setCurrentStep((s) => s + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs uppercase tracking-[0.1em] font-medium text-[#0A0A0A] hover:bg-[#F4F1ED] transition-colors"
            >
              {isLast ? "Done" : "Next"}
              {!isLast && <IconArrowRight size={14} stroke={2} />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
