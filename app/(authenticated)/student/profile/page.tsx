import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getStudentProfile } from "@/lib/data/students"
import { getAllCoursesForUniversity } from "@/lib/data/courses"
import ProfileClient from "./ProfileClient"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session?.user) {
    redirect("/login")
  }

  const student = await getStudentProfile(session.user.id)

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Student profile not found</p>
      </div>
    )
  }

  // Optimize: we primarily need course codes for the dropdown, but getAllCoursesForUniversity returns detailed data.
  // This is fine as it uses cached query helper.
  const courses = await getAllCoursesForUniversity(student.university)

  const availableCourses = courses.map(c => ({
    id: c.id,
    code: c.code,
    title: c.title,
    units: c.units
  }))

  return (
    <ProfileClient 
      initialStudent={student} 
      initialCourses={availableCourses} 
    />
  )
}
