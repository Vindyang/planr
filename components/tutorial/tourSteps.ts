export type TourStep = {
  id: string
  title: string
  description: string
  placement: "right" | "left" | "bottom" | "top"
}

export type TourType = "overview" | "browse-courses" | "create-term" | "add-course"

// Overview tour — highlights the 4 main nav items
export const TOUR_STEPS: TourStep[] = [
  {
    id: "nav-dashboard",
    title: "Dashboard",
    description: "Your home base. See your GPA, eligible courses, and a snapshot of your degree progress.",
    placement: "right",
  },
  {
    id: "nav-planner",
    title: "Degree Planner",
    description: "Build your semester-by-semester degree plan. Prerequisites are checked automatically as you add courses.",
    placement: "right",
  },
  {
    id: "nav-courses",
    title: "Course Catalog",
    description: "Browse every course your university offers. Filter by tag or term, and see what you're eligible to take.",
    placement: "right",
  },
  {
    id: "nav-reviews",
    title: "Reviews",
    description: "Read difficulty and workload ratings from students who've already taken the course.",
    placement: "right",
  },
]

// Task tour — how to browse courses
export const BROWSE_COURSES_TOUR: TourStep[] = [
  {
    id: "courses-search",
    title: "Search for Courses",
    description: "Type a course name or code to quickly find what you're looking for.",
    placement: "bottom",
  },
  {
    id: "courses-card",
    title: "Course Cards",
    description: "Each card shows the course code, units, and your eligibility. Click any card to see full details, prerequisites, and reviews.",
    placement: "bottom",
  },
]

// Task tour — how to create a semester
export const CREATE_TERM_TOUR: TourStep[] = [
  {
    id: "planner-create-term",
    title: "Create Your First Semester",
    description: 'Click "Create Semester" to add your first term. You can create up to 4 terms per academic year.',
    placement: "bottom",
  },
]

// Task tour — how to add a course
export const ADD_COURSE_TOUR: TourStep[] = [
  {
    id: "planner-add-course-btn",
    title: "Add Courses",
    description: 'Click "Add Courses" to search your course catalog and add courses to a specific semester.',
    placement: "bottom",
  },
]

export function getStepsForTourType(type: TourType): TourStep[] {
  switch (type) {
    case "browse-courses": return BROWSE_COURSES_TOUR
    case "create-term": return CREATE_TERM_TOUR
    case "add-course": return ADD_COURSE_TOUR
    default: return TOUR_STEPS
  }
}
