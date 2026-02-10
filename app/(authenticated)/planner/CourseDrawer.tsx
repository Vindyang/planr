"use client"

import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { IconSearch, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
// import { Course } from "@prisma/client" // Removed to use local type or pass any

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
      <div ref={setNodeRef} style={style} className="opacity-50 border p-3 rounded-md bg-gray-50">
         <div className="font-bold text-sm">{course.code}</div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="p-3 bg-white border rounded-md shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group transition-all"
    >
      <div className="flex justify-between items-start">
          <div className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{course.code}</div>
          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{course.units} U</span>
      </div>
      <div className="text-xs text-gray-500 truncate mt-1">{course.title}</div>
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
    <div className="w-80 border-r bg-white flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <h2 className="font-semibold text-sm text-gray-900">Course Catalog</h2>
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search courses..." 
            className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <DraggableDrawerItem key={course.id} course={course} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No courses found
          </div>
        )}
      </div>
    </div>
  )
}
