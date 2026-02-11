"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
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

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  // Common card content
  const CardBody = () => (
    <div className="flex flex-col gap-1 p-3">
      <div className="flex justify-between items-start gap-2">
        <div className="font-bold text-sm text-foreground">{code}</div>
        <Badge variant="secondary" className="text-[10px] px-1 h-5 whitespace-nowrap">
          {units} U
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground line-clamp-2 leading-tight">{title}</div>
      {error && (
        <div className="mt-2 text-[10px] text-destructive font-medium bg-destructive/10 p-1 rounded">
          {error}
        </div>
      )}
    </div>
  )

  if (isOverlay) {
    return (
      <Card className="w-full shadow-xl ring-2 ring-primary/20 rotate-2 cursor-grabbing bg-card">
        <CardBody />
      </Card>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative w-full touch-none outline-none",
        isDragging ? "opacity-30" : "opacity-100"
      )}
    >
      <Card 
        className={cn(
          "hover:shadow-md transition-all cursor-grab active:cursor-grabbing border-border/60",
          error && "border-destructive/50 bg-destructive/5"
        )}
      >
        <CardBody />
      </Card>
    </div>
  )
}
