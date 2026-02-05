/**
 * Enhanced eligibility system types
 */

import { EligibilityStatus } from "./constants"

/**
 * Prerequisite types matching the database enum
 */
export type PrerequisiteType = "hard" | "soft" | "corequisite"

/**
 * Information about a missing prerequisite
 */
export interface MissingPrerequisite {
  courseId: string
  courseCode: string
  courseTitle: string
  type: PrerequisiteType
}

/**
 * Information about a grade that doesn't meet requirements
 */
export interface GradeDeficiency {
  courseId: string
  courseCode: string
  courseTitle: string
  requiredGrade: string
  actualGrade: string
  deficit: number // Numeric difference in grade points
}

/**
 * Detailed eligibility check result
 */
export interface DetailedEligibilityResult {
  status: EligibilityStatus
  isEligible: boolean

  // Missing prerequisites categorized by type
  missingHardPrereqs: MissingPrerequisite[]
  softWarnings: MissingPrerequisite[]
  corequisitesNeeded: MissingPrerequisite[]

  // Grade-related issues
  gradeDeficiencies: GradeDeficiency[]

  // Human-readable messages
  reasons: string[]
  suggestions: string[]
}

/**
 * Node in a prerequisite dependency tree
 */
export interface PrerequisiteChainNode {
  courseId: string
  courseCode: string
  courseTitle: string
  depth: number
  completed: boolean
  grade?: string
  meetsRequirement: boolean
  children: PrerequisiteChainNode[]
}

/**
 * Course suggestion with ordering information
 */
export interface SuggestedCourse {
  courseId: string
  courseCode: string
  courseTitle: string
  order: number
  reason: string
}

/**
 * Graph node for prerequisite dependency graph
 */
export interface GraphNode {
  courseId: string
  courseCode: string
  courseTitle: string
}

/**
 * Graph edge representing a prerequisite relationship
 */
export interface GraphEdge {
  from: string // Prerequisite course ID
  to: string // Target course ID (the course that requires the prereq)
  type: PrerequisiteType
  minimumGrade?: string
}

/**
 * Complete prerequisite graph structure
 */
export interface PrerequisiteGraph {
  nodes: Map<string, GraphNode>
  edges: Map<string, GraphEdge[]> // Key is the "from" course ID
}

/**
 * University-specific rules configuration
 */
export interface UniversityRules {
  university: string
  hardPrereqMinGrade: string
  softPrereqMinGrade?: string
  allowConcurrentCorequisites: boolean
}

/**
 * Options for eligibility checking
 */
export interface EligibilityOptions {
  university?: string
  rules?: UniversityRules
}

/**
 * API response for eligibility check endpoint
 */
export interface EligibilityCheckResponse {
  courseId: string
  courseCode: string
  courseTitle: string
  eligibility: DetailedEligibilityResult
  prerequisiteTree: PrerequisiteChainNode | null
  suggestedSequence: SuggestedCourse[]
}

/**
 * Course with prerequisites (input format for eligibility checking)
 */
export interface CourseWithPrereqs {
  id: string
  code: string
  title: string
  units: number
  prerequisites: Array<{
    prerequisiteCourseId: string
    type: string
    prerequisiteCourse?: {
      id: string
      code: string
      title: string
      units: number
    }
  }>
}

/**
 * Completed course with grade info
 */
export interface CompletedCourseInfo {
  courseId: string
  grade: string
  course?: {
    id: string
    code: string
    title: string
    units: number
  }
}

/**
 * Eligible course with detailed eligibility info
 */
export interface EligibleCourseWithDetails {
  course: CourseWithPrereqs
  eligibility: DetailedEligibilityResult
}

/**
 * Circular dependency detection result
 */
export interface CircularDependency {
  courses: string[] // Course IDs in the cycle
  type: PrerequisiteType
}
