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
// 2. Create University & Departments (SMU SCIS only)
// ============================================================
async function createUniversityAndDepartments() {
  console.log("🏫 Creating SMU and SCIS departments...")

  const smu = await prisma.university.create({
    data: {
      code: "SMU",
      name: "Singapore Management University",
      isActive: true,
    },
  })

  const isDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "IS",
      name: "Information Systems",
      description: "School of Computing and Information Systems - Information Systems Major",
      requiredUnits: 36,
      isActive: true,
    },
  })

  const csDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "CS",
      name: "Computer Science",
      description: "School of Computing and Information Systems - BSc Computer Science (AI Solution Development Major)",
      requiredUnits: 36,
      isActive: true,
    },
  })

  const sweDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "SWE",
      name: "Software Engineering",
      description: "School of Computing and Information Systems - Software Engineering Program",
      isActive: true,
    },
  })

  const cyberDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "CYBER",
      name: "Cybersecurity",
      description: "School of Computing and Information Systems - Cybersecurity Program",
      isActive: true,
    },
  })

  const dsDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "DS",
      name: "Data Science & Analytics",
      description: "School of Computing and Information Systems - Data Science and Analytics Program",
      isActive: true,
    },
  })

  const clDept = await prisma.department.create({
    data: {
      universityId: smu.id,
      code: "CL",
      name: "Computing & Law",
      description: "School of Computing and Information Systems - Computing and Law Double Degree Program",
      isActive: true,
    },
  })

  console.log(`✅ Created SMU with 6 SCIS departments`)

  return { smu, isDept, csDept, sweDept, cyberDept, dsDept, clDept }
}

