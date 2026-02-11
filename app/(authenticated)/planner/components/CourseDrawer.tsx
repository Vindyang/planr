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
      <div ref={setNodeRef} style={style} className="opacity-80 border p-4 rounded-sm bg-background shadow-lg w-full">
         <div className="font-bold text-sm">{course.code}</div>
         <div className="text-xs text-muted-foreground">{course.title}</div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="p-4 bg-background border border-border rounded-sm hover:border-foreground/50 cursor-grab active:cursor-grabbing group transition-all"
    >
      <div className="flex justify-between items-center mb-1">
          <div className="font-bold text-sm text-foreground">{course.code}</div>
          <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-muted text-muted-foreground border-0 rounded-sm hover:bg-muted">{course.units} U</Badge>
      </div>
      <div className="text-xs text-muted-foreground line-clamp-1 group-hover:text-foreground transition-colors">{course.title}</div>
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
    <div className="flex flex-col h-full w-full bg-background border-r border-border">
      <div className="p-6 pb-4 space-y-4">
        <h2 className="font-serif font-medium text-lg text-foreground">Course Catalog</h2>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search courses..." 
            className="pl-9 pr-8 h-10 text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-foreground rounded-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <DraggableDrawerItem key={course.id} course={course} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm font-serif italic">
            <p>No courses found</p>
          </div>
        )}
      </div>
    </div>
  )
}
