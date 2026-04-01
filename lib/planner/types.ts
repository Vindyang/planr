import { Prisma } from "@prisma/client"
import type { CompletedCourseInfo, CourseWithPrereqs } from "@/lib/eligibility/types"

// Re-export shared types from eligibility module
export type { CompletedCourseInfo, CourseWithPrereqs }

// --- Violation Types ---

export type ViolationType =
  | "PREREQUISITE_VIOLATION"
  | "COREQUISITE_VIOLATION"
  | "DUPLICATE_COURSE"
  | "OVERLOAD"
  | "TERM_UNAVAILABLE"

export type ViolationSeverity = "error" | "warning"

export interface Violation {
  type: ViolationType
  severity: ViolationSeverity
  courseId: string
  courseCode: string
  semesterId: string
  semesterLabel: string
  message: string
  suggestion?: string
}

// --- Plan Statistics ---

export interface PlanStatistics {
  totalSemesters: number
  totalCourses: number
  totalUnits: number
  averageUnitsPerSemester: number
  semestersWithOverload: number
  completedCourses: number
  completedUnits: number
  remainingCourses: number
  remainingUnits: number
}

// --- Validation Context & Result ---

export interface PlannedCourseInfo {
  id: string
  courseId: string
  status: string
  addedAt: string
  course: {
    id: string
    code: string
    title: string
    units: number
    termsOffered?: string[]
    tags?: string[]
  }
}

export interface SemesterWithCourses {
  id: string
  term: string
  year: number
  isActive: boolean
  courses: PlannedCourseInfo[]
}

export interface ValidationContext {
  semesters: SemesterWithCourses[]
  completedCourses: CompletedCourseInfo[]
  allCourses: CourseWithPrereqs[]
  university: string
  requiredUnits?: number
}

export interface ValidationResult {
  isValid: boolean
  violations: Violation[]
  statistics: PlanStatistics
}
