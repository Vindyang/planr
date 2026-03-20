import { CourseManagement } from "@/components/admin/CourseManagement";

export default async function UniversityCoursesPage({
  params,
}: {
  params: Promise<{ university: string }>;
}) {
  const { university } = await params;

  return <CourseManagement defaultUniversity={university.toUpperCase()} />;
}
