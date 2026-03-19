import { SystemLog } from "@/components/admin/SystemLog";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { canViewAuditLogs } from "@/lib/access-control";
import { UserRole } from "@prisma/client";

export default async function AdminSystemLogPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = (session?.user as any)?.role as UserRole;

  // Check if user has permission to view audit logs
  // COORDINATOR users cannot view system logs
  if (!userRole || !canViewAuditLogs(userRole)) {
    redirect("/admin");
  }

  return <SystemLog />;
}
