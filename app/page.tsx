import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getUserRole } from "@/lib/auth-utils"
import { UserRole } from "@prisma/client"

export default async function Home() {
  const session = await getSession()

  // Not authenticated - redirect to sign in
  if (!session?.user) {
    redirect("/login")
  }

  // Get user role
  const role = await getUserRole(session.user.id)

  // Redirect based on role
  if (
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.COORDINATOR
  ) {
    redirect("/admin")
  } else {
    // STUDENT and default
    redirect("/dashboard")
  }
}