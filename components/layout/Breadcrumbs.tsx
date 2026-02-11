"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { IconChevronRight } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Map route segments to friendly labels
function getLabel(segment: string, path: string, courseTitles: Record<string, string>): string | React.ReactNode {
  const labelMap: Record<string, string> = {
    "dashboard": "Home",
    "planner": "Planner",
    "courses": "Courses",
    "student": "Student",
    "profile": "Profile",
    "settings": "Settings",
  }

  // If we have a cached title for this segment (which is likely an ID), use it
  if (courseTitles[segment]) {
    return courseTitles[segment]
  }
  
  // Check if it looks like a course ID (UUID-like) and is preceded by "courses" in the path
  const isCourseId = path.includes("/courses/") && segment.length > 20 && !labelMap[segment]

  if (isCourseId) {
     return <Skeleton className="h-4 w-24 inline-block align-middle" />
  }

  // If the segment is a UUID-like string and handled by our fetcher, it might be loading or failed
  // For now, adhere to the default behavior
  return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const [courseTitles, setCourseTitles] = useState<Record<string, string>>({})

  // Fetch course titles for IDs in the path
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean)
    
    segments.forEach((segment, index) => {
      // Check if this segment is a Course ID
      // Logic: Previous segment is "courses" and this segment looks like a UUID
      const prevSegment = segments[index - 1]
      const isCourseId = prevSegment === "courses" && segment.length > 20 // simple check for UUID-like length

      if (isCourseId && !courseTitles[segment]) {
        // Fetch course details
        fetch(`/api/courses/${segment}`)
          .then(res => {
            if (!res.ok) throw new Error("Failed to fetch")
            return res.json()
          })
          .then(data => {
            if (data.course) {
              setCourseTitles(prev => ({
                ...prev,
                [segment]: data.course.code // Using Code (e.g. CS 101) as it's shorter and cleaner for breadcrumbs
              }))
            }
          })
          .catch(err => {
            console.error("Error fetching course title for breadcrumb:", err)
          })
      }
    })
  }, [pathname, courseTitles])

  // Don't show breadcrumbs on root or auth pages
  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return null
  }

  const segments = pathname.split("/").filter(Boolean)

  // Build breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/")
    const label = getLabel(segment, path, courseTitles)

    return { path, label, isLast: index === segments.length - 1 }
  })

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground transition-colors">
        Home
      </Link>
      {breadcrumbs.map((item) => (
        <div key={item.path} className="flex items-center">
          <IconChevronRight className="h-4 w-4 mx-2" />
          {item.isLast ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <Link href={item.path} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
