import { AdminLayout } from "@/components/layout/AdminLayout"
import { requireAdmin } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // Ensure user has admin role (ADMIN, SUPER_ADMIN, or COORDINATOR)
    await requireAdmin()
  } catch (error) {
    // Not authenticated or not an admin - redirect appropriately
    redirect("/login")
  }

  return <AdminLayout>{children}</AdminLayout>
}
