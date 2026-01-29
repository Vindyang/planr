
export interface Prerequisite {
  courseId: string;
  type: 'hard' | 'soft' | 'corequisite'; // hard: must have taken, soft: can take concurrently (if allowed) or recommended, corequisite: must take same sem
}

export interface Course {
  id: string; // e.g., "CS206"
  code: string;
  title: string;
  description: string;
  units: number;
  prerequisites: Prerequisite[];
  termsOffered: string[]; // e.g., ["Fall", "Spring"]
  tags?: string[];
}

export interface CompletedCourse {
  courseId: string;
  grade: string; // e.g., "A", "B+", "IP" (In Progress)
  term: string; // e.g., "2023-Fall"
}

export interface Student {
  id: string;
  name: string;
  major: string;
  year: number; // 1, 2, 3, 4
  enrollmentYear: number;
  completedCourses: CompletedCourse[];
  gpa: number;
}

export interface EligibilityResult {
  isEligible: boolean;
  missingPrerequisites: string[]; // IDs of missing courses
  warnings?: string[];
}
