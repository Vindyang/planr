import { z } from "zod"
import type { ValidationResult } from "@/lib/planner/types"

// --- User Preferences Schema ---

export const workloadLevelSchema = z.enum(["Easy", "Balanced", "Challenging"])
export type WorkloadLevel = z.infer<typeof workloadLevelSchema>

// SMU uses Term 1 (Aug), Term 2 (Jan), Term 3 (May/Special Term)
export const termSchema = z.enum(["Term 1", "Term 2", "Term 3"])
export type Term = z.infer<typeof termSchema>

export const targetGraduationSchema = z.object({
  term: termSchema,
  year: z.number().int().min(2024).max(2035),
})
export type TargetGraduation = z.infer<typeof targetGraduationSchema>

export const userPreferencesSchema = z.object({
  workloadLevel: workloadLevelSchema,
  startSemester: targetGraduationSchema, // When to start planning from
  targetGraduation: targetGraduationSchema, // When to graduate
  majorTrack: z.string().optional(),
  includeSummerTerm: z.boolean(), // Whether to include Term 3 (summer)
  preferredCourses: z.array(z.string()).optional(), // Course IDs
  avoidCourses: z.array(z.string()).optional(), // Course IDs
})
export type UserPreferences = z.infer<typeof userPreferencesSchema>

// --- AI Roadmap Schema ---

export const aiCourseSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  units: z.number(),
  reasoning: z.string(), // Why AI chose this course for this semester
})
export type AICourse = z.infer<typeof aiCourseSchema>

export const aiSemesterSchema = z.object({
  term: termSchema,
  year: z.number().int(),
  courses: z.array(aiCourseSchema),
  totalUnits: z.number(),
  reasoning: z.string(), // Why this workload/combination
})
export type AISemester = z.infer<typeof aiSemesterSchema>

export const aiRoadmapSchema = z.object({
  semesters: z.array(aiSemesterSchema),
  totalSemesters: z.number().int(),
  totalUnits: z.number(),
  meetsRequirements: z.boolean(),
})
export type AIRoadmap = z.infer<typeof aiRoadmapSchema>

// --- API Response Types ---

export interface GenerateRecommendationResponse {
  roadmap: AIRoadmap
  validation: ValidationResult
  metadata: {
    model: string
    generatedAt: string
    processingTime: number
    usedFallback?: boolean
  }
}

export interface ApplyRecommendationResponse {
  success: boolean
  created: {
    semesterPlans: number
    plannedCourses: number
  }
  replaced?: {
    semesterPlans: number
    deletedCourses: number
  }
}

// --- Context for AI Generation ---

export interface StudentContext {
  id: string
  universityId: string
  majorId: string
  year: number
  enrollmentYear: number
  completedCourseIds: string[]
  completedUnits: number
  gpa: number
}

export interface CourseContext {
  id: string
  code: string
  title: string
  description: string
  units: number
  termsOffered: string[]
  tags: string[]
  prerequisites: {
    courseId: string
    courseCode: string
    type: "HARD" | "SOFT" | "COREQUISITE"
  }[]
  difficultyRating?: number
  workloadRating?: number
}

export interface AIGenerationContext {
  student: StudentContext
  availableCourses: CourseContext[]
  preferences: UserPreferences
  universityRules: {
    minUnitsPerSemester: number
    maxUnitsPerSemester: number
    maxUnitsWithoutOverload: number
    requiredTotalUnits: number
  }
}

// --- Workload Configuration ---

export const WORKLOAD_CONFIG = {
  Easy: { min: 3, max: 4, description: "Light load (about 3-4 modules/term)" },
  Balanced: { min: 4, max: 5, description: "Standard load (about 4-5 modules/term)" },
  Challenging: { min: 5, max: 6, description: "Intensive load (about 5-6 modules/term)" },
} as const
