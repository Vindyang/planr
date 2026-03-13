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
// 4. Create Test Students
// ============================================================
async function createTestStudents(universityId: string, isDeptId: string) {
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

  console.log(`✅ Created test student: ${user1.email}`)
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

  await createSampleCourses(smu.id, isDept.id, csDept.id)

  await createTestStudents(smu.id, isDept.id)

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
