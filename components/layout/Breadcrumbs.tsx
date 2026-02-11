"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { IconChevronRight } from "@tabler/icons-react"

// Map route segments to friendly labels
function getLabel(segment: string, path: string): string {
  const labelMap: Record<string, string> = {
    "dashboard": "Home",
    "planner": "Planner",
    "courses": "Courses",
    "student": "Student",
    "profile": "Profile",
    "settings": "Settings",
  }

  // If the segment is a UUID or ID, try to fetch from context
  // For now, we'll just use the segment itself
  return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // Don't show breadcrumbs on root or auth pages
  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return null
  }

  const segments = pathname.split("/").filter(Boolean)

  // Build breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/")
    const label = getLabel(segment, path)

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
