
import Link from "next/link";
import { IconDashboard, IconCalendarEvent, IconBook, IconMessageCircle, IconSettings } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12 h-screen border-r bg-background", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Overview
          </h2>
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start">
              <IconDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start">
               <IconCalendarEvent className="mr-2 h-4 w-4" />
              Planner
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <IconBook className="mr-2 h-4 w-4" />
              Courses
            </Button>
             <Button variant="ghost" className="w-full justify-start">
              <IconMessageCircle className="mr-2 h-4 w-4" />
              Reviews
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Settings
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <IconSettings className="mr-2 h-4 w-4" />
              Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
