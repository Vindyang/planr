"use client"

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
}

export function CourseCard({ id, code, title, units, isOverlay, error }: CourseCardProps) {
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

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  if (isOverlay) {
    return (
      <div className="w-full rounded-md border bg-white p-3 shadow-lg ring-2 ring-blue-500 opacity-90 cursor-grabbing">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-bold text-sm text-gray-900">{code}</div>
            <div className="text-xs text-gray-500 line-clamp-1">{title}</div>
          </div>
          <div className="text-xs font-semibold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
            {units} U
          </div>
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
        "group relative w-full rounded-md border bg-white p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30",
        error && "border-red-300 bg-red-50"
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-sm text-gray-900">{code}</div>
          <div className="text-xs text-gray-500 line-clamp-1">{title}</div>
        </div>
        <div className="text-xs font-semibold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
          {units} U
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-[10px] text-red-600 font-medium">
          {error}
        </div>
      )}
    </div>
  )
}
