import { PrismaClient, University, PrerequisiteType } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Starting seed...")

  // Clear existing data (courses only, not users)
  await prisma.plannedCourse.deleteMany()
  await prisma.semesterPlan.deleteMany()
  await prisma.completedCourse.deleteMany()
  await prisma.prerequisite.deleteMany()
  await prisma.course.deleteMany()
  await prisma.graduationRequirement.deleteMany()

  console.log("✅ Cleared existing course data")

  // Create SMU CS courses
  const courses = [
    {
      code: "CS101",
      title: "Introduction to Programming",
      description:
        "Fundamental programming concepts using Python. Covers variables, control structures, functions, and basic data structures.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Programming"],
      university: "SMU" as University,
    },
    {
      code: "CS102",
      title: "Data Structures",
      description:
        "Study of common data structures including arrays, linked lists, stacks, queues, trees, and graphs.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Data Structures"],
      university: "SMU" as University,
    },
    {
      code: "CS201",
      title: "Algorithms",
      description:
        "Design and analysis of algorithms. Sorting, searching, dynamic programming, greedy algorithms.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Algorithms"],
      university: "SMU" as University,
    },
    {
      code: "CS202",
      title: "Database Systems",
      description:
        "Database design, SQL, normalization, transactions, and database management systems.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Database"],
      university: "SMU" as University,
    },
    {
      code: "CS203",
      title: "Software Engineering",
      description:
        "Software development lifecycle, design patterns, testing, agile methodologies.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Software Engineering"],
      university: "SMU" as University,
    },
    {
      code: "CS301",
      title: "Machine Learning",
      description:
        "Introduction to machine learning algorithms, supervised and unsupervised learning, neural networks.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Elective", "AI", "ML"],
      university: "SMU" as University,
    },
    {
      code: "CS302",
      title: "Web Development",
      description:
        "Modern web development with React, Node.js, databases, and deployment.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Elective", "Web"],
      university: "SMU" as University,
    },
    {
      code: "CS303",
      title: "Mobile App Development",
      description:
        "Building mobile applications for iOS and Android using React Native.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Elective", "Mobile"],
      university: "SMU" as University,
    },
    {
      code: "CS304",
      title: "Computer Networks",
      description:
        "Network protocols, TCP/IP, HTTP, network security, and distributed systems.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Elective", "Networks"],
      university: "SMU" as University,
    },
    {
      code: "CS305",
      title: "Cybersecurity",
      description:
        "Security principles, cryptography, network security, secure coding practices.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Elective", "Security"],
      university: "SMU" as University,
    },
  ]

  const createdCourses = await Promise.all(
    courses.map((course) => prisma.course.create({ data: course }))
  )

  console.log(`✅ Created ${createdCourses.length} courses`)

  // Create prerequisites
  const courseMap = new Map(createdCourses.map((c) => [c.code, c]))

  const prerequisites = [
    {
      course: "CS102",
      prerequisite: "CS101",
      type: "HARD" as PrerequisiteType,
    },
    {
      course: "CS201",
      prerequisite: "CS102",
      type: "HARD" as PrerequisiteType,
    },
    {
      course: "CS202",
      prerequisite: "CS102",
      type: "HARD" as PrerequisiteType,
    },
    {
      course: "CS203",
      prerequisite: "CS102",
      type: "HARD" as PrerequisiteType,
    },
    {
      course: "CS301",
      prerequisite: "CS201",
      type: "HARD" as PrerequisiteType,
    },
    {
      course: "CS301",
      prerequisite: "CS202",
      type: "SOFT" as PrerequisiteType,
    },
    {
      course: "CS302",
      prerequisite: "CS203",
      type: "HARD" as PrerequisiteType,
    },
    {
      course: "CS303",
      prerequisite: "CS203",
      type: "HARD" as PrerequisiteType,
    },
    {
      course: "CS304",
      prerequisite: "CS201",
      type: "HARD" as PrerequisiteType,
    },
    {
      course: "CS305",
      prerequisite: "CS304",
      type: "SOFT" as PrerequisiteType,
    },
  ]

  await Promise.all(
    prerequisites.map(({ course, prerequisite, type }) =>
      prisma.prerequisite.create({
        data: {
          courseId: courseMap.get(course)!.id,
          prerequisiteCourseId: courseMap.get(prerequisite)!.id,
          type,
        },
      })
    )
  )

  console.log(`✅ Created ${prerequisites.length} prerequisites`)

  console.log("🎉 Seed completed successfully!")
  console.log("\nTo create a test user, use the signup page at http://localhost:3000/signup")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
