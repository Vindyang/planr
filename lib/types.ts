
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
  missingPrerequisites: string[]; // IDs of missing hard prereq courses
  softWarnings: string[];         // IDs of soft prereqs not met (course still eligible)
  corequisiteNeeded: string[];    // IDs of corequisites needed concurrently
  warnings?: string[];
}

export interface EligibleCourse {
  course: Course;
  eligibility: EligibilityResult;
}

// API response types

export interface StudentProfileResponse {
  student: {
    id: string;
    university: string;
    major: string;
    secondMajor: string | null;
    minor: string | null;
    year: number;
    enrollmentYear: number;
    expectedGraduationYear: number;
    gpa: number;
    user: {
      name: string;
      email: string;
    };
    completedCourses: CompletedCourseWithDetails[];
  };
}

export interface CompletedCourseWithDetails {
  id: string;
  courseId: string;
  grade: string;
  term: string;
  course: {
    id: string;
    code: string;
    title: string;
    units: number;
  };
}

export interface CourseListResponse {
  courses: Array<{
    id: string;
    code: string;
    title: string;
    description: string;
    units: number;
    termsOffered: string[];
    tags: string[];
    prerequisites: Array<{
      prerequisiteCourseId: string;
      type: string;
    }>;
  }>;
}
