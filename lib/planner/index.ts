/**
 * Planner Module
 *
 * Provides utilities for multi-semester course planning including:
 * - Semester ordering and comparison
 * - Plan validation (prerequisites, corequisites, duplicates, overload, term availability)
 * - Type definitions for planner operations
 */

// Types
export type {
  ViolationType,
  ViolationSeverity,
  Violation,
  PlanStatistics,
  ValidationResult,
  ValidationContext,
  SemesterWithCourses,
  PlannedCourseInfo,
  CompletedCourseInfo,
  CourseWithPrereqs,
} from "./types"

// Semester ordering utilities
export {
  compareSemesters,
  buildSemesterOrderMap,
  getSemesterLabel,
  isBefore,
  isAfter,
  getNextSemester,
  getPreviousSemester,
} from "./utils/semester-ordering"

// Validation
export {
  validatePlan,
  validatePrerequisites,
  validateCorequisites,
  validateDuplicates,
  validateOverload,
  validateTermAvailability,
} from "./validation"
