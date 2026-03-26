"use client"

import { useState } from "react"
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
import { updateStudentProfile, addCompletedCourse, removeCompletedCourse } from "./actions"
import { VALID_GRADES, calculateGPA } from "@/lib/gpa"

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
  universityId: string
  majorId: string
  secondMajorId: string | null
  minorId: string | null
  university: {
    id: string
    code: string
    name: string
  }
  major: {
    id: string
    code: string
    name: string
  }
  secondMajor: {
    id: string
    code: string
    name: string
  } | null
  minor: {
    id: string
    code: string
    name: string
  } | null
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

interface ProfileClientProps {
  initialStudent: StudentProfile | null
  initialCourses: AvailableCourse[]
}

type ParsedTermMeta = {
  year: number | null
  termNumber: number | null
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return fallback
}

function getDepartmentName(dept: unknown) {
  if (typeof dept === "string") return dept
  if (dept && typeof dept === "object" && "name" in dept && typeof (dept as { name?: unknown }).name === "string") {
    return (dept as { name: string }).name
  }
  return ""
}

function parseTermMeta(term: string): ParsedTermMeta {
  // Supports common stored formats:
  // - "2026-Term 1"
  // - "Term 1 2026"
  // - "2026 Term 1"
  const normalized = term.trim()

  const yearFirst = normalized.match(/(\d{4})\s*[- ]\s*Term\s*(\d)/i)
  if (yearFirst) {
    return {
      year: parseInt(yearFirst[1], 10),
      termNumber: parseInt(yearFirst[2], 10),
    }
  }

  const termFirst = normalized.match(/Term\s*(\d)\s*[- ]\s*(\d{4})/i)
  if (termFirst) {
    return {
      termNumber: parseInt(termFirst[1], 10),
      year: parseInt(termFirst[2], 10),
    }
  }

  const yearOnly = normalized.match(/(\d{4})/)
  return {
    year: yearOnly ? parseInt(yearOnly[1], 10) : null,
    termNumber: null,
  }
}

async function parseApiError(response: Response, fallback: string) {
  try {
    const data = await response.json()
    if (typeof data?.error === "string" && data.error.trim().length > 0) {
      return data.error
    }
  } catch {
    // ignore non-JSON errors and use fallback
  }
  return fallback
}

