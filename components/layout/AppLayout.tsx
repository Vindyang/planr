"use client";

import { useState, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Navbar } from "@/components/layout/Navbar";
import type { StudentProfile } from "@/lib/data/students";
import { WelcomeModal } from "@/components/tutorial/WelcomeModal";
import { OnboardingChecklist } from "@/components/tutorial/OnboardingChecklist";
import { TourOverlay } from "@/components/tutorial/TourOverlay";
import type { TourType } from "@/components/tutorial/tourSteps";

export function AppLayout({
  children,
  student
}: {
  children: React.ReactNode
  student: StudentProfile
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourInitialStep, setTourInitialStep] = useState(0);
  const [tourType, setTourType] = useState<TourType>("overview");

  // Fire tour from ?tour= URL param (set by checklist arrows)
  useEffect(() => {
    const param = searchParams.get("tour") as TourType | null;
    if (param) {
      setTourType(param);
      setTourInitialStep(0);
      setIsTourOpen(true);
      router.replace(pathname); // strip the param without a page reload
    }
  }, [searchParams, pathname, router]);

  // Fire tour from custom event (set by "Take a tour" button)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ step?: number; type?: TourType }>).detail;
      setTourInitialStep(detail?.step ?? 0);
      setTourType(detail?.type ?? "overview");
      setIsTourOpen(true);
    };
    window.addEventListener("planr_start_tour", handler);
    return () => window.removeEventListener("planr_start_tour", handler);
  }, []);

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
      <WelcomeModal />
      <OnboardingChecklist />
      {isTourOpen && <TourOverlay onClose={() => setIsTourOpen(false)} initialStep={tourInitialStep} tourType={tourType} />}
    </SidebarProvider>
  );
}
