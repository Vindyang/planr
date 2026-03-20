import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hashPassword } from "better-auth/crypto"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ============================================================
// 1. Clear All Data
// ============================================================
async function clearAllData() {
  console.log("🧹 Clearing existing data...")

  await prisma.auditLog.deleteMany()
  await prisma.professorReview.deleteMany()
  await prisma.courseReview.deleteMany()
  await prisma.courseInstructor.deleteMany()
  await prisma.professor.deleteMany()
  await prisma.plannedCourse.deleteMany()
  await prisma.semesterPlan.deleteMany()
  await prisma.completedCourse.deleteMany()
  await prisma.student.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.prerequisite.deleteMany()
  await prisma.course.deleteMany()
  await prisma.graduationRequirement.deleteMany()
  await prisma.department.deleteMany()
  await prisma.university.deleteMany()

  console.log("✅ Cleared existing data")
}

// ============================================================
// 2. Create Universities & Departments
// ============================================================
async function createUniversitiesAndDepartments() {
  console.log("🏫 Creating universities and departments...")

  // Create SMU
  const smu = await prisma.university.create({
    data: {
      code: "SMU",
      name: "Singapore Management University",
      isActive: true,
    },
  })

  // Create SMU Departments
  const isDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "IS",
      name: "Information Systems",
      description: "School of Computing and Information Systems",
      isActive: true,
    },
  })

  const csDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "CS",
      name: "Computer Science",
      description: "Computer Science Program",
      isActive: true,
    },
  })

  const sweDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "SWE",
      name: "Software Engineering",
      description: "Software Engineering Program",
      isActive: true,
    },
  })

  const cyberDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "CYBER",
      name: "Cybersecurity",
      description: "Cybersecurity Program",
      isActive: true,
    },
  })

  const dsDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "DS",
      name: "Data Science & Analytics",
      description: "Data Science and Analytics Program",
      isActive: true,
    },
  })

  const clDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "CL",
      name: "Computing & Law",
      description: "Computing and Law Double Degree Program",
      isActive: true,
    },
  })

  const businessDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "BUSINESS",
      name: "Business",
      description: "Lee Kong Chian School of Business",
      isActive: true,
    },
  })

  console.log(`✅ Created SMU with 7 departments (5 SCIS majors + 1 Business)`)

  // Create other universities (for multi-tenant testing)
  const nus = await prisma.university.create({
    data: { code: "NUS", name: "National University of Singapore", isActive: true },
  })

  const ntu = await prisma.university.create({
    data: { code: "NTU", name: "Nanyang Technological University", isActive: true },
  })

  const sutd = await prisma.university.create({
    data: { code: "SUTD", name: "Singapore University of Technology and Design", isActive: true },
  })

  const suss = await prisma.university.create({
    data: { code: "SUSS", name: "Singapore University of Social Sciences", isActive: true },
  })

  console.log(`✅ Created 5 universities total`)

  return { smu, isDept, csDept, sweDept, cyberDept, dsDept, clDept, businessDept, nus, ntu, sutd, suss }
}

