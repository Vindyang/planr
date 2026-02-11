/**
 * Utilities for comparing and ordering semesters chronologically
 */

const TERM_ORDER: Record<string, number> = {
  Spring: 0,
  Summer: 1,
  Fall: 2,
}

export interface Semester {
  term: string
  year: number
}

/**
 * Compare two semesters chronologically
 * Returns: negative if a < b, 0 if equal, positive if a > b
 */
export function compareSemesters(a: Semester, b: Semester): number {
  if (a.year !== b.year) {
    return a.year - b.year
  }
  return (TERM_ORDER[a.term] ?? 0) - (TERM_ORDER[b.term] ?? 0)
}

/**
 * Build a map of semester IDs to their chronological order
 */
export function buildSemesterOrderMap(semesters: (Semester & { id: string })[]): Map<string, number> {
  const sorted = [...semesters].sort(compareSemesters)
  const orderMap = new Map<string, number>()
  sorted.forEach((sem, index) => {
    orderMap.set(sem.id, index)
  })
  return orderMap
}

/**
 * Get a human-readable label for a semester
 */
export function getSemesterLabel(semester: Semester): string {
  return `${semester.term} ${semester.year}`
}

/**
 * Check if semester A is before semester B
 */
export function isBefore(a: Semester, b: Semester): boolean {
  return compareSemesters(a, b) < 0
}

/**
 * Check if semester A is after semester B
 */
export function isAfter(a: Semester, b: Semester): boolean {
  return compareSemesters(a, b) > 0
}

/**
 * Get the next semester after the given one
 */
export function getNextSemester(semester: Semester): Semester {
  const currentTermOrder = TERM_ORDER[semester.term] ?? 0

  if (currentTermOrder === 2) { // Fall -> Spring next year
    return { term: "Spring", year: semester.year + 1 }
  } else if (currentTermOrder === 0) { // Spring -> Summer
    return { term: "Summer", year: semester.year }
  } else { // Summer -> Fall
    return { term: "Fall", year: semester.year }
  }
}

/**
 * Get the previous semester before the given one
 */
export function getPreviousSemester(semester: Semester): Semester {
  const currentTermOrder = TERM_ORDER[semester.term] ?? 0

  if (currentTermOrder === 0) { // Spring -> Fall previous year
    return { term: "Fall", year: semester.year - 1 }
  } else if (currentTermOrder === 1) { // Summer -> Spring
    return { term: "Spring", year: semester.year }
  } else { // Fall -> Summer
    return { term: "Summer", year: semester.year }
  }
}