// ============================================================
// 3. Create SCIS Courses (IS + CS only)
// ============================================================
async function createCourses(universityId: string, isDeptId: string, csDeptId: string) {
  console.log("📚 Creating SCIS courses...")

  const courses = await prisma.course.createMany({
    data: [
      // =====================================================
      // IS Department — Core Courses
      // =====================================================
      {
        code: "IS101",
        universityId,
        departmentId: isDeptId,
        title: "Introduction to Information Systems",
        description: "Fundamental concepts of information systems and their role in organizations.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 1"],
        isActive: true,
      },
      {
        code: "IS112",
        universityId,
        departmentId: isDeptId,
        title: "Data Management",
        description: "Introduction to data management and analytics.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 1"],
        isActive: true,
      },
      {
        code: "IS210",
        universityId,
        departmentId: isDeptId,
        title: "Business Process Analysis and Solutioning",
        description: "Analysing business processes and designing IT solutions for business transformation.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2"],
        isActive: true,
      },
      {
        code: "IS211",
        universityId,
        departmentId: isDeptId,
        title: "Digital Business - Technology and Transformation",
        description: "Digital transformation strategies and emerging technologies for business innovation.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2"],
        isActive: true,
      },
      {
        code: "IS212",
        universityId,
        departmentId: isDeptId,
        title: "Software Project Management",
        description: "Project management methodologies, agile practices, and software delivery lifecycle.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 3"],
        isActive: true,
      },
      {
        code: "IS213",
        universityId,
        departmentId: isDeptId,
        title: "Enterprise Solution Management",
        description: "Enterprise architecture, system integration, and IT service management.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2"],
        isActive: true,
      },
      {
        code: "IS214",
        universityId,
        departmentId: isDeptId,
        title: "Enterprise Solution Development",
        description: "Building enterprise-grade software solutions using modern frameworks and cloud platforms.",
        units: 1,
        termsOffered: ["Term 2"],
        tags: ["Core", "Year 2"],
        isActive: true,
      },
      {
        code: "IS215",
        universityId,
        departmentId: isDeptId,
        title: "Computing Fundamentals",
        description: "Foundational computing concepts for information systems students.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 1"],
        isActive: true,
      },
      {
        code: "IS216",
        universityId,
        departmentId: isDeptId,
        title: "Web Application Development I",
        description: "Introduction to web development with HTML, CSS, and JavaScript.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 1"],
        isActive: true,
      },
      {
        code: "IS217",
        universityId,
        departmentId: isDeptId,
        title: "Algorithms and Programming",
        description: "Algorithmic thinking and programming fundamentals for IS students.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 1"],
        isActive: true,
      },
      {
        code: "IS218",
        universityId,
        departmentId: isDeptId,
        title: "Web Application Development II",
        description: "Advanced web development with modern frameworks, APIs, and databases.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2"],
        isActive: true,
      },
      {
        code: "IS219",
        universityId,
        departmentId: isDeptId,
        title: "Interaction Design and Prototyping",
        description: "User-centered design, prototyping techniques, and usability testing for IS solutions.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2"],
        isActive: true,
      },

      // =====================================================
      // CS Department — AI Solution Development Major Core (17 CU)
      // Based on SMU BSc Computer Science 2026 Curriculum
      // =====================================================

      // PROGRAMMING (Year 1)
      {
        code: "CS100",
        universityId,
        departmentId: csDeptId,
        title: "Programming Fundamentals I",
        description: "Introduction to programming concepts, problem decomposition, and computational thinking using Python. Covers variables, control flow, functions, and basic data types.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 1", "Programming"],
        isActive: true,
      },
      {
        code: "CS101",
        universityId,
        departmentId: csDeptId,
        title: "Programming Fundamentals II",
        description: "Advanced programming concepts including object-oriented programming, recursion, file I/O, and introduction to software design patterns.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 1", "Programming"],
        isActive: true,
      },

      // ALGORITHMS (Year 1-2)
      {
        code: "CS102",
        universityId,
        departmentId: csDeptId,
        title: "Mathematical Foundations of Computing",
        description: "Discrete mathematics for computer science: logic, proofs, sets, relations, functions, combinatorics, and graph theory.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 1", "Algorithms"],
        isActive: true,
      },
      {
        code: "CS200",
        universityId,
        departmentId: csDeptId,
        title: "Data Structure and Algorithms",
        description: "Core data structures (arrays, linked lists, trees, hash tables, graphs) and algorithmic techniques (sorting, searching, dynamic programming).",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2", "Algorithms"],
        isActive: true,
      },
      {
        code: "CS201",
        universityId,
        departmentId: csDeptId,
        title: "Design and Analysis of Algorithms",
        description: "Advanced algorithm design paradigms: divide-and-conquer, greedy, dynamic programming, network flow. Complexity analysis and NP-completeness.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2", "Algorithms"],
        isActive: true,
      },

      // AI FOUNDATIONS (Year 1-2)
      {
        code: "CS103",
        universityId,
        departmentId: csDeptId,
        title: "Statistical Thinking for Data Science",
        description: "Probability, statistical inference, hypothesis testing, and regression analysis with applications to data science problems.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 1", "AI Foundations"],
        isActive: true,
      },
      {
        code: "CS202",
        universityId,
        departmentId: csDeptId,
        title: "Linear Algebra for Machine Learning",
        description: "Vector spaces, matrix operations, eigenvalues, SVD, and their applications in machine learning and data analysis.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2", "AI Foundations"],
        isActive: true,
      },
      {
        code: "CS203",
        universityId,
        departmentId: csDeptId,
        title: "Artificial Intelligence Fundamentals",
        description: "Search algorithms, knowledge representation, reasoning under uncertainty, and introduction to machine learning techniques.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2", "AI Foundations"],
        isActive: true,
      },
      {
        code: "CS207",
        universityId,
        departmentId: csDeptId,
        title: "Human-AI Collaborative Software Development",
        description: "Principles of human-AI collaboration in software engineering. Using AI tools for code generation, testing, and review while maintaining software quality.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2", "AI Foundations"],
        isActive: true,
      },

      // INFORMATION MANAGEMENT (Year 1)
      {
        code: "CS104",
        universityId,
        departmentId: csDeptId,
        title: "Data Management",
        description: "Database concepts, relational model, SQL, data modeling, and introduction to NoSQL databases.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 1", "Information Management"],
        isActive: true,
      },
      {
        code: "CS105",
        universityId,
        departmentId: csDeptId,
        title: "Interaction Design and Prototyping",
        description: "User-centered design principles, prototyping techniques, usability testing, and UI/UX design for computing applications.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 1", "Information Management"],
        isActive: true,
      },

      // COMPUTER SYSTEMS (Year 2)
      {
        code: "CS204",
        universityId,
        departmentId: csDeptId,
        title: "Operating Systems",
        description: "Process management, memory management, file systems, concurrency, and distributed operating system concepts.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2", "Computer Systems"],
        isActive: true,
      },
      {
        code: "CS205",
        universityId,
        departmentId: csDeptId,
        title: "Computer Networks",
        description: "Network protocols, TCP/IP, routing, network security, and distributed networking architectures.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2", "Computer Systems"],
        isActive: true,
      },
      {
        code: "CS206",
        universityId,
        departmentId: csDeptId,
        title: "Computer Architecture",
        description: "Digital logic, processor design, memory hierarchy, instruction set architectures, and parallel computing fundamentals.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 2", "Computer Systems"],
        isActive: true,
      },

      // SOLUTIONING (Year 3)
      {
        code: "CS300",
        universityId,
        departmentId: csDeptId,
        title: "Solution Architecture",
        description: "System design principles, architectural patterns, scalability, and building production-grade computing solutions.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 3", "Solutioning"],
        isActive: true,
      },
      {
        code: "CS301",
        universityId,
        departmentId: csDeptId,
        title: "DevOps Principles and Practices",
        description: "CI/CD pipelines, containerisation, infrastructure as code, monitoring, and modern software deployment practices.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 3", "Solutioning"],
        isActive: true,
      },

      // CAPSTONE (Year 3/4)
      {
        code: "CS390",
        universityId,
        departmentId: csDeptId,
        title: "Computer Science Project Experience",
        description: "Industry-sponsored capstone project applying CS knowledge to real-world problems. Covers project management, stakeholder engagement, and team collaboration.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Core", "Year 3", "Capstone"],
        isActive: true,
      },

      // =====================================================
      // CS Track Electives — Frontier Artificial Intelligence
      // =====================================================
      {
        code: "CS310",
        universityId,
        departmentId: csDeptId,
        title: "Principles of Machine Learning",
        description: "Supervised and unsupervised learning, neural networks, model evaluation, and practical applications of machine learning.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Track Elective", "Year 3", "Frontier AI"],
        isActive: true,
      },
      {
        code: "CS311",
        universityId,
        departmentId: csDeptId,
        title: "Agent-based Modeling and Simulation",
        description: "Multi-agent systems, simulation frameworks, emergent behaviour, and applications in complex system modeling.",
        units: 1,
        termsOffered: ["Term 1"],
        tags: ["Track Elective", "Year 3", "Frontier AI"],
        isActive: true,
      },
      {
        code: "CS312",
        universityId,
        departmentId: csDeptId,
        title: "Generative AI for Natural Language Communication",
        description: "Large language models, transformer architectures, prompt engineering, and applications in natural language processing.",
        units: 1,
        termsOffered: ["Term 2"],
        tags: ["Track Elective", "Year 3", "Frontier AI"],
        isActive: true,
      },
      {
        code: "CS313",
        universityId,
        departmentId: csDeptId,
        title: "Heuristic Search and Optimisation",
        description: "Metaheuristic algorithms, evolutionary computing, swarm intelligence, and combinatorial optimisation techniques.",
        units: 1,
        termsOffered: ["Term 1"],
        tags: ["Track Elective", "Year 3", "Frontier AI"],
        isActive: true,
      },

      // =====================================================
      // CS Track Electives — Cybersecurity
      // =====================================================
      {
        code: "CS320",
        universityId,
        departmentId: csDeptId,
        title: "Foundations of Cybersecurity",
        description: "Security principles, threat modeling, cryptography fundamentals, and introduction to security operations.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Track Elective", "Year 3", "Cybersecurity"],
        isActive: true,
      },
      {
        code: "CS321",
        universityId,
        departmentId: csDeptId,
        title: "Cyber Threat Intelligence",
        description: "Threat landscape analysis, intelligence gathering, incident response, and security monitoring techniques.",
        units: 1,
        termsOffered: ["Term 1"],
        tags: ["Track Elective", "Year 3", "Cybersecurity"],
        isActive: true,
      },
      {
        code: "CS322",
        universityId,
        departmentId: csDeptId,
        title: "Data Security and Privacy",
        description: "Data protection regulations, privacy-preserving computation, encryption techniques, and compliance frameworks.",
        units: 1,
        termsOffered: ["Term 2"],
        tags: ["Track Elective", "Year 3", "Cybersecurity"],
        isActive: true,
      },
      {
        code: "CS323",
        universityId,
        departmentId: csDeptId,
        title: "Software and Systems Security",
        description: "Secure software development, vulnerability analysis, penetration testing, and systems hardening.",
        units: 1,
        termsOffered: ["Term 2"],
        tags: ["Track Elective", "Year 3", "Cybersecurity"],
        isActive: true,
      },

      // =====================================================
      // CS Track Electives — Software Systems
      // =====================================================
      {
        code: "CS330",
        universityId,
        departmentId: csDeptId,
        title: "Full Stack Development",
        description: "End-to-end web application development: frontend frameworks, backend APIs, databases, deployment, and modern development workflows.",
        units: 1,
        termsOffered: ["Term 1", "Term 2"],
        tags: ["Track Elective", "Year 3", "Software Systems"],
        isActive: true,
      },
      {
        code: "CS331",
        universityId,
        departmentId: csDeptId,
        title: "Advanced Database Systems",
        description: "Distributed databases, query optimisation, transaction processing, and modern database architectures.",
        units: 1,
        termsOffered: ["Term 1"],
        tags: ["Track Elective", "Year 3", "Software Systems"],
        isActive: true,
      },
      {
        code: "CS332",
        universityId,
        departmentId: csDeptId,
        title: "Computer Graphics and Virtual Reality",
        description: "3D rendering, shader programming, VR/AR technologies, and interactive visualisation systems.",
        units: 1,
        termsOffered: ["Term 1"],
        tags: ["Track Elective", "Year 3", "Software Systems"],
        isActive: true,
      },
      {
        code: "CS333",
        universityId,
        departmentId: csDeptId,
        title: "Mobile and Pervasive Computing and Applications",
        description: "Mobile application development, IoT systems, pervasive computing paradigms, and context-aware applications.",
        units: 1,
        termsOffered: ["Term 2"],
        tags: ["Track Elective", "Year 3", "Software Systems"],
        isActive: true,
      },
    ],
  })

  console.log(`✅ Created ${courses.count} SCIS courses (IS + CS)`)

  return prisma.course.findMany({ where: { universityId } })
}

