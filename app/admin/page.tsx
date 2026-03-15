import { getSession } from "@/lib/auth";
import { getUserWithAssignments } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserRole } from "@prisma/client";

export default async function AdminRootPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await getUserWithAssignments(session.user.id);
  if (!user) {
    redirect("/login");
  }

  // ADMIN users → redirect to their assigned university
  if (user.role === UserRole.ADMIN && user.assignedUniversity?.code) {
    redirect(`/admin/${user.assignedUniversity.code.toLowerCase()}`);
  }

  // COORDINATOR users → redirect to their assigned department
  if (
    user.role === UserRole.COORDINATOR &&
    user.assignedUniversity?.code &&
    user.assignedDepartment?.name
  ) {
    redirect(
      `/admin/${user.assignedUniversity.code.toLowerCase()}/${encodeURIComponent(
        user.assignedDepartment.name
      )}`
    );
  }

  // SUPER_ADMIN → show dashboard
  return <AdminDashboard />;
}