export default function ProfileClient({ initialStudent, initialCourses }: ProfileClientProps) {
  const [student, setStudent] = useState<StudentProfile | null>(initialStudent)
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>(initialCourses)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    major: initialStudent?.major.name || "",
    secondMajor: initialStudent?.secondMajor?.name || "",
    minor: initialStudent?.minor?.name || "",
    year: initialStudent?.year || 1,
  })

  // Add course state
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false)
  const [courseSearch, setCourseSearch] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedTermNumber, setSelectedTermNumber] = useState("")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("")
  const [isAddingCourse, setIsAddingCourse] = useState(false)
  const [addCourseError, setAddCourseError] = useState("")
  const [completedSearch, setCompletedSearch] = useState("")
  const [completedYearFilter, setCompletedYearFilter] = useState("all")
  const [completedTermFilter, setCompletedTermFilter] = useState("all")

  // Removed initial useEffect fetch

  async function fetchProfile() {
    try {
      const res = await fetch("/api/student/profile")
      if (!res.ok) {
        throw new Error(await parseApiError(res, "Failed to fetch profile"))
      }
      const data = await res.json()
      setStudent(data.student)
      setEditForm({
        major: getDepartmentName(data.student.major),
        secondMajor: getDepartmentName(data.student.secondMajor),
        minor: getDepartmentName(data.student.minor),
        year: data.student.year,
      })
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load profile"))
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
      // silently fail
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
      setError(getErrorMessage(err, "Failed to update profile"))
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
      setError(getErrorMessage(err, "Failed to remove course"))
    }
  }

  function handleOpenAddCourse() {
    setIsAddCourseOpen(true)
    setSelectedCourseId("")
    setSelectedGrade("")
    setSelectedTermNumber("")
    setSelectedAcademicYear("")
    setCourseSearch("")
    setAddCourseError("")
    // We can fetch fresh courses just in case, or stick to initial
    if (availableCourses.length === 0) {
        fetchAvailableCourses()
    }
  }

  async function handleAddCourse() {
    if (!selectedCourseId || !selectedGrade || !selectedTermNumber || !selectedAcademicYear) {
      setAddCourseError("Please fill in all fields")
      return
    }

    setIsAddingCourse(true)
    setAddCourseError("")

    try {
      const selectedTerm = `${selectedAcademicYear}-${selectedTermNumber}`

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
      setAddCourseError(getErrorMessage(err, "Failed to add course"))
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

  // Generate academic year options
  const currentYear = new Date().getFullYear()
  const academicYearOptions: string[] = []
  for (let year = currentYear; year >= currentYear - 5; year--) {
    academicYearOptions.push(year.toString())
  }

  // Calculate total units from completed courses
  const totalUnits = student?.completedCourses.reduce((sum, cc) => sum + cc.course.units, 0) || 0

  const completedCoursesWithMeta = (student?.completedCourses || []).map((cc) => ({
    ...cc,
    ...parseTermMeta(cc.term),
  }))

  const availableCompletedYears = Array.from(
    new Set(completedCoursesWithMeta.map((cc) => cc.year).filter((year): year is number => year !== null))
  ).sort((a, b) => b - a)

  const filteredCompletedCourses = completedCoursesWithMeta.filter((cc) => {
    const matchesSearch =
      completedSearch.trim().length === 0 ||
      cc.course.code.toLowerCase().includes(completedSearch.toLowerCase()) ||
      cc.course.title.toLowerCase().includes(completedSearch.toLowerCase())

    const matchesYear =
      completedYearFilter === "all" ||
      (cc.year !== null && cc.year.toString() === completedYearFilter)

    const matchesTerm =
      completedTermFilter === "all" ||
      (cc.termNumber !== null && `Term ${cc.termNumber}` === completedTermFilter)

    return matchesSearch && matchesYear && matchesTerm
  })

  const filteredTermGpaSummaries = (() => {
    if (filteredCompletedCourses.length === 0) return []

    const grouped = new Map<string, Array<{ grade: string; units: number; year: number | null; termNumber: number | null }>>()

    filteredCompletedCourses.forEach((cc) => {
      grouped.set(cc.term, [
        ...(grouped.get(cc.term) || []),
        { grade: cc.grade, units: cc.course.units, year: cc.year, termNumber: cc.termNumber },
      ])
    })

    const summaries = Array.from(grouped.entries()).map(([termLabel, courses]) => ({
      termLabel,
      gpa: calculateGPA(courses),
      courseCount: courses.length,
      year: courses[0]?.year ?? null,
      termNumber: courses[0]?.termNumber ?? null,
    }))

    return summaries.sort((a, b) => {
      const yearA = a.year ?? -Infinity
      const yearB = b.year ?? -Infinity
      if (yearA !== yearB) return yearB - yearA
      const termA = a.termNumber ?? 99
      const termB = b.termNumber ?? 99
      return termA - termB
    })
  })()

  const sortedFilteredCompletedCourses = [...filteredCompletedCourses].sort((a, b) => {
    const yearA = a.year ?? -Infinity
    const yearB = b.year ?? -Infinity
    if (yearA !== yearB) return yearB - yearA
    const termA = a.termNumber ?? 99
    const termB = b.termNumber ?? 99
    if (termA !== termB) return termA - termB
    return a.course.code.localeCompare(b.course.code)
  })

  const termGpaByLabel = new Map(
    filteredTermGpaSummaries.map((summary) => [summary.termLabel, summary.gpa] as const)
  )

  const groupedCoursesByTerm = (() => {
    const grouped = new Map<
      string,
      {
        year: number | null
        termNumber: number | null
        courses: typeof sortedFilteredCompletedCourses
      }
    >()

    sortedFilteredCompletedCourses.forEach((cc) => {
      const key = `${cc.year ?? "Unknown"}-Term ${cc.termNumber ?? "?"}`
      const existing = grouped.get(key)
      if (existing) {
        existing.courses.push(cc)
      } else {
        grouped.set(key, {
          year: cc.year,
          termNumber: cc.termNumber,
          courses: [cc],
        })
      }
    })

    return Array.from(grouped.values()).sort((a, b) => {
      const yearA = a.year ?? -Infinity
      const yearB = b.year ?? -Infinity
      if (yearA !== yearB) return yearB - yearA
      const termA = a.termNumber ?? 99
      const termB = b.termNumber ?? 99
      return termA - termB
    })
  })()

  const filteredCgpa = calculateGPA(
    filteredCompletedCourses.map((cc) => ({
      grade: cc.grade,
      units: cc.course.units,
    }))
  )

  if (!student) {
      return (
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <p className="text-muted-foreground">No profile found</p>
        </div>
      )
  }

  return (
    <>
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
                 <p className="text-base font-normal text-foreground">{student.university.name}</p>
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
                        major: student.major.name,
                        secondMajor: student.secondMajor?.name || "",
                        minor: student.minor?.name || "",
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
                      <p className="text-base font-normal text-foreground">{student.major.name}</p>
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
                          <p className="text-base font-normal text-foreground">{student.secondMajor.name}</p>
                        </div>
                      )}
                      {student.minor && (
                        <div className="space-y-1">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Minor</Label>
                          <p className="text-base font-normal text-foreground">{student.minor.name}</p>
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
                {filteredCompletedCourses.length} / {student.completedCourses.length} Courses
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
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="lg:col-span-2 space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Find Course</Label>
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search by code or title..."
                        value={completedSearch}
                        onChange={(e) => setCompletedSearch(e.target.value)}
                        className="pl-9 bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Year</Label>
                    <Select value={completedYearFilter} onValueChange={setCompletedYearFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All years</SelectItem>
                        {availableCompletedYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Term</Label>
                    <Select value={completedTermFilter} onValueChange={setCompletedTermFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All terms</SelectItem>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Term 3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="text-foreground font-medium">{filteredCompletedCourses.length}</span> courses
                    {" · "}
                    <span className="text-foreground font-medium">
                      {filteredCompletedCourses.reduce((sum, cc) => sum + cc.course.units, 0)} CU
                    </span>
                    {" · "}
                    GPA <span className="text-foreground font-medium">{filteredCgpa.toFixed(2)}</span>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs uppercase tracking-wider"
                    onClick={() => {
                      setCompletedSearch("")
                      setCompletedYearFilter("all")
                      setCompletedTermFilter("all")
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>

                {groupedCoursesByTerm.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border/60">
                    <p>No completed courses match your current filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedCoursesByTerm.map((group) => {
                      const termLabel = `${group.year ?? "Unknown Year"} · ${group.termNumber ? `Term ${group.termNumber}` : "Unknown Term"}`
                      const lookupLabel = group.courses[0]?.term ?? ""
                      const termGpa = termGpaByLabel.get(lookupLabel)

                      return (
                        <div key={termLabel} className="border border-border/60 bg-background/40">
                          <div className="px-4 py-3 bg-muted/35 border-b border-border/60 flex items-center justify-between">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                              {termLabel}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {typeof termGpa === "number" && (
                                <p>
                                  GPA <span className="font-serif italic text-foreground">{termGpa.toFixed(2)}</span>
                                </p>
                              )}
                              <p>
                                {group.courses.length} courses
                              </p>
                            </div>
                          </div>

                          <div className="divide-y divide-border/60">
                            {group.courses.map((cc) => (
                              <div key={cc.id} className="px-4 py-3 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    {cc.course.code}
                                  </p>
                                  <p className="text-sm text-foreground truncate">{cc.course.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{cc.course.units} CU</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-serif italic text-sm text-foreground">{cc.grade}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveCourse(cc.id)}
                                  >
                                    <IconTrash className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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
              Select a course, grade, term number, and academic year.
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

            {/* Term and academic year selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Term</Label>
                <Select value={selectedTermNumber} onValueChange={setSelectedTermNumber}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Academic Year</Label>
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              disabled={isAddingCourse || !selectedCourseId || !selectedGrade || !selectedTermNumber || !selectedAcademicYear}
              className="text-xs uppercase tracking-wider"
            >
              {isAddingCourse ? "Adding..." : "Add Course"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
