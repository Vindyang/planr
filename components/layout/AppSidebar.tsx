"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { IconDashboard, IconCalendarEvent, IconBook, IconMessageCircle, IconLogout } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"


// Enriched items with metadata for the new design
const items = [
  {
    title: "Overview", // We can keep groups visually or merge them if desired. Reference had a flat list, but groups are good for structure.
    items: [
        { title: "Dashboard", url: "/dashboard", icon: IconDashboard, number: "001" },
        { title: "Planner", url: "/planner", icon: IconCalendarEvent, number: "002" },
        { title: "Courses", url: "/courses", icon: IconBook, number: "003" },
        { title: "My Reviews", url: "/reviews", icon: IconMessageCircle, number: "004" },
    ]
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <Sidebar collapsible="icon" className="border-r border-[#DAD6CF] bg-[#F4F1ED]">
      <SidebarHeader className="h-[120px] p-8 border-b border-[#DAD6CF]">
        <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
            <span className="font-semibold text-2xl tracking-tight text-[#0A0A0A] group-data-[collapsible=icon]:hidden">Planr.</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {items.map((group) => (
            <SidebarGroup key={group.title} className="p-0">
                <SidebarGroupContent>
                    <SidebarMenu className="gap-0">
                        {group.items.map((item) => {
                            const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton 
                                        asChild 
                                        isActive={isActive} 
                                        tooltip={item.title}
                                        className={`
                                            h-auto py-5 px-6 border-b border-[#DAD6CF] rounded-none
                                            hover:bg-white/60 active:bg-white/80
                                            data-[active=true]:bg-white/40 data-[active=true]:text-[#0A0A0A]
                                            transition-colors
                                        `}
                                    >
                                        <Link href={item.url} className="flex w-full items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {/* Hidden icon in full view to match text-only reference, or keep icon? Reference was text-only. 
                                                   Let's keep text-only for full view to match reference, but maybe icons are useful? 
                                                   Actually reference has 'Dashboard' text only. 
                                                   But Shadcn sidebar usually expects icons for collapsed state.
                                                   Let's show icons only when collapsed, or maybe always if user prefers. 
                                                   Reference didn't have icons. Let's try to match reference more closely: Text only.
                                                   BUT, for collapsed mode to work, we need something. 
                                                   Let's keep icons but maybe make them subtle or hidden if strictly following reference.
                                                   The user said "don't need to make it 100% similar". 
                                                   So I will keep icons for better UX, but style the row like reference.
                                                */}
                                                <item.icon className="size-4 text-[#0A0A0A]" />
                                                <span className="text-[#0A0A0A] group-data-[collapsible=icon]:hidden">{item.title}</span>
                                            </div>
                                            <span className="font-serif italic text-[#666460] text-sm group-data-[collapsible=icon]:hidden">
                                                {item.number}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-6 border-t border-[#DAD6CF]">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold text-[#0A0A0A]">Peter Lim</span>
                <span className="text-xs text-[#666460]">SMU • Year 2</span>
            </div>
             <SidebarMenuButton 
                size="sm"
                className="w-auto h-auto p-2 hover:bg-transparent text-[#0A0A0A]"
                onClick={async () => {
                await signOut()
                router.push("/login")
                }}
                tooltip="Logout"
            >
                <IconLogout className="size-4" />
            </SidebarMenuButton>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