// ============================================================
// 4. Create Professors (SCIS only)
// ============================================================
async function createProfessors(universityId: string, isDeptId: string, csDeptId: string) {
  console.log("👨‍🏫 Creating SCIS professors...")

  const professors = []

  // IS Department Professors
  const prof1 = await prisma.professor.create({
    data: { name: "Dr. Sarah Johnson", universityId, departmentId: isDeptId },
  })
  professors.push(prof1)

  const prof2 = await prisma.professor.create({
    data: { name: "Prof. Michael Lee", universityId, departmentId: isDeptId },
  })
  professors.push(prof2)

  const prof3 = await prisma.professor.create({
    data: { name: "Dr. Rachel Tan", universityId, departmentId: isDeptId },
  })
  professors.push(prof3)

  // CS Department Professors (6 professors covering all areas)
  const csProf1 = await prisma.professor.create({
    data: { name: "Prof. Tan Kian Lee", universityId, departmentId: csDeptId },
  })
  professors.push(csProf1)

  const csProf2 = await prisma.professor.create({
    data: { name: "Dr. Lim Wei Shi", universityId, departmentId: csDeptId },
  })
  professors.push(csProf2)

  const csProf3 = await prisma.professor.create({
    data: { name: "Prof. Ng Hwee Tou", universityId, departmentId: csDeptId },
  })
  professors.push(csProf3)

  const csProf4 = await prisma.professor.create({
    data: { name: "Dr. Chan Wai Kay", universityId, departmentId: csDeptId },
  })
  professors.push(csProf4)

  const csProf5 = await prisma.professor.create({
    data: { name: "Prof. Ooi Beng Chin", universityId, departmentId: csDeptId },
  })
  professors.push(csProf5)

  const csProf6 = await prisma.professor.create({
    data: { name: "Dr. Priya Sharma", universityId, departmentId: csDeptId },
  })
  professors.push(csProf6)

  console.log(`✅ Created ${professors.length} professors (3 IS + 6 CS)`)
  return professors
}

