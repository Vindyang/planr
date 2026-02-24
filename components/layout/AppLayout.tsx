"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Navbar } from "@/components/layout/Navbar";
import type { StudentProfile } from "@/lib/data/students";

export function AppLayout({
  children,
  student
}: {
  children: React.ReactNode
  student: StudentProfile
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
         <AppSidebar student={student} />
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
