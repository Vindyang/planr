"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { IconEdit, IconCheck, IconX, IconTrash } from "@tabler/icons-react"
import { updateStudentProfile, removeCompletedCourse } from "./componentsAction/student"

interface CompletedCourse {
  id: string
  grade: string
  term: string
  course: {
    id: string
    code: string
    title: string
    units: number
  }
}

interface StudentProfile {
  id: string
  university: string
  major: string
  secondMajor: string | null
  minor: string | null
  year: number
  enrollmentYear: number
  expectedGraduationYear: number
  gpa: number
  user: {
    name: string
    email: string
  }
  completedCourses: CompletedCourse[]
}

export default function ProfilePage() {
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    major: "",
    secondMajor: "",
    minor: "",
    year: 1,
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch("/api/student/profile")
      if (!res.ok) {
        throw new Error("Failed to fetch profile")
      }
      const data = await res.json()
      setStudent(data.student)
      setEditForm({
        major: data.student.major,
        secondMajor: data.student.secondMajor || "",
        minor: data.student.minor || "",
        year: data.student.year,
      })
    } catch (err) {
      setError("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveProfile() {
    try {
      const result = await updateStudentProfile({
        major: editForm.major,
        secondMajor: editForm.secondMajor || null,
        minor: editForm.minor || null,
        year: editForm.year,
      })

      if (result.success) {
        await fetchProfile()
        setIsEditing(false)
      } else {
        setError(result.error || "Failed to update profile")
      }
    } catch (err) {
      setError("Failed to update profile")
    }
  }

  async function handleRemoveCourse(completedCourseId: string) {
    try {
      const result = await removeCompletedCourse(completedCourseId)
      if (result.success) {
        await fetchProfile()
      } else {
        setError(result.error || "Failed to remove course")
      }
    } catch (err) {
      setError("Failed to remove course")
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </AppLayout>
    )
  }

  if (error && !student) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </AppLayout>
    )
  }

  if (!student) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No profile found</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="text-lg font-medium">{student.user.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-lg font-medium">{student.user.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">University</Label>
                <p className="text-lg font-medium">{student.university}</p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Academic Information</CardTitle>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <IconEdit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveProfile}
                  >
                    <IconCheck className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setEditForm({
                        major: student.major,
                        secondMajor: student.secondMajor || "",
                        minor: student.minor || "",
                        year: student.year,
                      })
                    }}
                  >
                    <IconX className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      value={editForm.major}
                      onChange={(e) =>
                        setEditForm({ ...editForm, major: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="secondMajor">Second Major (Optional)</Label>
                    <Input
                      id="secondMajor"
                      value={editForm.secondMajor}
                      onChange={(e) =>
                        setEditForm({ ...editForm, secondMajor: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="minor">Minor (Optional)</Label>
                    <Input
                      id="minor"
                      value={editForm.minor}
                      onChange={(e) =>
                        setEditForm({ ...editForm, minor: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="year">Current Year</Label>
                    <select
                      id="year"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editForm.year}
                      onChange={(e) =>
                        setEditForm({ ...editForm, year: parseInt(e.target.value) })
                      }
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                      <option value={4}>Year 4</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-muted-foreground">Major</Label>
                    <p className="text-lg font-medium">{student.major}</p>
                  </div>
                  {student.secondMajor && (
                    <div>
                      <Label className="text-muted-foreground">Second Major</Label>
                      <p className="text-lg font-medium">{student.secondMajor}</p>
                    </div>
                  )}
                  {student.minor && (
                    <div>
                      <Label className="text-muted-foreground">Minor</Label>
                      <p className="text-lg font-medium">{student.minor}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Year</Label>
                    <p className="text-lg font-medium">Year {student.year}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Expected Graduation</Label>
                    <p className="text-lg font-medium">{student.expectedGraduationYear}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">GPA</Label>
                    <p className="text-lg font-medium">{student.gpa.toFixed(2)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Completed Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Completed Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {student.completedCourses.length === 0 ? (
              <p className="text-muted-foreground">No completed courses yet</p>
            ) : (
              <div className="space-y-3">
                {student.completedCourses.map((cc) => (
                  <div
                    key={cc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {cc.course.code} - {cc.course.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cc.term} · {cc.course.units} units
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{cc.grade}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCourse(cc.id)}
                      >
                        <IconTrash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
