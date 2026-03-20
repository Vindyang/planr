import { UserManagement } from "@/components/admin/UserManagement";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = (session?.user as any)?.role;
  const assignedUniversityId = (session?.user as any)?.assignedUniversityId;

  // ADMIN and COORDINATOR users should not access the global users page
  // Redirect them to their assigned university's user management page
  if (userRole === "ADMIN" || userRole === "COORDINATOR") {
    if (assignedUniversityId) {
      // Get the university code from the database
      const university = await prisma.university.findUnique({
        where: { id: assignedUniversityId },
        select: { code: true },
      });

      if (university) {
        redirect(`/admin/${university.code.toLowerCase()}/users`);
      }
    }
    // If no assigned university, default to SMU
    redirect("/admin/smu/users");
  }

  return <UserManagement />;
}
