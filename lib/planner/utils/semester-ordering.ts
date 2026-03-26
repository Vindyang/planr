/**
 * Utilities for comparing and ordering semesters chronologically
 */

const TERM_ORDER: Record<string, number> = {
  "Term 1": 0,
  "Term 2": 1,
  "Term 3": 2,
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

  if (currentTermOrder === 2) { // Term 3 -> Term 1 next year
    return { term: "Term 1", year: semester.year + 1 }
  } else if (currentTermOrder === 0) { // Term 1 -> Term 2
    return { term: "Term 2", year: semester.year }
  } else { // Term 2 -> Term 3
    return { term: "Term 3", year: semester.year }
  }
}

/**
 * Get the previous semester before the given one
 */
export function getPreviousSemester(semester: Semester): Semester {
  const currentTermOrder = TERM_ORDER[semester.term] ?? 0

  if (currentTermOrder === 0) { // Term 1 -> Term 3 previous year
    return { term: "Term 3", year: semester.year - 1 }
  } else if (currentTermOrder === 1) { // Term 2 -> Term 1
    return { term: "Term 1", year: semester.year }
  } else { // Term 3 -> Term 2
    return { term: "Term 2", year: semester.year }
  }
}
