import { AdminLayout } from "@/components/layout/AdminLayout"
import { getSession } from "@/lib/auth"
import { getUserRole } from "@/lib/auth-utils"
import { UserRole } from "@prisma/client"
import { redirect } from "next/navigation"

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Not authenticated - redirect to login
  if (!session?.user) {
    redirect("/login")
  }

  const role = await getUserRole(session.user.id)

  // SECURITY: Redirect non-admin users to student dashboard
  if (
    role !== UserRole.ADMIN &&
    role !== UserRole.SUPER_ADMIN &&
    role !== UserRole.COORDINATOR
  ) {
    redirect("/dashboard")
  }

  return <AdminLayout>{children}</AdminLayout>
}