// ============================================================
// 5. Link Professors to Courses
// ============================================================
async function createCourseInstructors(courses: any[], professors: any[]) {
  console.log("🔗 Linking professors to courses...")

  const getCourse = (code: string) => courses.find(c => c.code === code)
  // professors[0] = Dr. Sarah Johnson (IS)
  // professors[1] = Prof. Michael Lee (IS)
  // professors[2] = Dr. Rachel Tan (IS)
  // professors[3] = Prof. Tan Kian Lee (CS - Algorithms, Systems)
  // professors[4] = Dr. Lim Wei Shi (CS - AI, ML)
  // professors[5] = Prof. Ng Hwee Tou (CS - AI, NLP)
  // professors[6] = Dr. Chan Wai Kay (CS - Cybersecurity)
  // professors[7] = Prof. Ooi Beng Chin (CS - Databases, Software Systems)
  // professors[8] = Dr. Priya Sharma (CS - Software Engineering, DevOps)

  const assignments = [
    // IS Department
    { courseCode: "IS101", professorIdx: 0, term: "Term 1 2024" },
    { courseCode: "IS112", professorIdx: 1, term: "Term 1 2024" },
    { courseCode: "IS210", professorIdx: 2, term: "Term 1 2025" },
    { courseCode: "IS216", professorIdx: 0, term: "Term 2 2024" },
    { courseCode: "IS217", professorIdx: 1, term: "Term 1 2024" },
    { courseCode: "IS218", professorIdx: 0, term: "Term 1 2025" },
    { courseCode: "IS212", professorIdx: 2, term: "Term 1 2025" },

    // CS Core — Programming
    { courseCode: "CS100", professorIdx: 8, term: "Term 1 2024" },
    { courseCode: "CS101", professorIdx: 8, term: "Term 2 2025" },

    // CS Core — Algorithms
    { courseCode: "CS102", professorIdx: 3, term: "Term 1 2024" },
    { courseCode: "CS200", professorIdx: 3, term: "Term 1 2025" },
    { courseCode: "CS201", professorIdx: 3, term: "Term 2 2025" },

    // CS Core — AI Foundations
    { courseCode: "CS103", professorIdx: 4, term: "Term 1 2024" },
    { courseCode: "CS202", professorIdx: 4, term: "Term 1 2025" },
    { courseCode: "CS203", professorIdx: 5, term: "Term 2 2025" },
    { courseCode: "CS207", professorIdx: 5, term: "Term 1 2025" },

    // CS Core — Information Management
    { courseCode: "CS104", professorIdx: 7, term: "Term 1 2024" },
    { courseCode: "CS105", professorIdx: 8, term: "Term 2 2024" },

    // CS Core — Computer Systems
    { courseCode: "CS204", professorIdx: 3, term: "Term 1 2025" },
    { courseCode: "CS205", professorIdx: 6, term: "Term 2 2025" },
    { courseCode: "CS206", professorIdx: 3, term: "Term 2 2025" },

    // CS Core — Solutioning
    { courseCode: "CS300", professorIdx: 7, term: "Term 1 2025" },
    { courseCode: "CS301", professorIdx: 8, term: "Term 2 2025" },

    // CS Track — Frontier AI
    { courseCode: "CS310", professorIdx: 4, term: "Term 1 2025" },
    { courseCode: "CS311", professorIdx: 5, term: "Term 1 2025" },
    { courseCode: "CS312", professorIdx: 5, term: "Term 2 2025" },
    { courseCode: "CS313", professorIdx: 3, term: "Term 1 2025" },

    // CS Track — Cybersecurity
    { courseCode: "CS320", professorIdx: 6, term: "Term 1 2025" },
    { courseCode: "CS321", professorIdx: 6, term: "Term 1 2025" },
    { courseCode: "CS322", professorIdx: 6, term: "Term 2 2025" },
    { courseCode: "CS323", professorIdx: 6, term: "Term 2 2025" },

    // CS Track — Software Systems
    { courseCode: "CS330", professorIdx: 8, term: "Term 1 2025" },
    { courseCode: "CS331", professorIdx: 7, term: "Term 1 2025" },
    { courseCode: "CS332", professorIdx: 8, term: "Term 1 2025" },
    { courseCode: "CS333", professorIdx: 7, term: "Term 2 2025" },
  ]

  for (const a of assignments) {
    const course = getCourse(a.courseCode)
    if (course) {
      await prisma.courseInstructor.create({
        data: {
          courseId: course.id,
          professorId: professors[a.professorIdx].id,
          term: a.term,
        },
      })
    }
  }

  console.log(`✅ Created ${assignments.length} course instructor assignments`)
}

