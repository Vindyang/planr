/**
 * Prerequisite graph construction and traversal algorithms
 */

import { MAX_PREREQ_CHAIN_DEPTH, MIN_GRADE_FOR_HARD_PREREQ } from "./constants"
import {
  PrerequisiteGraph,
  GraphNode,
  GraphEdge,
  PrerequisiteChainNode,
  SuggestedCourse,
  CourseWithPrereqs,
  CompletedCourseInfo,
  CircularDependency,
  PrerequisiteType,
} from "./types"
import { meetsGradeRequirement } from "./grade-utils"

/**
 * Build a prerequisite graph from a list of courses
 * Edges point FROM prerequisites TO courses that require them
 */
export function buildPrerequisiteGraph(courses: CourseWithPrereqs[]): PrerequisiteGraph {
  const nodes = new Map<string, GraphNode>()
  const edges = new Map<string, GraphEdge[]>()

  // First pass: Create all nodes
  for (const course of courses) {
    nodes.set(course.id, {
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
    })
    edges.set(course.id, [])
  }

  // Second pass: Create edges (from prerequisite to course that needs it)
  for (const course of courses) {
    for (const prereq of course.prerequisites) {
      const prereqEdges = edges.get(prereq.prerequisiteCourseId) || []
      prereqEdges.push({
        from: prereq.prerequisiteCourseId,
        to: course.id,
        type: prereq.type.toLowerCase() as PrerequisiteType,
        minimumGrade: prereq.type.toUpperCase() === "HARD" ? MIN_GRADE_FOR_HARD_PREREQ : undefined,
      })
      edges.set(prereq.prerequisiteCourseId, prereqEdges)
    }
  }

  return { nodes, edges }
}

/**
 * Get the prerequisite chain for a course as a tree structure
 * Uses DFS to traverse prerequisites recursively
 */
export function getPrerequisiteChain(
  courseId: string,
  coursesMap: Map<string, CourseWithPrereqs>,
  completedMap: Map<string, CompletedCourseInfo>,
  visited: Set<string> = new Set(),
  depth: number = 0
): PrerequisiteChainNode | null {
  // Prevent infinite loops and limit depth
  if (visited.has(courseId) || depth > MAX_PREREQ_CHAIN_DEPTH) {
    return null
  }

  const course = coursesMap.get(courseId)
  if (!course) return null

  visited.add(courseId)

  const completed = completedMap.get(courseId)
  const children: PrerequisiteChainNode[] = []

  // Traverse prerequisites recursively
  for (const prereq of course.prerequisites) {
    const childNode = getPrerequisiteChain(
      prereq.prerequisiteCourseId,
      coursesMap,
      completedMap,
      new Set(visited), // Clone to allow parallel paths
      depth + 1
    )
    if (childNode) {
      children.push(childNode)
    }
  }

  // Determine if grade meets requirement
  let meetsRequirement = false
  if (completed) {
    meetsRequirement = meetsGradeRequirement(completed.grade, MIN_GRADE_FOR_HARD_PREREQ)
  }

  return {
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    depth,
    completed: !!completed,
    grade: completed?.grade,
    meetsRequirement,
    children,
  }
}

/**
 * Get all transitive prerequisites for a course (courses that must be taken before)
 */
export function getTransitivePrerequisites(
  courseId: string,
  coursesMap: Map<string, CourseWithPrereqs>,
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(courseId)) return []

  const course = coursesMap.get(courseId)
  if (!course) return []

  visited.add(courseId)
  const result: string[] = []

  for (const prereq of course.prerequisites) {
    result.push(prereq.prerequisiteCourseId)
    // Recursively get prerequisites of prerequisites
    const transitive = getTransitivePrerequisites(prereq.prerequisiteCourseId, coursesMap, visited)
    result.push(...transitive)
  }

  return result
}

/**
 * Suggest an optimal sequence of courses to take using topological sort
 * Returns courses in the order they should be taken
 */
