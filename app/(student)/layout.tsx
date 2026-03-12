import { AppLayout } from "@/components/layout/AppLayout"
import { requireSession } from "@/lib/auth"
import { getStudentProfile } from "@/lib/data/students"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireSession()
  const student = await getStudentProfile(session.user.id)

  if (!student) {
    throw new Error("Student profile not found")
  }

  return <AppLayout student={student}>{children}</AppLayout>
}