// ============================================================
// 6. Create Prerequisites
// ============================================================
async function createPrerequisites(courses: any[]) {
  console.log("📋 Creating course prerequisites...")

  const getCourse = (code: string) => courses.find(c => c.code === code)

  const prereqs = [
    // IS prerequisites
    { course: "IS210", prereq: "IS101", type: "HARD" as const },
    { course: "IS211", prereq: "IS101", type: "HARD" as const },
    { course: "IS212", prereq: "IS210", type: "HARD" as const },
    { course: "IS213", prereq: "IS210", type: "HARD" as const },
    { course: "IS214", prereq: "IS213", type: "HARD" as const },
    { course: "IS218", prereq: "IS216", type: "HARD" as const },

    // CS Core — Programming chain
    { course: "CS101", prereq: "CS100", type: "HARD" as const },

    // CS Core — Algorithms chain
    { course: "CS200", prereq: "CS101", type: "HARD" as const },
    { course: "CS201", prereq: "CS200", type: "HARD" as const },

    // CS Core — AI Foundations
    { course: "CS202", prereq: "CS102", type: "HARD" as const },
    { course: "CS203", prereq: "CS103", type: "HARD" as const },
    { course: "CS203", prereq: "CS101", type: "HARD" as const },
    { course: "CS207", prereq: "CS101", type: "HARD" as const },

    // CS Core — Computer Systems
    { course: "CS204", prereq: "CS101", type: "HARD" as const },
    { course: "CS205", prereq: "CS101", type: "HARD" as const },
    { course: "CS206", prereq: "CS102", type: "HARD" as const },

    // CS Core — Solutioning
    { course: "CS300", prereq: "CS200", type: "HARD" as const },
    { course: "CS301", prereq: "CS101", type: "SOFT" as const },

    // CS Capstone
    { course: "CS390", prereq: "CS300", type: "HARD" as const },

    // CS Track — Frontier AI
    { course: "CS310", prereq: "CS203", type: "HARD" as const },
    { course: "CS310", prereq: "CS202", type: "HARD" as const },
    { course: "CS311", prereq: "CS203", type: "HARD" as const },
    { course: "CS312", prereq: "CS203", type: "HARD" as const },
    { course: "CS313", prereq: "CS201", type: "HARD" as const },

    // CS Track — Cybersecurity
    { course: "CS320", prereq: "CS205", type: "HARD" as const },
    { course: "CS321", prereq: "CS320", type: "HARD" as const },
    { course: "CS322", prereq: "CS320", type: "HARD" as const },
    { course: "CS323", prereq: "CS320", type: "HARD" as const },

    // CS Track — Software Systems
    { course: "CS330", prereq: "CS104", type: "HARD" as const },
    { course: "CS330", prereq: "CS101", type: "HARD" as const },
    { course: "CS331", prereq: "CS104", type: "HARD" as const },
    { course: "CS332", prereq: "CS202", type: "SOFT" as const },
    { course: "CS333", prereq: "CS205", type: "HARD" as const },
  ]

  for (const p of prereqs) {
    const course = getCourse(p.course)
    const prereqCourse = getCourse(p.prereq)
    if (course && prereqCourse) {
      await prisma.prerequisite.create({
        data: {
          courseId: course.id,
          prerequisiteCourseId: prereqCourse.id,
          type: p.type,
        },
      })
    }
  }

  console.log(`✅ Created ${prereqs.length} course prerequisites`)
}

