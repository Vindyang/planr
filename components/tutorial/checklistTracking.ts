import { updateOnboardingStatus } from "@/lib/user/actions"

export const CHECKLIST_KEYS = {
  VISITED_COURSES: "planr_visited_courses",
  CREATED_TERM: "planr_created_term",
  ADDED_COURSE: "planr_added_course",
  DISMISSED: "planr_checklist_dismissed",
} as const

export type ChecklistKey = keyof typeof CHECKLIST_KEYS

export async function markChecklistItem(key: ChecklistKey) {
  if (typeof window === "undefined") return
  
  // Dispatch for instant React UI update
  window.dispatchEvent(
    new CustomEvent("planr_checklist_update", { detail: { key, value: true } })
  )
  
  try {
    // Persist to database in the background
    await updateOnboardingStatus(key, true)
  } catch (err) {
    console.error("Failed to sync checklist", err)
  }
}

