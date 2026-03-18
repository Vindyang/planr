import { requireUniversityAccess } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function UniversityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ university: string }>;
}) {
  const { university } = await params;

  // Validate university parameter - check if university exists in database
  const universityUpper = university.toUpperCase();
  const universityRecord = await prisma.university.findUnique({
    where: { code: universityUpper },
  });

  if (!universityRecord || !universityRecord.isActive) {
    redirect("/admin");
  }

  try {
    // Check if user has access to this university
    await requireUniversityAccess(universityUpper);
  } catch (error) {
    // User doesn't have access to this university
    redirect("/admin");
  }

  return <>{children}</>;
}
