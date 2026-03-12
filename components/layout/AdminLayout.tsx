"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Navbar } from "@/components/layout/Navbar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
         <AdminSidebar />
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
