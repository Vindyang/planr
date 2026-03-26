export const CHECKLIST_KEYS = {
  VISITED_COURSES: "planr_visited_courses",
  CREATED_TERM: "planr_created_term",
  ADDED_COURSE: "planr_added_course",
  DISMISSED: "planr_checklist_dismissed",
} as const

export type ChecklistKey = keyof typeof CHECKLIST_KEYS

export function markChecklistItem(key: ChecklistKey) {
  if (typeof window === "undefined") return
  if (localStorage.getItem(CHECKLIST_KEYS[key])) return
  localStorage.setItem(CHECKLIST_KEYS[key], "true")
  window.dispatchEvent(new CustomEvent("planr_checklist_update"))
}

export function getChecklistState(): Record<ChecklistKey, boolean> {
  if (typeof window === "undefined") {
    return { VISITED_COURSES: false, CREATED_TERM: false, ADDED_COURSE: false, DISMISSED: false }
  }
  return {
    VISITED_COURSES: !!localStorage.getItem(CHECKLIST_KEYS.VISITED_COURSES),
    CREATED_TERM: !!localStorage.getItem(CHECKLIST_KEYS.CREATED_TERM),
    ADDED_COURSE: !!localStorage.getItem(CHECKLIST_KEYS.ADDED_COURSE),
    DISMISSED: !!localStorage.getItem(CHECKLIST_KEYS.DISMISSED),
  }
}
