
import { IconBell, IconSearch, IconUserCircle } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  
  const getPageTitle = (path: string) => {
    if (path === "/dashboard") return "Dashboard";
    if (path === "/planner") return "Planner";
    if (path === "/courses") return "Courses";
    if (path === "/reviews") return "Reviews";
    if (path.startsWith("/student/profile")) return "Profile";
    if (path === "/settings") return "Preferences";
    return "Planr";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="mr-4 flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />

          <h1 className="text-sm font-medium">{getPageTitle(pathname)}</h1>
        </div>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
             <div className="relative">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search resources..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              />
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <IconBell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Link href="/student/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <IconUserCircle className="h-6 w-6" />
              <span className="sr-only">User Profile</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