// ============================================================
// 3. Create Sample Courses
// ============================================================
async function createSampleCourses(universityId: string, isDeptId: string, csDeptId: string, businessDeptId: string) {
  console.log("📚 Creating sample courses...")

  const courses = await prisma.course.createMany({
    data: [
      // IS Department courses
      {
        code: "IS101",
        universityId,
        departmentId: isDeptId,
        title: "Introduction to Information Systems",
        description: "Fundamental concepts of information systems and their role in organizations.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Core", "Year 1"],
        isActive: true,
      },
      {
        code: "IS210",
        universityId,
        departmentId: isDeptId,
        title: "Database Systems",
        description: "Database design, SQL, and database management systems.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Core", "Year 2"],
        isActive: true,
      },
      {
        code: "IS315",
        universityId,
        departmentId: isDeptId,
        title: "Web Application Development",
        description: "Modern web development using React, Node.js, and databases.",
        units: 4,
        termsOffered: ["Spring"],
        tags: ["Elective", "Year 3"],
        isActive: true,
      },
      {
        code: "IS216",
        universityId,
        departmentId: isDeptId,
        title: "Web Application Development I",
        description: "Introduction to web development with HTML, CSS, and JavaScript.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Core", "Year 2"],
        isActive: true,
      },
      {
        code: "IS112",
        universityId,
        departmentId: isDeptId,
        title: "Data Management",
        description: "Introduction to data management and analytics.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Core", "Year 1"],
        isActive: true,
      },
      // CS Department courses
      {
        code: "CS101",
        universityId,
        departmentId: csDeptId,
        title: "Introduction to Programming",
        description: "Fundamental programming concepts using Python.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Core", "Year 1"],
        isActive: true,
      },
      {
        code: "CS102",
        universityId,
        departmentId: csDeptId,
        title: "Programming Fundamentals",
        description: "Advanced programming concepts and problem-solving.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Core", "Year 1"],
        isActive: true,
      },
      {
        code: "CS201",
        universityId,
        departmentId: csDeptId,
        title: "Data Structures and Algorithms",
        description: "Core data structures and algorithmic techniques.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Core", "Year 2"],
        isActive: true,
      },
      {
        code: "CS202",
        universityId,
        departmentId: csDeptId,
        title: "Software Engineering",
        description: "Software development methodologies and practices.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Core", "Year 2"],
        isActive: true,
      },
      {
        code: "CS203",
        universityId,
        departmentId: csDeptId,
        title: "Computer Networks",
        description: "Networking protocols and distributed systems.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Core", "Year 2"],
        isActive: true,
      },
      {
        code: "CS301",
        universityId,
        departmentId: csDeptId,
        title: "Operating Systems",
        description: "OS design, process management, and memory systems.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Core", "Year 3"],
        isActive: true,
      },
      {
        code: "CS302",
        universityId,
        departmentId: csDeptId,
        title: "Database Management Systems",
        description: "Advanced database concepts and implementation.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Core", "Year 3"],
        isActive: true,
      },
      {
        code: "CS303",
        universityId,
        departmentId: csDeptId,
        title: "Artificial Intelligence",
        description: "Introduction to AI and machine learning concepts.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Elective", "Year 3"],
        isActive: true,
      },
      {
        code: "CS304",
        universityId,
        departmentId: csDeptId,
        title: "Computer Graphics",
        description: "3D graphics, rendering, and visualization.",
        units: 4,
        termsOffered: ["Fall"],
        tags: ["Elective", "Year 3"],
        isActive: true,
      },
      {
        code: "CS305",
        universityId,
        departmentId: csDeptId,
        title: "Cybersecurity",
        description: "Security principles and threat mitigation.",
        units: 4,
        termsOffered: ["Spring"],
        tags: ["Elective", "Year 3"],
        isActive: true,
      },
      {
        code: "CS401",
        universityId,
        departmentId: csDeptId,
        title: "Advanced Algorithms",
        description: "Advanced algorithmic techniques and complexity theory.",
        units: 4,
        termsOffered: ["Fall"],
        tags: ["Elective", "Year 4"],
        isActive: true,
      },
      {
        code: "CS402",
        universityId,
        departmentId: csDeptId,
        title: "Distributed Systems",
        description: "Design and implementation of distributed computing systems.",
        units: 4,
        termsOffered: ["Spring"],
        tags: ["Elective", "Year 4"],
        isActive: true,
      },
      {
        code: "CS403",
        universityId,
        departmentId: csDeptId,
        title: "Machine Learning",
        description: "Deep learning and neural networks.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Elective", "Year 4"],
        isActive: true,
      },
      {
        code: "CS404",
        universityId,
        departmentId: csDeptId,
        title: "Cloud Computing",
        description: "Cloud architecture and deployment strategies.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["Elective", "Year 4"],
        isActive: true,
      },
      // Business courses
      {
        code: "BUS101",
        universityId,
        departmentId: businessDeptId,
        title: "Introduction to Business",
        description: "Fundamentals of business management.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education"],
        isActive: true,
      },
      {
        code: "BUS201",
        universityId,
        departmentId: businessDeptId,
        title: "Marketing Principles",
        description: "Marketing strategies and consumer behavior.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education"],
        isActive: true,
      },
      {
        code: "BUS202",
        universityId,
        departmentId: businessDeptId,
        title: "Financial Accounting",
        description: "Accounting principles and financial reporting.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education"],
        isActive: true,
      },
      {
        code: "BUS203",
        universityId,
        departmentId: businessDeptId,
        title: "Business Statistics",
        description: "Statistical methods for business analysis.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education"],
        isActive: true,
      },
      // General Education courses
      {
        code: "MATH101",
        universityId,
        departmentId: null,
        title: "Calculus I",
        description: "Introduction to differential calculus.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education", "Math"],
        isActive: true,
      },
      {
        code: "MATH102",
        universityId,
        departmentId: null,
        title: "Calculus II",
        description: "Introduction to integral calculus.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education", "Math"],
        isActive: true,
      },
      {
        code: "MATH201",
        universityId,
        departmentId: null,
        title: "Linear Algebra",
        description: "Matrices, vectors, and linear transformations.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education", "Math"],
        isActive: true,
      },
      {
        code: "MATH202",
        universityId,
        departmentId: null,
        title: "Discrete Mathematics",
        description: "Logic, sets, and discrete structures.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education", "Math"],
        isActive: true,
      },
      {
        code: "ENG101",
        universityId,
        departmentId: null,
        title: "English Composition",
        description: "Academic writing and communication.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education", "Writing"],
        isActive: true,
      },
      {
        code: "ENG102",
        universityId,
        departmentId: null,
        title: "Technical Writing",
        description: "Professional and technical communication.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education", "Writing"],
        isActive: true,
      },
      {
        code: "ECON101",
        universityId,
        departmentId: null,
        title: "Microeconomics",
        description: "Economic principles and market systems.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education", "Economics"],
        isActive: true,
      },
      {
        code: "ECON102",
        universityId,
        departmentId: null,
        title: "Macroeconomics",
        description: "National economic systems and policy.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education", "Economics"],
        isActive: true,
      },
      {
        code: "PHYS101",
        universityId,
        departmentId: null,
        title: "Physics I",
        description: "Mechanics and thermodynamics.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education", "Science"],
        isActive: true,
      },
      {
        code: "PHIL101",
        universityId,
        departmentId: null,
        title: "Introduction to Philosophy",
        description: "Major philosophical questions and traditions.",
        units: 4,
        termsOffered: ["Fall", "Spring"],
        tags: ["General Education", "Humanities"],
        isActive: true,
      },
    ],
  })

  console.log(`✅ Created ${courses.count} sample courses`)

  return prisma.course.findMany({ where: { universityId } })
}

