"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconEdit, IconCheck, IconX, IconTrash, IconPlus, IconSearch } from "@tabler/icons-react"
import { updateStudentProfile, addCompletedCourse, removeCompletedCourse } from "./componentsAction/student"
import { VALID_GRADES } from "@/lib/gpa"

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

interface AvailableCourse {
  id: string
  code: string
  title: string
  units: number
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

  // Add course state
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false)
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([])
  const [courseSearch, setCourseSearch] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [isAddingCourse, setIsAddingCourse] = useState(false)
  const [addCourseError, setAddCourseError] = useState("")

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

  async function fetchAvailableCourses() {
    try {
      const res = await fetch("/api/courses")
      if (!res.ok) return
      const data = await res.json()
      setAvailableCourses(
        (data.courses || []).map((c: AvailableCourse) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          units: c.units,
        }))
      )
    } catch {
      // silently fail, courses just won't be available
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

  function handleOpenAddCourse() {
    setIsAddCourseOpen(true)
    setSelectedCourseId("")
    setSelectedGrade("")
    setSelectedTerm("")
    setCourseSearch("")
    setAddCourseError("")
    fetchAvailableCourses()
  }

  async function handleAddCourse() {
    if (!selectedCourseId || !selectedGrade || !selectedTerm) {
      setAddCourseError("Please fill in all fields")
      return
    }

    setIsAddingCourse(true)
    setAddCourseError("")

    try {
      const result = await addCompletedCourse({
        courseId: selectedCourseId,
        grade: selectedGrade,
        term: selectedTerm,
      })

      if (result.success) {
        setIsAddCourseOpen(false)
        await fetchProfile()
      } else {
        setAddCourseError(result.error || "Failed to add course")
      }
    } catch (err) {
      setAddCourseError("Failed to add course")
    } finally {
      setIsAddingCourse(false)
    }
  }

  // Filter out already completed courses and apply search
  const completedCourseIds = new Set(student?.completedCourses.map((cc) => cc.course.id) || [])
  const filteredCourses = availableCourses
    .filter((c) => !completedCourseIds.has(c.id))
    .filter(
      (c) =>
        !courseSearch ||
        c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.title.toLowerCase().includes(courseSearch.toLowerCase())
    )

  const selectedCourse = availableCourses.find((c) => c.id === selectedCourseId)

  // Generate term options
  const currentYear = new Date().getFullYear()
  const termOptions: string[] = []
  for (let year = currentYear; year >= currentYear - 5; year--) {
    termOptions.push(`${year}-Fall`, `${year}-Spring`)
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

  // Calculate total units from completed courses
  const totalUnits = student.completedCourses.reduce((sum, cc) => sum + cc.course.units, 0)

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

                  <div className="pt-4 border-t border-dashed border-border/50">
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Units Earned</Label>
                      <p className="text-base font-normal text-foreground">{totalUnits} CU</p>
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
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-normal text-muted-foreground">
                {student.completedCourses.length} Courses
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddCourse}
                className="h-8 text-xs uppercase tracking-wider hover:bg-muted"
              >
                <IconPlus className="h-3.5 w-3.5 mr-1.5" />
                Add Course
              </Button>
            </div>
          </div>

          <div className="bg-card border border-transparent shadow-sm p-6">
            {student.completedCourses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No completed courses yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAddCourse}
                  className="mt-4 text-xs uppercase tracking-wider"
                >
                  <IconPlus className="h-3.5 w-3.5 mr-1.5" />
                  Add your first course
                </Button>
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
                      <span className="text-muted-foreground">{cc.term} · {cc.course.units} CU</span>
                      <span className="font-serif italic font-medium">{cc.grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Course Sheet */}
      <Sheet open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-lg font-medium">Add Completed Course</SheetTitle>
            <SheetDescription>
              Select a course, grade, and the term you completed it.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 space-y-6">
            {addCourseError && (
              <div className="rounded-none border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {addCourseError}
              </div>
            )}

            {/* Course selector */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Course</Label>
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="pl-9 bg-transparent"
                />
              </div>
              <div className="border border-input rounded-md max-h-48 overflow-y-auto">
                {filteredCourses.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    {courseSearch ? "No matching courses found" : "No courses available"}
                  </div>
                ) : (
                  filteredCourses.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      className={`w-full text-left px-3 py-2.5 text-sm border-b border-border/50 last:border-b-0 transition-colors ${
                        selectedCourseId === course.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedCourseId(course.id)}
                    >
                      <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                        {course.code}
                      </span>
                      <span className="block font-medium text-foreground">{course.title}</span>
                      <span className="text-xs text-muted-foreground">{course.units} CU</span>
                    </button>
                  ))
                )}
              </div>
              {selectedCourse && (
                <p className="text-xs text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{selectedCourse.code} - {selectedCourse.title}</span>
                </p>
              )}
            </div>

            {/* Grade selector */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Term selector */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {termOptions.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddCourseOpen(false)}
              className="text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCourse}
              disabled={isAddingCourse || !selectedCourseId || !selectedGrade || !selectedTerm}
              className="text-xs uppercase tracking-wider"
            >
              {isAddingCourse ? "Adding..." : "Add Course"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
