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
  PlannedCourseData,
  SemesterWithCourses,
  PlanData,
  ValidationContext,
  DragItem,
  DropTarget,
  AvailableCourse,
  CreateSemesterRequest,
  AddCourseRequest,
  MoveCourseRequest,
  PlansListResponse,
  SemesterResponse,
  PlannedCourseResponse,
  ValidationResponse,
} from "./types"

// Semester ordering utilities
export {
  compareSemesters,
  buildSemesterOrderMap,
  getSemesterLabel,
  isBefore,
  isAfter,
  isSameSemester,
  getNextSemester,
  getPreviousSemester,
  generateSemesterRange,
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
