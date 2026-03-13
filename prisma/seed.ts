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

  const businessDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "BUSINESS",
      name: "Business",
      description: "Lee Kong Chian School of Business",
      isActive: true,
    },
  })

  console.log(`✅ Created SMU with 3 departments`)

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

  return { smu, isDept, csDept, businessDept, nus, ntu, sutd, suss }
}

// ============================================================
// 3. Create Sample Courses
// ============================================================
async function createSampleCourses(universityId: string, isDeptId: string, csDeptId: string) {
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

  // Student 1
  const user1 = await prisma.user.create({
    data: {
      email: "student1@smu.edu.sg",
      name: "Alice Chen",
      emailVerified: true,
      role: "STUDENT",
      accounts: {
        create: {
          id: "account-student1",
          accountId: "student1@smu.edu.sg",
          providerId: "credential",
          password: passwordHash,
        },
      },
      student: {
        create: {
          studentId: "01234567",
          universityId,
          majorId: isDeptId,
          year: 2,
          enrollmentYear: 2023,
          expectedGraduationYear: 2027,
          gpa: 3.8,
        },
      },
    },
  })

  // Add completed courses for the student
  const student = await prisma.student.findUnique({
    where: { userId: user1.id },
  })

  if (student) {
    // Student completed IS101 and CS101
    await prisma.completedCourse.createMany({
      data: [
        {
          studentId: student.id,
          courseId: courses[0].id, // IS101
          grade: "A",
          term: "Fall 2023",
        },
        {
          studentId: student.id,
          courseId: courses[3].id, // CS101
          grade: "A-",
          term: "Fall 2023",
        },
      ],
    })
  }

  console.log(`✅ Created test student: ${user1.email}`)
  return student
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

  const { smu, isDept, csDept } = await createUniversitiesAndDepartments()

  const courses = await createSampleCourses(smu.id, isDept.id, csDept.id)

  const professors = await createProfessors(smu.id, isDept.id, csDept.id)

  await createCourseInstructors(courses, professors)

  await createPrerequisites(courses)

  const student = await createTestStudents(smu.id, isDept.id, courses)

  if (student) {
    await createReviews(student, courses, professors)
  }

  await createAdminUsers(smu.id, isDept.id)

  console.log("\n✅ Seed completed successfully!")
  console.log("\n📝 Test Accounts:")
  console.log("  Superadmin: superadmin@planr.com / admin123")
  console.log("  SMU Admin: admin@smu.edu.sg / admin123")
  console.log("  IS Coordinator: coordinator@smu.edu.sg / admin123")
  console.log("  Student: student1@smu.edu.sg / student123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
