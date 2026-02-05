/**
 * Enhanced Eligibility System
 *
 * This module provides comprehensive prerequisite checking with:
 * - Grade requirement validation (C or better for hard prereqs)
 * - Prerequisite chain/dependency graph traversal
 * - Suggested course sequences (topological sort)
 * - University-specific rules
 */

// Constants
export { EligibilityStatus, MIN_GRADE_FOR_HARD_PREREQ, MAX_PREREQ_CHAIN_DEPTH } from "./constants"

// Types
export type {
  PrerequisiteType,
  MissingPrerequisite,
  GradeDeficiency,
  DetailedEligibilityResult,
  PrerequisiteChainNode,
  SuggestedCourse,
  GraphNode,
  GraphEdge,
  PrerequisiteGraph,
  UniversityRules,
  EligibilityOptions,
  EligibilityCheckResponse,
  CourseWithPrereqs,
  CompletedCourseInfo,
  EligibleCourseWithDetails,
  CircularDependency,
} from "./types"

// Grade utilities
export {
  meetsGradeRequirement,
  isPassingGrade,
  getGradeDeficit,
  isInProgressGrade,
  formatGradeRequirementMessage,
} from "./grade-utils"

// Core eligibility checking
export {
  checkCourseEligibility,
  getEligibleCoursesWithDetails,
  getAllCoursesWithEligibility,
  explainIneligibility,
} from "./checker"

// Prerequisite graph algorithms
export {
  buildPrerequisiteGraph,
  getPrerequisiteChain,
  getTransitivePrerequisites,
  suggestPrerequisiteSequence,
  detectCircularDependencies,
  getUnlockedCourses,
  getMaxPrerequisiteDepth,
} from "./prerequisite-graph"

// University rules
export { getRulesForUniversity, validateRules, getSupportedUniversities } from "./rules"
