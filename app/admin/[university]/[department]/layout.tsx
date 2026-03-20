import { requireDepartmentAccess } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function DepartmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ university: string; department: string }>;
}) {
  const { university, department } = await params;
  const universityUpper = university.toUpperCase();
  const departmentDecoded = decodeURIComponent(department);

  try {
    // Check if user has access to this department
    await requireDepartmentAccess(universityUpper, departmentDecoded);
  } catch (error) {
    // User doesn't have access - redirect to university level
    redirect(`/admin/${university}`);
  }

  return <>{children}</>;
}
