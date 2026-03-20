import {
  checkCourseEligibility,
  getPrerequisiteChain,
  suggestPrerequisiteSequence,
  CourseWithPrereqs,
  CompletedCourseInfo,
  EligibilityCheckResponse,
} from "@/lib/eligibility"
import { getAllCoursesForUniversity, getCourseWithPrerequisites } from "@/lib/data/courses"
import { getStudentProfile } from "@/lib/data/students"
import { cache } from "react"

// Define types locally if they match what we expect from the DB helpers, 
// othewise we might need to rely on the inference or shared types.
// For now, these helpers return the Prisma types structure we need.

export const getEligibilityForCourse = cache(async (
  userId: string, 
  courseId: string,
  // Optional pre-fetched data to avoid redundant DB calls
  preFetchedStudent?: any,
  preFetchedCourse?: any
): Promise<EligibilityCheckResponse | null> => {
  
  // 1. Get Student (if not provided)
  const student = preFetchedStudent || await getStudentProfile(userId)
  if (!student) return null

  // 2. Get Target Course (if not provided)
  const course = preFetchedCourse || await getCourseWithPrerequisites(courseId)
  if (!course) return null

  // 3. Get All Courses for Graph (Network Heavy - Keep this optimized)
  // We heavily rely on 'getAllCoursesForUniversity' being cached or fast.
  // In a real app, we might cache this graph in memory or Redis.
  const allCourses = await getAllCoursesForUniversity(student.universityId)

  // 4. Transform data for eligibility checker logic
  const courseForCheck: CourseWithPrereqs = {
    id: course.id,
    code: course.code,
    title: course.title,
    units: course.units,
    prerequisites: course.prerequisites.map((p: any) => ({
      prerequisiteCourseId: p.prerequisiteCourseId,
      type: p.type,
      prerequisiteCourse: p.prerequisiteCourse,
    })),
  }

  const completedCourses: CompletedCourseInfo[] = student.completedCourses.map((cc: any) => ({
    courseId: cc.courseId,
    grade: cc.grade,
    course: cc.course,
  }))

  const coursesMap = new Map<string, CourseWithPrereqs>()
  for (const c of allCourses) {
    coursesMap.set(c.id, {
      id: c.id,
      code: c.code,
      title: c.title,
      units: c.units,
      prerequisites: c.prerequisites.map((p) => ({
        prerequisiteCourseId: p.prerequisiteCourseId,
        type: p.type,
        prerequisiteCourse: p.prerequisiteCourse,
      })),
    })
  }

  const completedMap = new Map(
    completedCourses.map((cc) => [cc.courseId, cc])
  )

  // 5. Run Logic
  const eligibility = checkCourseEligibility(
    courseForCheck,
    completedCourses,
    { university: student.university.code }
  )

  const prerequisiteTree = getPrerequisiteChain(
    courseId,
    coursesMap,
    completedMap
  )

  const completedIds = new Set<string>(student.completedCourses.map((cc: any): string => cc.courseId))
  const suggestedSequence = !eligibility.isEligible
    ? suggestPrerequisiteSequence(courseId, coursesMap, completedIds)
    : []

  return {
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    eligibility,
    prerequisiteTree,
    suggestedSequence,
  }
})