// ============================================================
// 7. Create Test Students
// ============================================================
async function createTestStudents(universityId: string, isDeptId: string, courses: any[]) {
  console.log("👨‍🎓 Creating test students...")

  const passwordHash = await hashPassword("student123")
  const students = []

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

  // 2. Sophomore - Year 2, GPA 3.5, 8 completed courses (all SCIS)
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
    await prisma.completedCourse.createMany({
      data: [
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("IS101")!.id, grade: "A-", term: "Term 1 2023" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("IS215")!.id, grade: "B+", term: "Term 1 2023" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("CS100")!.id, grade: "B+", term: "Term 1 2023" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("CS102")!.id, grade: "A", term: "Term 1 2023" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("IS112")!.id, grade: "A-", term: "Term 2 2024" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("IS216")!.id, grade: "B+", term: "Term 2 2024" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("CS101")!.id, grade: "B+", term: "Term 2 2024" },
        { studentId: sophomoreStudent.id, courseId: getCourseByCode("CS103")!.id, grade: "A", term: "Term 2 2024" },
      ],
    })
    students.push(sophomoreStudent)
  }
  console.log(`  ✅ Created sophomore@smu.edu.sg - Year 2, GPA 3.5, 8 courses`)

  // 3. Junior - Year 3, GPA 3.7, 20 completed courses (all SCIS)
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
    await prisma.completedCourse.createMany({
      data: [
        // Year 1 - Term 1
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS101")!.id, grade: "A", term: "Term 1 2022" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS215")!.id, grade: "A-", term: "Term 1 2022" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS100")!.id, grade: "A-", term: "Term 1 2022" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS102")!.id, grade: "A", term: "Term 1 2022" },
        // Year 1 - Term 2
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS112")!.id, grade: "A", term: "Term 2 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS216")!.id, grade: "A-", term: "Term 2 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS101")!.id, grade: "A-", term: "Term 2 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS103")!.id, grade: "A-", term: "Term 2 2023" },
        // Year 2 - Term 1
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS210")!.id, grade: "A-", term: "Term 1 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS217")!.id, grade: "A", term: "Term 1 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS200")!.id, grade: "A", term: "Term 1 2023" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS104")!.id, grade: "B+", term: "Term 1 2023" },
        // Year 2 - Term 2
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS218")!.id, grade: "A", term: "Term 2 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS205")!.id, grade: "A-", term: "Term 2 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS202")!.id, grade: "A", term: "Term 2 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS105")!.id, grade: "B+", term: "Term 2 2024" },
        // Year 3 - Term 1
        { studentId: juniorStudent.id, courseId: getCourseByCode("IS219")!.id, grade: "A", term: "Term 1 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS204")!.id, grade: "A-", term: "Term 1 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS203")!.id, grade: "A", term: "Term 1 2024" },
        { studentId: juniorStudent.id, courseId: getCourseByCode("CS201")!.id, grade: "B+", term: "Term 1 2024" },
      ],
    })
    students.push(juniorStudent)
  }
  console.log(`  ✅ Created junior@smu.edu.sg - Year 3, GPA 3.7, 20 courses`)

  // 4. Senior - Year 4, GPA 3.8, 32 completed courses (all SCIS)
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
    await prisma.completedCourse.createMany({
      data: [
        // Year 1 - Term 1
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS101")!.id, grade: "A", term: "Term 1 2021" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS215")!.id, grade: "A", term: "Term 1 2021" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS100")!.id, grade: "A", term: "Term 1 2021" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS102")!.id, grade: "A-", term: "Term 1 2021" },
        // Year 1 - Term 2
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS112")!.id, grade: "A", term: "Term 2 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS216")!.id, grade: "A", term: "Term 2 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS101")!.id, grade: "A", term: "Term 2 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS103")!.id, grade: "A-", term: "Term 2 2022" },
        // Year 2 - Term 1
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS210")!.id, grade: "A", term: "Term 1 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS217")!.id, grade: "A", term: "Term 1 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS200")!.id, grade: "A", term: "Term 1 2022" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS104")!.id, grade: "A", term: "Term 1 2022" },
        // Year 2 - Term 2
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS218")!.id, grade: "A", term: "Term 2 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS205")!.id, grade: "A", term: "Term 2 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS206")!.id, grade: "A-", term: "Term 2 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS202")!.id, grade: "A", term: "Term 2 2023" },
        // Year 3 - Term 1
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS211")!.id, grade: "A", term: "Term 1 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS204")!.id, grade: "A", term: "Term 1 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS201")!.id, grade: "A-", term: "Term 1 2023" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS203")!.id, grade: "A", term: "Term 1 2023" },
        // Year 3 - Term 2
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS332")!.id, grade: "A-", term: "Term 2 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS320")!.id, grade: "A", term: "Term 2 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS207")!.id, grade: "A", term: "Term 2 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS105")!.id, grade: "A-", term: "Term 2 2024" },
        // Year 4 - Term 1
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS300")!.id, grade: "A", term: "Term 1 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS310")!.id, grade: "A", term: "Term 1 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS301")!.id, grade: "A-", term: "Term 1 2024" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS212")!.id, grade: "A", term: "Term 1 2024" },
        // Year 4 - Term 2 (current)
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS390")!.id, grade: "A", term: "Term 2 2025" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS330")!.id, grade: "A-", term: "Term 2 2025" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("IS213")!.id, grade: "A", term: "Term 2 2025" },
        { studentId: seniorStudent.id, courseId: getCourseByCode("CS312")!.id, grade: "A-", term: "Term 2 2025" },
      ],
    })
    students.push(seniorStudent)
  }
  console.log(`  ✅ Created senior@smu.edu.sg - Year 4, GPA 3.8, 32 courses`)

  // 5. Struggling - Year 3, GPA 2.3, 12 courses, D in CS101
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
    await prisma.completedCourse.createMany({
      data: [
        // Year 1 - Term 1
        { studentId: strugglingStudent.id, courseId: getCourseByCode("IS101")!.id, grade: "C+", term: "Term 1 2022" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("IS215")!.id, grade: "C", term: "Term 1 2022" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("CS100")!.id, grade: "C", term: "Term 1 2022" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("CS102")!.id, grade: "C-", term: "Term 1 2022" },
        // Year 1 - Term 2
        { studentId: strugglingStudent.id, courseId: getCourseByCode("IS112")!.id, grade: "C", term: "Term 2 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("IS216")!.id, grade: "C+", term: "Term 2 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("CS101")!.id, grade: "D", term: "Term 2 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("CS103")!.id, grade: "C+", term: "Term 2 2023" },
        // Year 2 - Term 1
        { studentId: strugglingStudent.id, courseId: getCourseByCode("IS210")!.id, grade: "C-", term: "Term 1 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("IS217")!.id, grade: "C", term: "Term 1 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("CS104")!.id, grade: "B", term: "Term 1 2023" },
        { studentId: strugglingStudent.id, courseId: getCourseByCode("CS105")!.id, grade: "B+", term: "Term 1 2023" },
      ],
    })
    students.push(strugglingStudent)
  }
  console.log(`  ✅ Created struggling@smu.edu.sg - Year 3, GPA 2.3, 12 courses (D in CS101)`)

  console.log(`✅ Created ${students.length} test students total`)
  return students
}

