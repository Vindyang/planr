import { AppLayout } from "@/components/layout/AppLayout"
import { requireSession } from "@/lib/auth"
import { getStudentProfile } from "@/lib/data/students"
import { getUserRole } from "@/lib/auth-utils"
import { UserRole } from "@prisma/client"
import { redirect } from "next/navigation"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireSession()
  const role = await getUserRole(session.user.id)

  // Redirect admins and coordinators to admin section
  if (
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.COORDINATOR
  ) {
    redirect("/admin")
  }

  const student = await getStudentProfile(session.user.id)

  if (!student) {
    throw new Error("Student profile not found")
  }

  return <AppLayout student={student}>{children}</AppLayout>
}
