import { AdminLayout } from "@/components/layout/AdminLayout"
import { requireAdmin } from "@/lib/auth-utils"

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SECURITY: Require admin or super admin role to access admin routes
  await requireAdmin()

  return <AdminLayout>{children}</AdminLayout>
}