// ============================================================
// 4. Create Professors
// ============================================================
async function createProfessors(universityId: string, isDeptId: string, csDeptId: string) {
  console.log("👨‍🏫 Creating professors...")

  const professors = []

  // IS Department Professors
  const prof1 = await prisma.professor.create({
    data: {
      name: "Dr. Sarah Johnson",
      universityId,
      departmentId: isDeptId,
    },
  })
  professors.push(prof1)

  const prof2 = await prisma.professor.create({
    data: {
      name: "Prof. Michael Lee",
      universityId,
      departmentId: isDeptId,
    },
  })
  professors.push(prof2)

  const prof3 = await prisma.professor.create({
    data: {
      name: "Dr. Rachel Tan",
      universityId,
      departmentId: isDeptId,
    },
  })
  professors.push(prof3)

  // CS Department Professors
  const prof4 = await prisma.professor.create({
    data: {
      name: "Prof. David Wong",
      universityId,
      departmentId: csDeptId,
    },
  })
  professors.push(prof4)

  const prof5 = await prisma.professor.create({
    data: {
      name: "Dr. Emily Zhang",
      universityId,
      departmentId: csDeptId,
    },
  })
  professors.push(prof5)

  console.log(`✅ Created ${professors.length} professors`)
  return professors
}

// ============================================================
// 5. Link Professors to Courses
// ============================================================
async function createCourseInstructors(courses: any[], professors: any[]) {
  console.log("🔗 Linking professors to courses...")

  // IS101 - Dr. Sarah Johnson
  await prisma.courseInstructor.create({
    data: {
      courseId: courses[0].id, // IS101
      professorId: professors[0].id, // Dr. Sarah Johnson
      term: "Fall 2024",
    },
  })

  // IS210 - Prof. Michael Lee
  await prisma.courseInstructor.create({
    data: {
      courseId: courses[1].id, // IS210
      professorId: professors[1].id, // Prof. Michael Lee
      term: "Fall 2024",
    },
  })

  // IS315 - Dr. Rachel Tan
  await prisma.courseInstructor.create({
    data: {
      courseId: courses[2].id, // IS315
      professorId: professors[2].id, // Dr. Rachel Tan
      term: "Spring 2025",
    },
  })

  // CS101 - Prof. David Wong
  await prisma.courseInstructor.create({
    data: {
      courseId: courses[3].id, // CS101
      professorId: professors[3].id, // Prof. David Wong
      term: "Fall 2024",
    },
  })

  // CS201 - Dr. Emily Zhang
  await prisma.courseInstructor.create({
    data: {
      courseId: courses[4].id, // CS201
      professorId: professors[4].id, // Dr. Emily Zhang
      term: "Fall 2024",
    },
  })

  console.log(`✅ Created course instructor assignments`)
}