// ============================================================
// 8. Create Course and Professor Reviews
// ============================================================
async function createReviews(student: any, courses: any[], professors: any[]) {
  console.log("⭐ Creating course and professor reviews...")

  const getCourse = (code: string) => courses.find(c => c.code === code)

  // Course Review for IS101
  await prisma.courseReview.create({
    data: {
      studentId: student.id,
      courseId: getCourse("IS101")!.id,
      rating: 5,
      difficultyRating: 3,
      workloadRating: 3,
      content: "Great introductory course! Dr. Johnson explains concepts clearly and the assignments are practical.",
      term: "Term 1 2023",
    },
  })

  // Course Review for CS100 (Programming Fundamentals I)
  await prisma.courseReview.create({
    data: {
      studentId: student.id,
      courseId: getCourse("CS100")!.id,
      rating: 4,
      difficultyRating: 2,
      workloadRating: 3,
      content: "Solid introduction to programming. Dr. Priya Sharma is very patient with beginners. The Python assignments gradually build up in complexity.",
      term: "Term 1 2023",
    },
  })

  // Course Review for CS101 (Programming Fundamentals II)
  await prisma.courseReview.create({
    data: {
      studentId: student.id,
      courseId: getCourse("CS101")!.id,
      rating: 4,
      difficultyRating: 4,
      workloadRating: 4,
      content: "Big step up from Prog I. OOP concepts were challenging but the labs helped a lot. Make sure you're comfortable with Prog I before taking this.",
      term: "Term 2 2024",
    },
  })

  // Course Review for CS102 (Mathematical Foundations)
  await prisma.courseReview.create({
    data: {
      studentId: student.id,
      courseId: getCourse("CS102")!.id,
      rating: 3,
      difficultyRating: 4,
      workloadRating: 3,
      content: "Tough course but essential for understanding algorithms later. Prof. Tan is very thorough but the proofs can be overwhelming at times.",
      term: "Term 1 2023",
    },
  })

  // Professor Review for Dr. Sarah Johnson (IS101)
  await prisma.professorReview.create({
    data: {
      studentId: student.id,
      professorId: professors[0].id,
      courseId: getCourse("IS101")!.id,
      rating: 5,
      difficultyRating: 3,
      workloadRating: 3,
      content: "Dr. Johnson is an excellent teacher. She's approachable, responsive, and really cares about student learning.",
      term: "Term 1 2023",
    },
  })

  // Professor Review for Dr. Priya Sharma (CS100)
  await prisma.professorReview.create({
    data: {
      studentId: student.id,
      professorId: professors[8].id,
      courseId: getCourse("CS100")!.id,
      rating: 4,
      difficultyRating: 2,
      workloadRating: 3,
      content: "Dr. Sharma makes programming accessible even for complete beginners. Very hands-on teaching style with lots of live coding demos.",
      term: "Term 1 2023",
    },
  })

  // Professor Review for Prof. Tan Kian Lee (CS102)
  await prisma.professorReview.create({
    data: {
      studentId: student.id,
      professorId: professors[3].id,
      courseId: getCourse("CS102")!.id,
      rating: 4,
      difficultyRating: 4,
      workloadRating: 3,
      content: "Prof. Tan is knowledgeable and rigorous. His lectures on graph theory and combinatorics are excellent. Office hours are very helpful.",
      term: "Term 1 2023",
    },
  })

  console.log(`✅ Created course and professor reviews`)
}