export function suggestPrerequisiteSequence(
  targetCourseId: string,
  coursesMap: Map<string, CourseWithPrereqs>,
  completedIds: Set<string>
): SuggestedCourse[] {
  // Get all prerequisites transitively
  const allPrereqs = getTransitivePrerequisites(targetCourseId, coursesMap)

  // Include target course
  const relevantCourseIds = [...new Set([...allPrereqs, targetCourseId])]

  // Filter out already completed courses
  const remainingCourseIds = relevantCourseIds.filter((id) => !completedIds.has(id))

  if (remainingCourseIds.length === 0) {
    return []
  }

  // Build in-degree map (count of prerequisites for each course)
  const inDegree = new Map<string, number>()
  for (const courseId of remainingCourseIds) {
    inDegree.set(courseId, 0)
  }

  // Calculate in-degrees based on prerequisites within our set
  for (const courseId of remainingCourseIds) {
    const course = coursesMap.get(courseId)
    if (!course) continue

    for (const prereq of course.prerequisites) {
      if (remainingCourseIds.includes(prereq.prerequisiteCourseId) && !completedIds.has(prereq.prerequisiteCourseId)) {
        inDegree.set(courseId, (inDegree.get(courseId) || 0) + 1)
      }
    }
  }

  // Kahn's algorithm for topological sort
  const queue: string[] = []
  for (const [courseId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(courseId)
    }
  }

  const result: SuggestedCourse[] = []
  let order = 1

  while (queue.length > 0) {
    const courseId = queue.shift()!
    const course = coursesMap.get(courseId)

    if (course) {
      const isTarget = courseId === targetCourseId
      result.push({
        courseId,
        courseCode: course.code,
        courseTitle: course.title,
        order: order++,
        reason: isTarget ? "Target course" : order === 1 ? "No remaining prerequisites" : "Prerequisites satisfied",
      })
    }

    // Decrease in-degree for courses that depend on this one
    for (const remainingId of remainingCourseIds) {
      const remainingCourse = coursesMap.get(remainingId)
      if (!remainingCourse) continue

      const hasPrereq = remainingCourse.prerequisites.some((p) => p.prerequisiteCourseId === courseId)

      if (hasPrereq) {
        const newDegree = (inDegree.get(remainingId) || 1) - 1
        inDegree.set(remainingId, newDegree)
        if (newDegree === 0 && !result.some((r) => r.courseId === remainingId)) {
          queue.push(remainingId)
        }
      }
    }
  }

  return result
}

/**
 * Detect circular dependencies in the prerequisite graph
 * Uses DFS with coloring: WHITE (unvisited), GRAY (in path), BLACK (done)
 */
export function detectCircularDependencies(coursesMap: Map<string, CourseWithPrereqs>): CircularDependency[] {
  const WHITE = 0
  const GRAY = 1
  const BLACK = 2

  const color = new Map<string, number>()
  const parent = new Map<string, string | null>()
  const cycles: CircularDependency[] = []

  // Initialize all nodes as white
  for (const courseId of coursesMap.keys()) {
    color.set(courseId, WHITE)
    parent.set(courseId, null)
  }

  function reconstructCycle(start: string, end: string): string[] {
    const cycle: string[] = [end]
    let current = start

    while (current !== end && parent.get(current) !== null) {
      cycle.push(current)
      current = parent.get(current)!
    }

    cycle.push(end)
    return cycle.reverse()
  }

  function dfs(courseId: string): void {
    color.set(courseId, GRAY)

    const course = coursesMap.get(courseId)
    if (!course) {
      color.set(courseId, BLACK)
      return
    }

    for (const prereq of course.prerequisites) {
      const prereqId = prereq.prerequisiteCourseId
      const prereqColor = color.get(prereqId)

      if (prereqColor === WHITE) {
        parent.set(prereqId, courseId)
        dfs(prereqId)
      } else if (prereqColor === GRAY) {
        // Back edge found - cycle detected
        const cycle = reconstructCycle(courseId, prereqId)
        cycles.push({
          courses: cycle,
          type: prereq.type.toLowerCase() as PrerequisiteType,
        })
      }
    }

    color.set(courseId, BLACK)
  }

  // Run DFS from all unvisited nodes
  for (const courseId of coursesMap.keys()) {
    if (color.get(courseId) === WHITE) {
      dfs(courseId)
    }
  }

  return cycles
}

/**
 * Get courses that are unlocked by completing a given course
 */
export function getUnlockedCourses(
  courseId: string,
  graph: PrerequisiteGraph
): GraphNode[] {
  const edges = graph.edges.get(courseId) || []
  return edges
    .map((edge) => graph.nodes.get(edge.to))
    .filter((node): node is GraphNode => node !== undefined)
}

/**
 * Calculate the maximum depth of the prerequisite tree for a course
 */
export function getMaxPrerequisiteDepth(
  courseId: string,
  coursesMap: Map<string, CourseWithPrereqs>,
  visited: Set<string> = new Set()
): number {
  if (visited.has(courseId)) return 0

  const course = coursesMap.get(courseId)
  if (!course || course.prerequisites.length === 0) return 0

  visited.add(courseId)

  let maxChildDepth = 0
  for (const prereq of course.prerequisites) {
    const childDepth = getMaxPrerequisiteDepth(prereq.prerequisiteCourseId, coursesMap, new Set(visited))
    maxChildDepth = Math.max(maxChildDepth, childDepth)
  }

  return maxChildDepth + 1
}
