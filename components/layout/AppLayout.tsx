"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Navbar } from "@/components/layout/Navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
         <AppSidebar />
         <SidebarInset>
            <Navbar />
            <main className="flex-1 p-6 md:p-8">
             {children}
            </main>
         </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