// ============================================================
// 9. Create Admin Users
// ============================================================
async function createAdminUsers(smuId: string, isDeptId: string) {
  console.log("👨‍💼 Creating admin users...")

  const passwordHash = await hashPassword("admin123")

  await prisma.user.create({
    data: {
      email: "superadmin@planr.com",
      name: "Super Admin",
      emailVerified: true,
      role: "SUPER_ADMIN",
      assignedUniversityId: null,
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
  console.log(`  ✅ Created superadmin@planr.com (SUPER_ADMIN)`)

  await prisma.user.create({
    data: {
      email: "admin@smu.edu.sg",
      name: "SMU Administrator",
      emailVerified: true,
      role: "ADMIN",
      assignedUniversityId: smuId,
      assignedDepartmentId: null,
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
  console.log(`  ✅ Created admin@smu.edu.sg (ADMIN - SMU)`)

  await prisma.user.create({
    data: {
      email: "coordinator@smu.edu.sg",
      name: "IS Coordinator",
      emailVerified: true,
      role: "COORDINATOR",
      assignedUniversityId: smuId,
      assignedDepartmentId: isDeptId,
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
  console.log(`  ✅ Created coordinator@smu.edu.sg (COORDINATOR - IS)`)
}

// ============================================================
// Main Execution
// ============================================================
async function main() {
  console.log("🌱 Starting SCIS seed...\n")

  await clearAllData()

  const { smu, isDept, csDept } = await createUniversityAndDepartments()

  const courses = await createCourses(smu.id, isDept.id, csDept.id)

  const professors = await createProfessors(smu.id, isDept.id, csDept.id)

  await createCourseInstructors(courses, professors)

  await createPrerequisites(courses)

  const students = await createTestStudents(smu.id, isDept.id, courses)

  if (students && students.length > 0) {
    await createReviews(students[1], courses, professors)
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
  console.log("    - struggling@smu.edu.sg (Year 3, GPA 2.3, 12 courses)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