// ============================================================
// 6. Create Prerequisites
// ============================================================
async function createPrerequisites(courses: any[]) {
  console.log("📋 Creating course prerequisites...")

  // IS210 requires IS101
  await prisma.prerequisite.create({
    data: {
      courseId: courses[1].id, // IS210
      prerequisiteCourseId: courses[0].id, // IS101
      type: "HARD",
    },
  })

  // IS315 requires IS210
  await prisma.prerequisite.create({
    data: {
      courseId: courses[2].id, // IS315
      prerequisiteCourseId: courses[1].id, // IS210
      type: "HARD",
    },
  })

  // CS201 requires CS101
  await prisma.prerequisite.create({
    data: {
      courseId: courses[4].id, // CS201
      prerequisiteCourseId: courses[3].id, // CS101
      type: "HARD",
    },
  })

  console.log(`✅ Created course prerequisites`)
}

// ============================================================
// 7. Create Test Students
// ============================================================
async function createTestStudents(universityId: string, isDeptId: string, courses: any[]) {
  console.log("👨‍🎓 Creating test students...")

  const passwordHash = await hashPassword("student123")
  const students = []

  // Helper function to get course by code
  const getCourseByCode = (code: string) => courses.find(c => c.code === code)

  // 1. Freshman - Year 1, GPA 0.0, 0 completed courses
  const freshman = await prisma.user.create({
    data: {
      email: "freshman@smu.edu.sg",
      name: "Fresh Freshman",
      emailVerified: true,
      role: "STUDENT",
      accounts: {
        create: {
          id: "account-freshman",
          accountId: "freshman@smu.edu.sg",
          providerId: "credential",
          password: passwordHash,
        },
      },
      student: {
        create: {
          studentId: "01000001",
          universityId,
          majorId: isDeptId,
          year: 1,
          enrollmentYear: 2024,
          expectedGraduationYear: 2028,
          gpa: 0.0,
        },
      },
    },
  })
  const freshmanStudent = await prisma.student.findUnique({ where: { userId: freshman.id } })
  if (freshmanStudent) students.push(freshmanStudent)
  console.log(`  ✅ Created freshman@smu.edu.sg - Year 1, GPA 0.0, 0 courses`)

  // 2. Sophomore - Year 2, GPA 3.5, 8 completed courses
  const sophomore = await prisma.user.create({
    data: {
      email: "sophomore@smu.edu.sg",
      name: "Sophie Sophomore",
      emailVerified: true,
      role: "STUDENT",
      accounts: {
        create: {
          id: "account-sophomore",
          accountId: "sophomore@smu.edu.sg",
          providerId: "credential",
          password: passwordHash,
        },
      },
      student: {
        create: {
          studentId: "01000002",
          universityId,
          majorId: isDeptId,
          year: 2,
          enrollmentYear: 2023,
          expectedGraduationYear: 2027,
          gpa: 3.5,
        },
      },
    },
  })
  const sophomoreStudent = await prisma.student.findUnique({ where: { userId: sophomore.id } })
  if (sophomoreStudent) {
    // Add 8 completed courses
    await prisma.completedCourse.createMany({
      data: [
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("IS101")!.id, grade: "A-", term: "Fall 2023" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("CS101")!.id, grade: "B+", term: "Fall 2023" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("MATH101")!.id, grade: "A", term: "Fall 2023" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("ENG101")!.id, grade: "B", term: "Fall 2023" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("IS112")!.id, grade: "A-", term: "Spring 2024" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("CS102")!.id, grade: "B+", term: "Spring 2024" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("MATH102")!.id, grade: "A", term: "Spring 2024" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("ECON101")!.id, grade: "B+", term: "Spring 2024" },
      ],
    })
    students.push(sophomoreStudent)
  }
  console.log(`  ✅ Created sophomore@smu.edu.sg - Year 2, GPA 3.5, 8 courses`)

  // 3. Junior - Year 3, GPA 3.7, 20 completed courses
  const junior = await prisma.user.create({
    data: {
      email: "junior@smu.edu.sg",
      name: "Junior Jackson",
      emailVerified: true,
      role: "STUDENT",
      accounts: {
        create: {
          id: "account-junior",
          accountId: "junior@smu.edu.sg",
          providerId: "credential",
          password: passwordHash,
        },
      },
      student: {
        create: {
          studentId: "01000003",
          universityId,
          majorId: isDeptId,
          year: 3,
          enrollmentYear: 2022,
          expectedGraduationYear: 2026,
          gpa: 3.7,
        },
      },
    },
  })
  const juniorStudent = await prisma.student.findUnique({ where: { userId: junior.id } })
  if (juniorStudent) {
    // Add 20 completed courses
    await prisma.completedCourse.createMany({
      data: [
        // Year 1 - Fall
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS101")!.id, grade: "A", term: "Fall 2022" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS101")!.id, grade: "A-", term: "Fall 2022" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("MATH101")!.id, grade: "A", term: "Fall 2022" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("ENG101")!.id, grade: "B+", term: "Fall 2022" },
        // Year 1 - Spring
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS112")!.id, grade: "A", term: "Spring 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS102")!.id, grade: "A-", term: "Spring 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("MATH102")!.id, grade: "A", term: "Spring 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("ECON101")!.id, grade: "A-", term: "Spring 2023" },
        // Year 2 - Fall
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS210")!.id, grade: "A-", term: "Fall 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS201")!.id, grade: "A", term: "Fall 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("MATH201")!.id, grade: "A-", term: "Fall 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("BUS101")!.id, grade: "B+", term: "Fall 2023" },
        // Year 2 - Spring
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS216")!.id, grade: "A", term: "Spring 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS202")!.id, grade: "A-", term: "Spring 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("MATH202")!.id, grade: "A", term: "Spring 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("ENG102")!.id, grade: "B+", term: "Spring 2024" },
        // Year 3 - Fall
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS315")!.id, grade: "A", term: "Fall 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS301")!.id, grade: "A-", term: "Fall 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS303")!.id, grade: "A", term: "Fall 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("BUS201")!.id, grade: "B+", term: "Fall 2024" },
      ],
    })
    students.push(juniorStudent)
  }
  console.log(`  ✅ Created junior@smu.edu.sg - Year 3, GPA 3.7, 20 courses`)

  // 4. Senior - Year 4, GPA 3.8, 32 completed courses
  const senior = await prisma.user.create({
    data: {
      email: "senior@smu.edu.sg",
      name: "Senior Sarah",
      emailVerified: true,
      role: "STUDENT",
      accounts: {
        create: {
          id: "account-senior",
          accountId: "senior@smu.edu.sg",
          providerId: "credential",
          password: passwordHash,
        },
      },
      student: {
        create: {
          studentId: "01000004",
          universityId,
          majorId: isDeptId,
          year: 4,
          enrollmentYear: 2021,
          expectedGraduationYear: 2025,
          gpa: 3.8,
        },
      },
    },
  })
  const seniorStudent = await prisma.student.findUnique({ where: { userId: senior.id } })
  if (seniorStudent) {
    // Add 32 completed courses
    await prisma.completedCourse.createMany({
      data: [
        // Year 1 - Fall
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS101")!.id, grade: "A", term: "Fall 2021" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS101")!.id, grade: "A", term: "Fall 2021" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("MATH101")!.id, grade: "A", term: "Fall 2021" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("ENG101")!.id, grade: "A-", term: "Fall 2021" },
        // Year 1 - Spring
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS112")!.id, grade: "A", term: "Spring 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS102")!.id, grade: "A", term: "Spring 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("MATH102")!.id, grade: "A", term: "Spring 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("ECON101")!.id, grade: "A-", term: "Spring 2022" },
        // Year 2 - Fall
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS210")!.id, grade: "A", term: "Fall 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS201")!.id, grade: "A", term: "Fall 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("MATH201")!.id, grade: "A-", term: "Fall 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("BUS101")!.id, grade: "A", term: "Fall 2022" },
        // Year 2 - Spring
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS216")!.id, grade: "A", term: "Spring 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS202")!.id, grade: "A", term: "Spring 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS203")!.id, grade: "A-", term: "Spring 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("MATH202")!.id, grade: "A", term: "Spring 2023" },
        // Year 3 - Fall
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS315")!.id, grade: "A", term: "Fall 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS301")!.id, grade: "A", term: "Fall 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS302")!.id, grade: "A-", term: "Fall 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS303")!.id, grade: "A", term: "Fall 2023" },
        // Year 3 - Spring
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS304")!.id, grade: "A-", term: "Spring 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS305")!.id, grade: "A", term: "Spring 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("BUS201")!.id, grade: "A", term: "Spring 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("ENG102")!.id, grade: "A-", term: "Spring 2024" },
        // Year 4 - Fall
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS401")!.id, grade: "A", term: "Fall 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS403")!.id, grade: "A", term: "Fall 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS404")!.id, grade: "A-", term: "Fall 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("BUS202")!.id, grade: "A", term: "Fall 2024" },
        // Year 4 - Spring (current)
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS402")!.id, grade: "A", term: "Spring 2025" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("BUS203")!.id, grade: "A-", term: "Spring 2025" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("ECON102")!.id, grade: "A", term: "Spring 2025" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("PHYS101")!.id, grade: "A-", term: "Spring 2025" },
      ],
    })
    students.push(seniorStudent)
  }
  console.log(`  ✅ Created senior@smu.edu.sg - Year 4, GPA 3.8, 32 courses`)

  // 5. Struggling - Year 3, GPA 2.3, 12 courses, D in CS102
  const struggling = await prisma.user.create({
    data: {
      email: "struggling@smu.edu.sg",
      name: "Struggling Student",
      emailVerified: true,
      role: "STUDENT",
      accounts: {
        create: {
          id: "account-struggling",
          accountId: "struggling@smu.edu.sg",
          providerId: "credential",
          password: passwordHash,
        },
      },
      student: {
        create: {
          studentId: "01000005",
          universityId,
          majorId: isDeptId,
          year: 3,
          enrollmentYear: 2022,
          expectedGraduationYear: 2026,
          gpa: 2.3,
        },
      },
    },
  })
  const strugglingStudent = await prisma.student.findUnique({ where: { userId: struggling.id } })
  if (strugglingStudent) {
    // Add 12 completed courses with lower grades, including D in CS102
    await prisma.completedCourse.createMany({
      data: [
        // Year 1 - Fall
        { studentId: strugglingStudent.id, courseId: getCourseByCode("IS101")!.id, grade: "C+", term: "Fall 2022" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("CS101")!.id, grade: "C", term: "Fall 2022" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("MATH101")!.id, grade: "C-", term: "Fall 2022" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("ENG101")!.id, grade: "B-", term: "Fall 2022" },
        // Year 1 - Spring
        { studentId: strugglingStudent.id, courseId: getCourseByCode("IS112")!.id, grade: "C", term: "Spring 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("CS102")!.id, grade: "D", term: "Spring 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("MATH102")!.id, grade: "C", term: "Spring 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("ECON101")!.id, grade: "C+", term: "Spring 2023" },
        // Year 2 - Fall
        { studentId: strugglingStudent.id, courseId: getCourseByCode("IS210")!.id, grade: "C-", term: "Fall 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("MATH201")!.id, grade: "C", term: "Fall 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("BUS101")!.id, grade: "B", term: "Fall 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("PHIL101")!.id, grade: "B+", term: "Fall 2023" },
      ],
    })
    students.push(strugglingStudent)
  }
  console.log(`  ✅ Created struggling@smu.edu.sg - Year 3, GPA 2.3, 12 courses (D in CS102)`)

  console.log(`✅ Created ${students.length} test students total`)
  return students
}

// ============================================================
// 8. Create Course and Professor Reviews
// ============================================================
async function createReviews(student: any, courses: any[], professors: any[]) {
  console.log("⭐ Creating course and professor reviews...")

  // Course Review for IS101
  await prisma.courseReview.create({
    data: {
      studentId: student.id,
      courseId: courses[0].id, // IS101
      rating: 5,
      difficultyRating: 3,
      workloadRating: 3,
      content: "Great introductory course! Dr. Johnson explains concepts clearly and the assignments are practical.",
      term: "Fall 2023",
    },
  })

  // Course Review for CS101
  await prisma.courseReview.create({
    data: {
      studentId: student.id,
      courseId: courses[3].id, // CS101
      rating: 4,
      difficultyRating: 2,
      workloadRating: 3,
      content: "Solid programming fundamentals. Good for beginners but can be slow if you have prior experience.",
      term: "Fall 2023",
    },
  })

  // Professor Review for Dr. Sarah Johnson (IS101)
  await prisma.professorReview.create({
    data: {
      studentId: student.id,
      professorId: professors[0].id, // Dr. Sarah Johnson
      courseId: courses[0].id, // IS101
      rating: 5,
      difficultyRating: 3,
      workloadRating: 3,
      content: "Dr. Johnson is an excellent teacher. She's approachable, responsive, and really cares about student learning.",
      term: "Fall 2023",
    },
  })

  // Professor Review for Prof. David Wong (CS101)
  await prisma.professorReview.create({
    data: {
      studentId: student.id,
      professorId: professors[3].id, // Prof. David Wong
      courseId: courses[3].id, // CS101
      rating: 4,
      difficultyRating: 2,
      workloadRating: 3,
      content: "Prof. Wong is knowledgeable and organized. Lectures can be a bit dry but the content is solid.",
      term: "Fall 2023",
    },
  })

  console.log(`✅ Created course and professor reviews`)
}

// ============================================================
// 5. Create Admin Users
// ============================================================
async function createAdminUsers(smuId: string, isDeptId: string) {
  console.log("👨‍💼 Creating admin users...")

  const passwordHash = await hashPassword("admin123")

  // Super Admin (platform-wide access)
  await prisma.user.create({
    data: {
      email: "superadmin@planr.com",
      name: "Super Admin",
      emailVerified: true,
      role: "SUPER_ADMIN",
      assignedUniversityId: null, // Access to ALL universities
      assignedDepartmentId: null,
      accounts: {
        create: {
          id: "account-superadmin",
          accountId: "superadmin@planr.com",
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  })
  console.log(`  ✅ Created superadmin@planr.com (SUPER_ADMIN - All Universities)`)

  // SMU Admin (university-wide access)
  await prisma.user.create({
    data: {
      email: "admin@smu.edu.sg",
      name: "SMU Administrator",
      emailVerified: true,
      role: "ADMIN",
      assignedUniversityId: smuId, // Restricted to SMU
      assignedDepartmentId: null,   // Access to all SMU departments
      accounts: {
        create: {
          id: "account-smu-admin",
          accountId: "admin@smu.edu.sg",
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  })
  console.log(`  ✅ Created admin@smu.edu.sg (ADMIN - SMU University)`)

  // IS Department Coordinator
  await prisma.user.create({
    data: {
      email: "coordinator@smu.edu.sg",
      name: "IS Coordinator",
      emailVerified: true,
      role: "COORDINATOR",
      assignedUniversityId: smuId,   // Restricted to SMU
      assignedDepartmentId: isDeptId, // Restricted to IS department
      accounts: {
        create: {
          id: "account-is-coordinator",
          accountId: "coordinator@smu.edu.sg",
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  })
  console.log(`  ✅ Created coordinator@smu.edu.sg (COORDINATOR - SMU IS Department)`)
}

// ============================================================
// Main Execution
// ============================================================
async function main() {
  console.log("🌱 Starting multi-tenant seed...\n")

  await clearAllData()

  const { smu, isDept, csDept, businessDept } = await createUniversitiesAndDepartments()

  const courses = await createSampleCourses(smu.id, isDept.id, csDept.id, businessDept.id)

  const professors = await createProfessors(smu.id, isDept.id, csDept.id)

  await createCourseInstructors(courses, professors)

  await createPrerequisites(courses)

  const students = await createTestStudents(smu.id, isDept.id, courses)

  if (students && students.length > 0) {
    await createReviews(students[1], courses, professors) // Use sophomore for reviews
  }

  await createAdminUsers(smu.id, isDept.id)

  console.log("\n✅ Seed completed successfully!")
  console.log("\n📝 Test Accounts:")
  console.log("  Superadmin: superadmin@planr.com / admin123")
  console.log("  SMU Admin: admin@smu.edu.sg / admin123")
  console.log("  IS Coordinator: coordinator@smu.edu.sg / admin123")
  console.log("\n  Students (all use password: student123):")
  console.log("    - freshman@smu.edu.sg (Year 1, GPA 0.0, 0 courses)")
  console.log("    - sophomore@smu.edu.sg (Year 2, GPA 3.5, 8 courses)")
  console.log("    - junior@smu.edu.sg (Year 3, GPA 3.7, 20 courses)")
  console.log("    - senior@smu.edu.sg (Year 4, GPA 3.8, 32 courses)")
  console.log("    - struggling@smu.edu.sg (Year 3, GPA 2.3, 12 courses, D in CS102)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
