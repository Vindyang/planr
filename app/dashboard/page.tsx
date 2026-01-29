
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCards } from "./components/StatCards";
import { EligibleCoursesList } from "./components/EligibleCoursesList";
import { MOCK_COURSES, MOCK_STUDENT } from "@/lib/mock-data";
import { getEligibleCourses } from "@/lib/eligibility";

export default function DashboardPage() {
  const eligibleCourses = getEligibleCourses(MOCK_COURSES, MOCK_STUDENT);

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
             <span className="text-sm text-muted-foreground">Welcome back, {MOCK_STUDENT.name}</span>
          </div>
        </div>
        
        <StatCards student={MOCK_STUDENT} />

        <div className="space-y-4">
             <h3 className="text-xl font-semibold tracking-tight">Eligible Courses for Next Semester</h3>
             <EligibleCoursesList courses={eligibleCourses} />
        </div>
      </div>
    </AppLayout>
  );
}
