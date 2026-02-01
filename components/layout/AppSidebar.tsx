"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconDashboard, IconCalendarEvent, IconBook, IconMessageCircle, IconSettings, IconUser } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  {
    title: "Overview",
    items: [
        { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
        { title: "Planner", url: "/planner", icon: IconCalendarEvent },
        { title: "Courses", url: "/courses", icon: IconBook },
        { title: "Reviews", url: "/reviews", icon: IconMessageCircle },
    ]
  },
  {
    title: "Account",
    items: [
        { title: "Profile", url: "/student/profile", icon: IconUser },
        { title: "Preferences", url: "/settings", icon: IconSettings },
    ]
  }
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-12 items-center px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <span className="font-bold text-xl tracking-tight group-data-[collapsible=icon]:hidden">Planr</span>
            <span className="hidden font-bold text-xl tracking-tight group-data-[collapsible=icon]:block">P</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {items.map((group) => (
            <SidebarGroup key={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                                    <Link href={item.url}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
