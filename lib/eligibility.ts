
import { Course, EligibilityResult, Student } from "./types";

export function checkEligibility(course: Course, student: Student): EligibilityResult {
  const completedCourseIds = new Set(student.completedCourses.map(c => c.courseId));
  const missingPrereqs: string[] = [];

  for (const prereq of course.prerequisites) {
    if (prereq.type === 'hard') {
      if (!completedCourseIds.has(prereq.courseId)) {
        missingPrereqs.push(prereq.courseId);
      }
    }
    // We can handle soft/coreqs here later if needed
  }

  return {
    isEligible: missingPrereqs.length === 0,
    missingPrerequisites: missingPrereqs,
  };
}

export function getEligibleCourses(allCourses: Course[], student: Student): Course[] {
  // Filter out courses already taken
  const completedCourseIds = new Set(student.completedCourses.map(c => c.courseId));
  const notTakenCourses = allCourses.filter(c => !completedCourseIds.has(c.id));

  return notTakenCourses.filter(course => {
    const { isEligible } = checkEligibility(course, student);
    return isEligible;
  });
}
