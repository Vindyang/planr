import { UserManagement } from "@/components/admin/UserManagement";

export default async function UniversityUsersPage({
  params,
}: {
  params: Promise<{ university: string }>;
}) {
  const { university } = await params;

  return <UserManagement defaultUniversity={university.toUpperCase()} />;
}
