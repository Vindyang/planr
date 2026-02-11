"use client"

import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { IconSearch, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area" 

type DrawerCourse = {
  id: string
  code: string
  title: string
  units: number
}

// Draggable Item Wrapper for Drawer
function DraggableDrawerItem({ course }: { course: DrawerCourse }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `drawer-${course.id}`, // specific ID to know it's from drawer
    data: {
      type: "new-course",
      courseId: course.id,
      code: course.code,
      title: course.title,
      units: course.units
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-50 border p-3 rounded-md bg-muted">
         <div className="font-bold text-sm">{course.code}</div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="p-3 bg-card border border-border/60 rounded-md shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group transition-all"
    >
      <div className="flex justify-between items-start mb-1">
          <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{course.code}</div>
          <Badge variant="outline" className="text-[10px] px-1 h-5 text-muted-foreground bg-secondary/30 border-0">{course.units} U</Badge>
      </div>
      <div className="text-xs text-muted-foreground truncate">{course.title}</div>
    </div>
  )
}

type CourseDrawerProps = {
  availableCourses: DrawerCourse[]
}

export function CourseDrawer({ availableCourses }: CourseDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCourses = availableCourses.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-border space-y-3">
        <h2 className="font-semibold text-sm text-foreground">Course Catalog</h2>
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search courses..." 
            className="pl-9 pr-8 h-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/10">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <DraggableDrawerItem key={course.id} course={course} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p>No courses found</p>
            <p className="text-xs opacity-70 mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  )
}
