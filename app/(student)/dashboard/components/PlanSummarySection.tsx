import { getStudentProfile } from "@/lib/data/students"
import { getPlannerData } from "@/lib/planner/actions"
import { PlanSummary } from "./PlanSummary"

export async function PlanSummarySection({ userId }: { userId: string }) {
  const student = await getStudentProfile(userId)

  if (!student) {
    throw new Error("Student profile not found")
  }

  const plannerData = await getPlannerData(student.id)

  return <PlanSummary semesterPlans={plannerData.semesterPlans} />
}
