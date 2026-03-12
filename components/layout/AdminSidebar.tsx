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
import { IconDashboard, IconUsers, IconBook, IconUserCircle, IconLogout } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const items = [
  {
    title: "Admin Tools",
    items: [
        { title: "Dashboard", url: "/admin", icon: IconDashboard, number: "A01" },
        { title: "User Management", url: "/admin/users", icon: IconUsers, number: "A02" },
        { title: "Course Catalog", url: "/admin/courses", icon: IconBook, number: "A03" },
        { title: "Admin Profile", url: "/admin/profile", icon: IconUserCircle, number: "A04" },
    ]
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <Sidebar collapsible="icon" className="border-r border-[#DAD6CF] bg-[#F4F1ED]">
      <SidebarHeader className="h-[120px] p-8 border-b border-[#DAD6CF] group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:p-2">
        <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-12">
            <span className="font-semibold text-2xl tracking-tight text-[#0A0A0A] group-data-[collapsible=icon]:hidden">Planr Admin.</span>
            <span className="hidden font-semibold text-xl tracking-tight text-[#0A0A0A] group-data-[collapsible=icon]:block">A.</span>
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
                                            group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!gap-0
                                            group-data-[collapsible=icon]:border-none
                                        `}
                                    >
                                        <Link href={item.url} className="flex w-full h-full items-center justify-between group-data-[collapsible=icon]:justify-center">
                                            <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
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
      <SidebarFooter className="p-6 border-t border-[#DAD6CF] group-data-[collapsible=icon]:p-2">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold text-[#0A0A0A]">Admin User</span>
                <span className="text-xs text-[#666460]">System Administrator</span>
            </div>
             <SidebarMenuButton 
                size="sm"
                className="w-auto h-auto p-2 hover:bg-transparent text-[#0A0A0A] group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center"
                onClick={() => router.push("/login")}
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
