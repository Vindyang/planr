"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <aside className="hidden w-64 md:block border-r min-h-[calc(100vh-64px)]">
           <Sidebar />
        </aside>
        <main className="flex-1 p-6 md:p-8">
            {children}
        </main>
      </div>
    </div>
  );
}
