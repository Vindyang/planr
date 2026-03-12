import { Course, EligibilityResult, EligibleCourse, Student } from "@/lib/types";

export function checkEligibility(
  course: Course,
  student: Student,
): EligibilityResult {
  const completedCourseIds = new Set(
    student.completedCourses.map((c) => c.courseId),
  );
  const missingPrereqs: string[] = [];
  const softWarnings: string[] = [];
  const corequisiteNeeded: string[] = [];

  for (const prereq of course.prerequisites) {
    const completed = completedCourseIds.has(prereq.courseId);

    if (prereq.type === "hard" && !completed) {
      missingPrereqs.push(prereq.courseId);
    } else if (prereq.type === "soft" && !completed) {
      softWarnings.push(prereq.courseId);
    } else if (prereq.type === "corequisite" && !completed) {
      corequisiteNeeded.push(prereq.courseId);
    }
  }

  return {
    isEligible: missingPrereqs.length === 0,
    missingPrerequisites: missingPrereqs,
    softWarnings,
    corequisiteNeeded,
  };
}

export function getEligibleCourses(
  allCourses: Course[],
  student: Student,
): EligibleCourse[] {
  const completedCourseIds = new Set(
    student.completedCourses.map((c) => c.courseId),
  );
  const notTakenCourses = allCourses.filter(
    (c) => !completedCourseIds.has(c.id),
  );

  return notTakenCourses
    .map((course) => ({
      course,
      eligibility: checkEligibility(course, student),
    }))
    .filter((ec) => ec.eligibility.isEligible);
}
