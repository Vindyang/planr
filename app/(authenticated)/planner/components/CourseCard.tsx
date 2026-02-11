"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card" // Removing shadcn card for custom flat style
import { Badge } from "@/components/ui/badge"

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

  // Use translate3d for performance, but careful with blurriness
  const style = {
    transform: CSS.Translate.toString(transform),
  }

  // Common card content - mimics the "Weekly Schedule" white blocks
  // e.g. <div className="bg-white p-2 text-xs border-l-2 border-[#0A0A0A]">
  const CardBody = () => (
    <div className={cn(
        "bg-white p-3 text-xs border-l-2 border-[#0A0A0A] shadow-sm",
        error ? "border-l-[#ef4444] bg-[#fff5f5]" : ""
    )}>
      <div className="flex justify-between items-start gap-2 mb-1">
          <span className="font-semibold text-[#0A0A0A]">{code}</span>
          <span className="text-[0.65rem] text-[#666460] font-medium bg-[#F4F1ED] px-1.5 py-0.5 rounded-sm">{units} CU</span>
      </div>
      <div className="text-[#666460] leading-tight text-[0.75rem]">{title}</div>
      
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
        <CardBody />
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
        <CardBody />
      </div>
    </div>
  )
}
