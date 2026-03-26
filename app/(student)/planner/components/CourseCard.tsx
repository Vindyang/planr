"use client"

import { useSyncExternalStore } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

type CourseCardProps = {
  id: string
  code: string
  title: string
  units: number
  isOverlay?: boolean
  error?: string
  isSelectionMode?: boolean
  isSelected?: boolean
  onToggleSelection?: (courseId: string) => void
}

export function CourseCard({ id, code, title, units, isOverlay, error, isSelectionMode = false, isSelected = false, onToggleSelection }: CourseCardProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: {
      type: "course",
      code,
      title,
      units,
      origin: "board" // Distinction if we want to differentiate from drawer
    },
  })

  // Use translate3d for performance, but careful with blurriness
  const style = {
    transform: CSS.Translate.toString(transform),
  }

  // Common card content - mimics the "Weekly Schedule" white blocks
  // e.g. <div className="bg-white p-2 text-xs border-l-2 border-[#0A0A0A]">
  const cardBody = (
    <div className={cn(
        "bg-white p-3 text-xs border-l-2 shadow-sm transition-all",
        error ? "border-l-[#ef4444] bg-[#fff5f5]" : "",
        isSelectionMode ? (isSelected ? "border-l-[#0A0A0A] bg-[#0A0A0A]/5 border-2" : "border-l-[#DAD6CF] hover:border-l-[#0A0A0A]/30") : "border-l-[#0A0A0A]"
    )}>
      <div className="flex justify-between items-start gap-2 mb-1">
          <div className="flex items-center gap-2">
              {isSelectionMode && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSelection?.(id)
                  }}
                  className="flex items-center cursor-pointer p-0.5 -m-0.5"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    className="w-4 h-4 rounded border-[#DAD6CF] text-[#0A0A0A] focus:ring-[#0A0A0A] focus:ring-offset-0 cursor-pointer pointer-events-none"
                    readOnly
                  />
                </div>
              )}
              <span className="font-semibold text-[#0A0A0A]">{code}</span>
          </div>
          <span className="text-[0.65rem] text-[#666460] font-medium bg-[#F4F1ED] px-1.5 py-0.5 rounded-sm">{units} CU</span>
      </div>
      <div className={cn(
        "text-[#666460] leading-tight text-[0.75rem]",
        isSelectionMode && "ml-5"
      )}>{title}</div>

      {error && (
        <div className="mt-2 text-[0.65rem] text-[#ef4444] font-medium">
          {error}
        </div>
      )}
    </div>
  )

  if (isOverlay) {
    return (
      <div className="w-full shadow-xl rotate-2 cursor-grabbing">
        {cardBody}
      </div>
    )
  }

  // In selection mode, make the card clickable instead of draggable
  if (isSelectionMode) {
    return (
      <div
        onClick={() => onToggleSelection?.(id)}
        className={cn(
          "group relative w-full outline-none mb-2 cursor-pointer"
        )}
      >
        <div className="hover:translate-x-1 transition-transform">
          {cardBody}
        </div>
      </div>
    )
  }

  // Avoid hydration mismatch from dnd-kit generated accessibility IDs on initial SSR.
  if (!mounted) {
    return (
      <div className="group relative w-full touch-none outline-none mb-2 opacity-100">
        <div className="hover:translate-x-1 transition-transform cursor-grab active:cursor-grabbing">
          {cardBody}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative w-full touch-none outline-none mb-2",
        isDragging ? "opacity-30" : "opacity-100"
      )}
    >
      <div className="hover:translate-x-1 transition-transform cursor-grab active:cursor-grabbing">
        {cardBody}
      </div>
    </div>
  )
}
