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
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <p className="text-muted-foreground animate-pulse">Loading profile...</p>
        </div>
      </AppLayout>
    )
  }

  if (error && !student) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </AppLayout>
    )
  }

  if (!student) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <p className="text-muted-foreground">No profile found</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
        {/* Header Section */}
        <header className="flex items-end justify-between pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-normal uppercase tracking-tight text-primary">
              Profile
            </h1>
          </div>
        </header>

        {error && (
          <div className="rounded-none border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Account Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium font-serif italic">Personal Details</h3>
            </div>
            <div className="bg-card border border-transparent shadow-sm hover:border-sidebar-border hover:shadow-md transition-all duration-200 p-6 space-y-6">
               <div className="space-y-1">
                 <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Name</Label>
                 <p className="text-base font-normal text-foreground">{student.user.name}</p>
               </div>
               <div className="space-y-1">
                 <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email</Label>
                 <p className="text-base font-normal text-foreground">{student.user.email}</p>
               </div>
               <div className="space-y-1">
                 <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">University</Label>
                 <p className="text-base font-normal text-foreground">{student.university}</p>
               </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium font-serif italic">Academic Information</h3>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 text-xs uppercase tracking-wider hover:bg-muted"
                >
                  <IconEdit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveProfile}
                    className="h-8 text-xs uppercase tracking-wider"
                  >
                    <IconCheck className="h-3.5 w-3.5 mr-1.5" />
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
                    className="h-8 text-xs uppercase tracking-wider"
                  >
                    <IconX className="h-3.5 w-3.5 mr-1.5" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            
            <div className="bg-card border border-transparent shadow-sm hover:border-sidebar-border hover:shadow-md transition-all duration-200 p-6 space-y-6">
              {isEditing ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="major" className="text-xs uppercase tracking-wider text-muted-foreground">Major</Label>
                    <Input
                      id="major"
                      value={editForm.major}
                      onChange={(e) =>
                        setEditForm({ ...editForm, major: e.target.value })
                      }
                      className="bg-transparent border-input focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondMajor" className="text-xs uppercase tracking-wider text-muted-foreground">Second Major (Optional)</Label>
                    <Input
                      id="secondMajor"
                      value={editForm.secondMajor}
                      onChange={(e) =>
                        setEditForm({ ...editForm, secondMajor: e.target.value })
                      }
                      className="bg-transparent border-input focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minor" className="text-xs uppercase tracking-wider text-muted-foreground">Minor (Optional)</Label>
                    <Input
                      id="minor"
                      value={editForm.minor}
                      onChange={(e) =>
                        setEditForm({ ...editForm, minor: e.target.value })
                      }
                      className="bg-transparent border-input focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-xs uppercase tracking-wider text-muted-foreground">Current Year</Label>
                    <select
                      id="year"
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
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
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Major</Label>
                      <p className="text-base font-normal text-foreground">{student.major}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Year</Label>
                      <p className="text-base font-normal text-foreground">Year {student.year}</p>
                    </div>
                  </div>
                  
                  {(student.secondMajor || student.minor) && (
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-border/50">
                      {student.secondMajor && (
                        <div className="space-y-1">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Second Major</Label>
                          <p className="text-base font-normal text-foreground">{student.secondMajor}</p>
                        </div>
                      )}
                      {student.minor && (
                        <div className="space-y-1">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Minor</Label>
                          <p className="text-base font-normal text-foreground">{student.minor}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-border/50">
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Expected Graduation</Label>
                      <p className="text-base font-normal text-foreground">{student.expectedGraduationYear}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">GPA</Label>
                      <p className="text-base font-normal text-foreground font-serif italic">{student.gpa.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completed Courses */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium font-serif italic">Completed Courses</h3>
            <Badge variant="outline" className="font-normal text-muted-foreground">
              {student.completedCourses.length} Courses
            </Badge>
          </div>
          
          <div className="bg-card border border-transparent shadow-sm p-6">
            {student.completedCourses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No completed courses yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {student.completedCourses.map((cc) => (
                  <div
                    key={cc.id}
                    className="group flex flex-col justify-between p-4 border border-input/50 hover:border-sidebar-border hover:shadow-sm transition-all duration-200 bg-background/50 hover:bg-background"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{cc.course.code}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveCourse(cc.id)}
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-medium text-foreground leading-tight">{cc.course.title}</h4>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{cc.term} · {cc.course.units} units</span>
                      <span className="font-serif italic font-medium">{cc.grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
