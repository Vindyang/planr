
import Link from "next/link";
import { IconDashboard, IconCalendarEvent, IconBook, IconMessageCircle, IconSettings, IconUser, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, isCollapsed, onToggle }: SidebarProps & { isCollapsed?: boolean; onToggle?: () => void }) {
  return (
    <div className={cn("pb-12 h-screen border-r bg-background relative", className)}>
      <div className="space-y-4 py-4">
        {onToggle && (
           <div className={cn("flex items-center px-4", isCollapsed ? "justify-center" : "justify-end")}>
             <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
               {isCollapsed ? <IconChevronsRight className="h-4 w-4" /> : <IconChevronsLeft className="h-4 w-4" />}
             </Button>
           </div>
        )}
        <div className="px-3 py-2">
          {!isCollapsed && (
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Overview
            </h2>
          )}
          <div className="space-y-1">
            <Link href="/dashboard">
              <Button variant="secondary" className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}>
                <IconDashboard className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                {!isCollapsed && "Dashboard"}
              </Button>
            </Link>
            <Link href="/planner">
              <Button variant="ghost" className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}>
                <IconCalendarEvent className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                {!isCollapsed && "Planner"}
              </Button>
            </Link>
            <Link href="/courses">
              <Button variant="ghost" className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}>
                <IconBook className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                {!isCollapsed && "Courses"}
              </Button>
            </Link>
            <Link href="/reviews">
              <Button variant="ghost" className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}>
                <IconMessageCircle className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                {!isCollapsed && "Reviews"}
              </Button>
            </Link>
          </div>
        </div>
        <div className="px-3 py-2">
          {!isCollapsed && (
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Account
            </h2>
          )}
          <div className="space-y-1">
            <Link href="/student/profile">
              <Button variant="ghost" className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}>
                <IconUser className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                {!isCollapsed && "Profile"}
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}>
                <IconSettings className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                {!isCollapsed && "Preferences"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
