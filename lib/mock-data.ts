
import { Course, Student } from "./types";

export const MOCK_COURSES: Course[] = [
  {
    id: "CS101",
    code: "CS101",
    title: "Introduction to Computing",
    description: "Fundamental concepts of computing and programming.",
    units: 1,
    prerequisites: [],
    termsOffered: ["Fall", "Spring"],
    tags: ["Core"],
  },
  {
    id: "CS102",
    code: "CS102",
    title: "Programming Fundamentals",
    description: "Basic programming constructs, functions, and arrays.",
    units: 1,
    prerequisites: [{ courseId: "CS101", type: "hard" }],
    termsOffered: ["Fall", "Spring"],
    tags: ["Core"],
  },
  {
    id: "CS201",
    code: "CS201",
    title: "Data Structures",
    description: "Lists, stacks, queues, trees, graphs, and hash tables.",
    units: 1,
    prerequisites: [{ courseId: "CS102", type: "hard" }],
    termsOffered: ["Fall", "Spring"],
    tags: ["Core"],
  },
  {
    id: "CS202",
    code: "CS202",
    title: "Algorithms",
    description: "Analysis of algorithms, sorting, searching, and graph algorithms.",
    units: 1,
    prerequisites: [{ courseId: "CS201", type: "hard" }],
    termsOffered: ["Fall", "Spring"],
    tags: ["Core"],
  },
  {
    id: "CS301",
    code: "CS301",
    title: "Software Engineering",
    description: "Principles of software design, development, and testing.",
    units: 1,
    prerequisites: [{ courseId: "CS201", type: "hard" }],
    termsOffered: ["Spring"],
    tags: ["Elective"],
  },
   {
    id: "CS305",
    code: "CS305",
    title: "Artificial Intelligence",
    description: "Introduction to AI, search, logic, and machine learning.",
    units: 1,
    prerequisites: [{ courseId: "CS202", type: "hard" }],
    termsOffered: ["Fall"],
    tags: ["Elective", "AI"],
  },
   {
    id: "CS206",
    code: "CS206",
    title: "Software Product Management",
    description: "Managing the software product lifecycle from conception to launch.",
    units: 1,
    prerequisites: [{ courseId: "CS102", type: "hard" }],
    termsOffered: ["Fall", "Spring"],
    tags: ["Core"],
  }
];

export const MOCK_STUDENT: Student = {
  id: "S12345",
  name: "Rachel Lim",
  major: "Computer Science",
  year: 2,
  enrollmentYear: 2024,
  gpa: 3.67,
  completedCourses: [
    { courseId: "CS101", grade: "A", term: "2024-Fall" },
    { courseId: "CS102", grade: "B+", term: "2024-Spring" },
    // Has NOT taken CS201 yet
  ],
};
