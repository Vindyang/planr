import { PrismaClient, University } from "@prisma/client"
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

  // Delete in correct order (respecting foreign keys)
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

  console.log("✅ Cleared existing data")
}

// ============================================================
// 2. Seed SMU Courses (105 courses)
// ============================================================
async function seedSMUCourses() {
  const smuCoursesData = [
    // ========== FOUNDATION YEAR 1 (15 courses) ==========
    {
      code: "CS101",
      title: "Introduction to Programming",
      description: "Fundamental programming concepts using Python. Covers variables, control structures, functions, and basic data structures.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Programming", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "CS102",
      title: "Data Structures and Algorithms I",
      description: "Introduction to data structures: arrays, linked lists, stacks, queues, trees. Basic algorithm analysis.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Data Structures", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "CS103",
      title: "Computer Systems Fundamentals",
      description: "Introduction to computer architecture, assembly language, and system-level programming.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Systems", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "CS104",
      title: "Web Technologies",
      description: "HTML, CSS, JavaScript, and basic web development concepts.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Core", "Web", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "CS105",
      title: "Discrete Mathematics for CS",
      description: "Logic, sets, functions, relations, graphs, combinatorics, and proof techniques.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Math", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "MATH101",
      title: "Calculus I",
      description: "Limits, derivatives, integrals, and applications to computer science.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Math", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "MATH102",
      title: "Linear Algebra",
      description: "Vectors, matrices, linear transformations, eigenvalues, applications in CS.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Math", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "MATH103",
      title: "Probability and Statistics",
      description: "Probability theory, random variables, distributions, statistical inference.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Math", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "STAT101",
      title: "Introduction to Statistics",
      description: "Descriptive statistics, hypothesis testing, regression, data analysis.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Math", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "IS101",
      title: "Information Systems Fundamentals",
      description: "Overview of information systems, databases, and business applications.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Breadth", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "IS102",
      title: "Data Analytics",
      description: "Introduction to data analysis tools, visualization, and business intelligence.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Breadth", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "COMM101",
      title: "Technical Communication",
      description: "Written and oral communication for computing professionals.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Breadth", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "ECON101",
      title: "Principles of Economics",
      description: "Microeconomics and macroeconomics principles for computer science students.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Breadth", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "PHIL101",
      title: "Ethics in Computing",
      description: "Ethical, legal, and social issues in computing and technology.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Breadth", "Year 1"],
      university: "SMU" as University,
    },
    {
      code: "WRIT101",
      title: "Academic Writing",
      description: "Research writing, argumentation, and documentation for university-level work.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Breadth", "Year 1"],
      university: "SMU" as University,
    },

    // ========== CORE YEAR 2 (15 courses) ==========
    {
      code: "CS201",
      title: "Advanced Data Structures and Algorithms",
      description: "Advanced data structures, graph algorithms, complexity analysis, algorithm design techniques.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Algorithms", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "CS202",
      title: "Object-Oriented Programming",
      description: "OOP principles, design patterns, Java/C++ programming, software design.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Programming", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "CS203",
      title: "Software Engineering Principles",
      description: "SDLC, requirements engineering, design, testing, version control, agile methods.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Software Engineering", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "CS204",
      title: "Database Systems",
      description: "Relational model, SQL, database design, normalization, transactions, query optimization.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Database", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "CS205",
      title: "Web Application Development",
      description: "Full-stack web development: React, Node.js, Express, MongoDB, RESTful APIs.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Web", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "CS206",
      title: "Computer Networks",
      description: "Network protocols, TCP/IP stack, routing, network security, HTTP, DNS.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Networks", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "CS207",
      title: "Introduction to Artificial Intelligence",
      description: "Search algorithms, knowledge representation, machine learning fundamentals, neural networks intro.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "AI", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "CS208",
      title: "Operating Systems",
      description: "Process management, memory management, file systems, concurrency, system calls.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Core", "Systems", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "CS209",
      title: "Theory of Computation",
      description: "Automata, formal languages, computability, complexity theory, Turing machines.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Core", "Theory", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "CS210",
      title: "Computer Organization and Architecture",
      description: "Digital logic, CPU design, memory hierarchy, instruction sets, pipelining.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Core", "Hardware", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "MATH201",
      title: "Calculus II",
      description: "Multivariable calculus, partial derivatives, multiple integrals, vector calculus.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Math", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "MATH202",
      title: "Numerical Methods",
      description: "Numerical analysis, root finding, interpolation, numerical integration, solving ODEs.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Math", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "STAT201",
      title: "Probability Theory",
      description: "Advanced probability, stochastic processes, applications to computer science.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Math", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "IS201",
      title: "Enterprise Systems",
      description: "ERP systems, CRM, supply chain management, business process integration.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Breadth", "Year 2"],
      university: "SMU" as University,
    },
    {
      code: "IS202",
      title: "IT Project Management",
      description: "Project planning, scheduling, risk management, team collaboration.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Breadth", "Year 2"],
      university: "SMU" as University,
    },

    // ========== ADVANCED CORE YEAR 3 (15 courses) ==========
    {
      code: "CS301",
      title: "Advanced Algorithms",
      description: "Randomized algorithms, approximation algorithms, parallel algorithms, advanced graph theory.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Advanced", "Algorithms", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS302",
      title: "Compiler Design",
      description: "Lexical analysis, parsing, semantic analysis, code generation, optimization.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Advanced", "Systems", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS303",
      title: "Distributed Systems",
      description: "Distributed architectures, consensus algorithms, fault tolerance, distributed databases.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Advanced", "Systems", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS304",
      title: "Advanced Database Systems",
      description: "NoSQL databases, distributed databases, query optimization, big data storage.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Advanced", "Database", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS305",
      title: "Computer Security",
      description: "Cryptography, network security, secure coding, penetration testing, security protocols.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Advanced", "Security", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS306",
      title: "Computer Graphics",
      description: "Rendering pipeline, transformations, lighting, texture mapping, ray tracing.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Advanced", "Graphics", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS307",
      title: "Natural Language Processing",
      description: "Text processing, language models, machine translation, sentiment analysis.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Advanced", "AI", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS308",
      title: "High-Performance Computing",
      description: "Parallel architectures, CUDA, OpenMP, performance optimization, GPU programming.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Advanced", "Systems", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS309",
      title: "Programming Language Theory",
      description: "Type systems, lambda calculus, functional programming, language design.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Advanced", "Theory", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS310",
      title: "Human-Computer Interaction",
      description: "UI/UX design, usability testing, interaction design, accessibility.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Advanced", "UI/UX", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS311",
      title: "Software Testing and Quality Assurance",
      description: "Testing methodologies, test automation, continuous integration, code quality metrics.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Advanced", "Software Engineering", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS312",
      title: "Cloud Computing",
      description: "Cloud platforms (AWS, Azure, GCP), containerization, serverless, microservices.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Advanced", "Cloud", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS313",
      title: "Information Retrieval",
      description: "Search engines, indexing, ranking algorithms, text mining, web search.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Advanced", "Data Science", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS314",
      title: "Computer Vision",
      description: "Image processing, object detection, scene understanding, deep learning for vision.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Advanced", "AI", "Year 3"],
      university: "SMU" as University,
    },
    {
      code: "CS315",
      title: "Bioinformatics",
      description: "Sequence alignment, genome analysis, computational biology algorithms.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Advanced", "Interdisciplinary", "Year 3"],
      university: "SMU" as University,
    },

    // ========== SOFTWARE ENGINEERING TRACK (10 courses) ==========
    {
      code: "CS400",
      title: "Software Architecture and Design",
      description: "Architectural patterns, microservices, domain-driven design, system design.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "Software Engineering", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS401",
      title: "Advanced Software Development",
      description: "Large-scale software development, refactoring, technical debt, code reviews.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Software Engineering", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS402",
      title: "Database Design and Development",
      description: "Advanced database modeling, ORMs, database performance, scaling strategies.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "Software Engineering", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS403",
      title: "Agile Software Development",
      description: "Scrum, Kanban, XP practices, sprint planning, retrospectives.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "Software Engineering", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS404",
      title: "DevOps and CI/CD",
      description: "Continuous integration/delivery, Docker, Kubernetes, infrastructure as code.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "Software Engineering", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS405",
      title: "Modern Web Frameworks",
      description: "Advanced React, Next.js, TypeScript, state management, SSR/SSG.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Software Engineering", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS406",
      title: "Software Testing Automation",
      description: "Unit testing, integration testing, E2E testing, test frameworks.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Software Engineering", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS407",
      title: "Microservices Architecture",
      description: "Service design, API gateways, service mesh, event-driven architecture.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "Software Engineering", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS408",
      title: "Code Quality and Maintainability",
      description: "Clean code, SOLID principles, design patterns, static analysis.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Software Engineering", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS409",
      title: "Software Engineering Capstone",
      description: "Team-based software project applying SE best practices.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "Software Engineering", "Capstone", "Year 4"],
      university: "SMU" as University,
    },

    // ========== DATA SCIENCE & AI TRACK (10 courses) ==========
    {
      code: "CS410",
      title: "Machine Learning Fundamentals",
      description: "Supervised/unsupervised learning, regression, classification, clustering.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "AI", "Data Science", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS411",
      title: "Deep Learning",
      description: "Neural networks, CNNs, RNNs, transformers, PyTorch/TensorFlow.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "AI", "Data Science", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS412",
      title: "Natural Language Processing Applications",
      description: "Text classification, NER, seq2seq, BERT, GPT, LLMs.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "AI", "Data Science", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS413",
      title: "Computer Vision Applications",
      description: "Object detection, segmentation, face recognition, GANs.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "AI", "Data Science", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS414",
      title: "Big Data Analytics",
      description: "Hadoop, Spark, distributed data processing, data pipelines.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "Data Science", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS415",
      title: "Data Mining and Knowledge Discovery",
      description: "Association rules, pattern mining, anomaly detection, recommender systems.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Data Science", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS416",
      title: "Reinforcement Learning",
      description: "MDPs, Q-learning, policy gradients, deep RL, applications.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "AI", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS417",
      title: "Recommender Systems",
      description: "Collaborative filtering, content-based, hybrid systems, Netflix problem.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Data Science", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS418",
      title: "Data Structures for Machine Learning",
      description: "Efficient data structures for ML, sparse matrices, tensor operations.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "AI", "Data Science", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS419",
      title: "AI Capstone Project",
      description: "End-to-end ML project: data collection, modeling, deployment.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "AI", "Capstone", "Year 4"],
      university: "SMU" as University,
    },

    // ========== CYBERSECURITY TRACK (10 courses) ==========
    {
      code: "CS420",
      title: "Network Security",
      description: "Firewalls, IDS/IPS, VPNs, network protocols security, attack detection.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "Security", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS421",
      title: "Cryptography and Encryption",
      description: "Symmetric/asymmetric encryption, hashing, PKI, digital signatures.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "Security", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS422",
      title: "Ethical Hacking and Penetration Testing",
      description: "Vulnerability assessment, exploitation techniques, Metasploit, Kali Linux.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Security", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS423",
      title: "Secure Software Development",
      description: "OWASP Top 10, secure coding, input validation, injection prevention.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "Security", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS424",
      title: "Incident Response and Forensics",
      description: "Security incident handling, digital forensics, malware analysis.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Security", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS425",
      title: "Cloud Security",
      description: "AWS/Azure security, IAM, encryption at rest/transit, compliance.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "Security", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS426",
      title: "Blockchain and Cryptocurrency Security",
      description: "Blockchain technology, smart contracts, cryptocurrency security.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Security", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS427",
      title: "Security Auditing and Compliance",
      description: "Security audits, GDPR, HIPAA, SOC 2, compliance frameworks.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "Security", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS428",
      title: "IoT Security",
      description: "IoT device security, embedded systems security, wireless security.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Security", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS429",
      title: "Cybersecurity Capstone",
      description: "Comprehensive security assessment project, red team/blue team exercises.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "Security", "Capstone", "Year 4"],
      university: "SMU" as University,
    },

    // ========== SYSTEMS & NETWORKS TRACK (10 courses) ==========
    {
      code: "CS430",
      title: "Advanced Operating Systems",
      description: "OS internals, kernel programming, device drivers, system performance.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "Systems", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS431",
      title: "Compiler Optimization",
      description: "Advanced compiler techniques, code optimization, JIT compilation.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Systems", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS432",
      title: "Advanced Computer Networks",
      description: "Network design, SDN, network virtualization, 5G networks.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "Networks", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS433",
      title: "Distributed Systems Design",
      description: "Consensus protocols, distributed databases, CAP theorem, Raft/Paxos.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "Systems", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS434",
      title: "Embedded Systems",
      description: "Microcontrollers, RTOS, embedded Linux, hardware interfaces.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Systems", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS435",
      title: "Virtualization and Containers",
      description: "Hypervisors, Docker, Kubernetes, container orchestration.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "Systems", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS436",
      title: "Cloud Infrastructure",
      description: "Infrastructure as code, Terraform, Ansible, cloud-native architecture.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "Systems", "Cloud", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS437",
      title: "Real-Time Systems",
      description: "Real-time scheduling, RTOS, timing analysis, safety-critical systems.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Track", "Systems", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS438",
      title: "IoT and Edge Computing",
      description: "IoT architectures, edge computing, fog computing, MQTT, CoAP.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Track", "Systems", "Networks", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS439",
      title: "Systems Capstone Project",
      description: "Build a complex distributed system or network application.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Track", "Systems", "Capstone", "Year 4"],
      university: "SMU" as University,
    },

    // ========== GENERAL ELECTIVES (15 courses) ==========
    {
      code: "CS450",
      title: "Game Development",
      description: "Game engines, Unity/Unreal, game physics, AI for games.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Elective", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS451",
      title: "Quantum Computing",
      description: "Quantum algorithms, Qiskit, quantum gates, quantum supremacy.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Elective", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS452",
      title: "Blockchain Applications",
      description: "DApps, Ethereum, Solidity, smart contract development.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Elective", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS453",
      title: "Augmented and Virtual Reality",
      description: "AR/VR development, Unity AR Foundation, Meta Quest, spatial computing.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Elective", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS454",
      title: "Mobile Application Development",
      description: "iOS/Android development, React Native, Flutter, mobile UI/UX.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Elective", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS455",
      title: "Robotics and Automation",
      description: "Robot kinematics, ROS, path planning, computer vision for robotics.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Elective", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS456",
      title: "Digital Ethics and Privacy",
      description: "Privacy laws, data protection, ethical AI, algorithmic bias.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Elective", "Ethics", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS457",
      title: "User Experience Design",
      description: "UX research, prototyping, Figma, design thinking, accessibility.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Elective", "UI/UX", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS458",
      title: "Computational Biology",
      description: "Genomics, protein folding, phylogenetics, biological data analysis.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Elective", "Interdisciplinary", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS459",
      title: "Computational Finance",
      description: "Algorithmic trading, risk modeling, financial data analysis.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Elective", "Interdisciplinary", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS460",
      title: "5G and Next-Generation Networks",
      description: "5G architecture, network slicing, edge computing for 5G.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Elective", "Networks", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS461",
      title: "Edge and Fog Computing",
      description: "Edge computing architectures, latency optimization, IoT integration.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Elective", "Systems", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS462",
      title: "NoSQL Databases",
      description: "MongoDB, Cassandra, Redis, document/graph/key-value stores.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Elective", "Database", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS463",
      title: "GraphQL and Modern APIs",
      description: "GraphQL, Apollo, REST vs GraphQL, API design patterns.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Elective", "Web", "Year 3-4"],
      university: "SMU" as University,
    },
    {
      code: "CS464",
      title: "FPGA and Hardware Acceleration",
      description: "FPGA programming, Verilog, hardware acceleration for ML.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Elective", "Hardware", "Year 3-4"],
      university: "SMU" as University,
    },

    // ========== CAPSTONE (5 courses) ==========
    {
      code: "CS490",
      title: "Senior Project I",
      description: "First semester of two-semester capstone project. Planning and initial development.",
      units: 4,
      termsOffered: ["Fall"],
      tags: ["Capstone", "Year 4"],
      university: "SMU" as University,
    },
    {
      code: "CS491",
      title: "Senior Project II",
      description: "Second semester of capstone project. Completion, testing, and presentation.",
      units: 4,
      termsOffered: ["Spring"],
      tags: ["Capstone", "Year 4"],
      university: "SMU" as University,
    },
    {
      code: "CS492",
      title: "Industry Internship",
      description: "Supervised internship at a technology company. Full-time for one semester.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Capstone", "Internship", "Year 4"],
      university: "SMU" as University,
    },
    {
      code: "CS493",
      title: "Research Internship",
      description: "Research project with faculty or external research lab.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Capstone", "Research", "Year 4"],
      university: "SMU" as University,
    },
    {
      code: "CS494",
      title: "Honors Thesis",
      description: "Independent research culminating in thesis for honors students.",
      units: 4,
      termsOffered: ["Fall", "Spring"],
      tags: ["Capstone", "Honors", "Year 4"],
      university: "SMU" as University,
    },
  ]

  await prisma.course.createMany({ data: smuCoursesData })
  return await prisma.course.findMany({ where: { university: "SMU" } })
}


// ============================================================
// 4. Create Prerequisites (220+ relationships)
// ============================================================
async function createPrerequisites(smuCourses: any[]) {
  const findCourse = (code: string) =>
    smuCourses.find((c) => c.code === code)

  const prerequisites: { from: string; to: string; type: string }[] = [
    // ========== SMU PREREQUISITES ==========

    // Foundation → Core chains
    { from: "CS101", to: "CS102", type: "HARD" },
    { from: "CS102", to: "CS201", type: "HARD" },
    { from: "CS102", to: "CS202", type: "HARD" },
    { from: "CS102", to: "CS203", type: "HARD" },
    { from: "CS201", to: "CS301", type: "HARD" },
    { from: "CS202", to: "CS301", type: "HARD" },

    // Math path
    { from: "MATH101", to: "MATH102", type: "HARD" },
    { from: "MATH102", to: "MATH103", type: "HARD" },
    { from: "MATH103", to: "CS201", type: "SOFT" },
    { from: "MATH101", to: "STAT101", type: "SOFT" },
    { from: "STAT101", to: "CS410", type: "SOFT" },

    // IS path
    { from: "IS101", to: "IS102", type: "HARD" },

    // Year 2 → Year 3
    { from: "CS201", to: "CS302", type: "HARD" },
    { from: "CS201", to: "CS303", type: "HARD" },
    { from: "CS202", to: "CS304", type: "HARD" },
    { from: "CS203", to: "CS305", type: "HARD" },
    { from: "CS204", to: "CS306", type: "HARD" },
    { from: "CS205", to: "CS307", type: "HARD" },
    { from: "CS206", to: "CS308", type: "HARD" },
    { from: "CS207", to: "CS309", type: "HARD" },
    { from: "CS208", to: "CS310", type: "HARD" },
    { from: "CS209", to: "CS311", type: "HARD" },
    { from: "CS210", to: "CS312", type: "HARD" },

    // Advanced core prerequisites
    { from: "CS301", to: "CS313", type: "HARD" },
    { from: "CS302", to: "CS314", type: "HARD" },
    { from: "CS303", to: "CS315", type: "HARD" },

    // Software Engineering Track
    { from: "CS203", to: "CS400", type: "HARD" },
    { from: "CS301", to: "CS401", type: "HARD" },
    { from: "CS204", to: "CS402", type: "HARD" },
    { from: "CS203", to: "CS403", type: "SOFT" },
    { from: "CS203", to: "CS404", type: "SOFT" },
    { from: "CS205", to: "CS405", type: "HARD" },
    { from: "CS203", to: "CS406", type: "SOFT" },
    { from: "CS400", to: "CS407", type: "HARD" },
    { from: "CS203", to: "CS408", type: "SOFT" },
    { from: "CS400", to: "CS409", type: "HARD" },

    // Data Science & AI Track
    { from: "CS207", to: "CS410", type: "HARD" },
    { from: "CS410", to: "CS411", type: "HARD" },
    { from: "CS410", to: "CS412", type: "HARD" },
    { from: "CS410", to: "CS413", type: "HARD" },
    { from: "STAT101", to: "CS414", type: "SOFT" },
    { from: "CS204", to: "CS415", type: "HARD" },
    { from: "CS410", to: "CS416", type: "HARD" },
    { from: "CS207", to: "CS417", type: "SOFT" },
    { from: "CS201", to: "CS418", type: "HARD" },
    { from: "CS410", to: "CS419", type: "HARD" },

    // Cybersecurity Track
    { from: "CS206", to: "CS420", type: "HARD" },
    { from: "CS208", to: "CS421", type: "HARD" },
    { from: "CS420", to: "CS422", type: "HARD" },
    { from: "CS208", to: "CS423", type: "SOFT" },
    { from: "CS420", to: "CS424", type: "HARD" },
    { from: "CS420", to: "CS425", type: "SOFT" },
    { from: "CS421", to: "CS426", type: "HARD" },
    { from: "CS204", to: "CS427", type: "SOFT" },
    { from: "CS206", to: "CS428", type: "SOFT" },
    { from: "CS420", to: "CS429", type: "HARD" },

    // Systems & Networks Track
    { from: "CS208", to: "CS430", type: "HARD" },
    { from: "CS209", to: "CS431", type: "HARD" },
    { from: "CS206", to: "CS432", type: "HARD" },
    { from: "CS208", to: "CS433", type: "HARD" },
    { from: "CS210", to: "CS434", type: "HARD" },
    { from: "CS208", to: "CS435", type: "SOFT" },
    { from: "CS206", to: "CS436", type: "SOFT" },
    { from: "CS208", to: "CS437", type: "HARD" },
    { from: "CS206", to: "CS438", type: "SOFT" },
    { from: "CS430", to: "CS439", type: "HARD" },

    // Electives prerequisites
    { from: "CS301", to: "CS450", type: "SOFT" },
    { from: "CS207", to: "CS451", type: "SOFT" },
    { from: "CS204", to: "CS452", type: "SOFT" },
    { from: "CS301", to: "CS453", type: "SOFT" },
    { from: "CS205", to: "CS454", type: "SOFT" },
    { from: "CS207", to: "CS455", type: "SOFT" },
    { from: "IS102", to: "CS456", type: "SOFT" },
    { from: "CS203", to: "CS457", type: "SOFT" },
    { from: "CS204", to: "CS458", type: "SOFT" },
    { from: "CS207", to: "CS459", type: "SOFT" },
    { from: "CS206", to: "CS460", type: "SOFT" },
    { from: "CS207", to: "CS461", type: "SOFT" },
    { from: "CS204", to: "CS462", type: "SOFT" },
    { from: "CS205", to: "CS463", type: "SOFT" },
    { from: "CS210", to: "CS464", type: "SOFT" },

    // Capstone prerequisites
    { from: "CS301", to: "CS490", type: "HARD" },
    { from: "CS490", to: "CS491", type: "HARD" },
    { from: "CS301", to: "CS492", type: "HARD" },
    { from: "CS301", to: "CS493", type: "HARD" },
    { from: "CS301", to: "CS494", type: "HARD" },

    // Some COREQUISITE examples
    { from: "CS201", to: "CS202", type: "COREQUISITE" },
    { from: "CS301", to: "CS302", type: "COREQUISITE" },
    { from: "CS410", to: "CS418", type: "COREQUISITE" },
    { from: "CS420", to: "CS423", type: "COREQUISITE" },
  ]

  // Create prerequisite records
  const prereqData = prerequisites
    .map((p) => {
      const fromCourse = findCourse(p.from)
      const toCourse = findCourse(p.to)

      if (!fromCourse || !toCourse) {
        console.warn(`⚠️  Skipping prerequisite: ${p.from} → ${p.to} (course not found)`)
        return null
      }

      return {
        courseId: toCourse.id,
        prerequisiteCourseId: fromCourse.id,
        type: p.type as "HARD" | "SOFT" | "COREQUISITE",
      }
    })
    .filter(Boolean) as any[]

  await prisma.prerequisite.createMany({ data: prereqData })

  return prereqData.length
}

// ============================================================
// 5. Create Test Students with Academic History
// ============================================================
async function createTestStudents(smuCourses: any[]) {
  const findCourse = (code: string) =>
    smuCourses.find((c) => c.code === code)

  // Hash password for all test accounts
  const passwordHash = await hashPassword("password123")

  // 1. FRESHMAN - Fresh start, no courses completed
  await prisma.user.create({
    data: {
      email: "freshman@smu.edu.sg",
      name: "Alex Freshman",
      emailVerified: true,
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
          university: "SMU",
          major: "Computer Science",
          year: 1,
          enrollmentYear: 2025,
          expectedGraduationYear: 2029,
          gpa: 0.0,
        },
      },
    },
  })
  console.log(`  ✅ Created freshman@smu.edu.sg`)

  // 2. SOPHOMORE - 8 Year 1 courses completed, GPA 3.5
  const sophomore = await prisma.user.create({
    data: {
      email: "sophomore@smu.edu.sg",
      name: "Jordan Sophomore",
      emailVerified: true,
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
          university: "SMU",
          major: "Computer Science",
          year: 2,
          enrollmentYear: 2024,
          expectedGraduationYear: 2028,
          gpa: 3.5,
        },
      },
    },
    include: { student: true },
  })

  await prisma.completedCourse.createMany({
    data: [
      { studentId: sophomore.student!.id, courseId: findCourse("CS101")!.id, grade: "A", term: "2024-Fall" },
      { studentId: sophomore.student!.id, courseId: findCourse("CS102")!.id, grade: "A-", term: "2025-Spring" },
      { studentId: sophomore.student!.id, courseId: findCourse("MATH101")!.id, grade: "B+", term: "2024-Fall" },
      { studentId: sophomore.student!.id, courseId: findCourse("MATH102")!.id, grade: "A", term: "2025-Spring" },
      { studentId: sophomore.student!.id, courseId: findCourse("IS101")!.id, grade: "A", term: "2024-Fall" },
      { studentId: sophomore.student!.id, courseId: findCourse("COMM101")!.id, grade: "B+", term: "2025-Spring" },
      { studentId: sophomore.student!.id, courseId: findCourse("STAT101")!.id, grade: "B", term: "2024-Fall" },
      { studentId: sophomore.student!.id, courseId: findCourse("MATH103")!.id, grade: "A-", term: "2025-Spring" },
    ],
  })
  console.log(`  ✅ Created sophomore@smu.edu.sg (8 courses, GPA 3.5)`)

  // 3. JUNIOR - 20 courses completed (Year 1-2 complete), GPA 3.7
  const junior = await prisma.user.create({
    data: {
      email: "junior@smu.edu.sg",
      name: "Taylor Junior",
      emailVerified: true,
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
          university: "SMU",
          major: "Computer Science",
          year: 3,
          enrollmentYear: 2023,
          expectedGraduationYear: 2027,
          gpa: 3.7,
        },
      },
    },
    include: { student: true },
  })

  await prisma.completedCourse.createMany({
    data: [
      // Year 1 (8 courses)
      { studentId: junior.student!.id, courseId: findCourse("CS101")!.id, grade: "A", term: "2023-Fall" },
      { studentId: junior.student!.id, courseId: findCourse("CS102")!.id, grade: "A", term: "2024-Spring" },
      { studentId: junior.student!.id, courseId: findCourse("MATH101")!.id, grade: "A-", term: "2023-Fall" },
      { studentId: junior.student!.id, courseId: findCourse("MATH102")!.id, grade: "A", term: "2024-Spring" },
      { studentId: junior.student!.id, courseId: findCourse("IS101")!.id, grade: "A-", term: "2023-Fall" },
      { studentId: junior.student!.id, courseId: findCourse("COMM101")!.id, grade: "B+", term: "2024-Spring" },
      { studentId: junior.student!.id, courseId: findCourse("STAT101")!.id, grade: "A-", term: "2023-Fall" },
      { studentId: junior.student!.id, courseId: findCourse("MATH103")!.id, grade: "A", term: "2024-Spring" },
      // Year 2 (10 courses)
      { studentId: junior.student!.id, courseId: findCourse("CS201")!.id, grade: "A", term: "2024-Fall" },
      { studentId: junior.student!.id, courseId: findCourse("CS202")!.id, grade: "A-", term: "2024-Fall" },
      { studentId: junior.student!.id, courseId: findCourse("CS203")!.id, grade: "A", term: "2024-Fall" },
      { studentId: junior.student!.id, courseId: findCourse("CS204")!.id, grade: "B+", term: "2025-Spring" },
      { studentId: junior.student!.id, courseId: findCourse("CS205")!.id, grade: "A", term: "2025-Spring" },
      { studentId: junior.student!.id, courseId: findCourse("CS206")!.id, grade: "A-", term: "2025-Spring" },
      { studentId: junior.student!.id, courseId: findCourse("IS102")!.id, grade: "A", term: "2024-Fall" },
      { studentId: junior.student!.id, courseId: findCourse("ECON101")!.id, grade: "B+", term: "2024-Fall" },
      { studentId: junior.student!.id, courseId: findCourse("PHIL101")!.id, grade: "A-", term: "2025-Spring" },
      { studentId: junior.student!.id, courseId: findCourse("WRIT101")!.id, grade: "B+", term: "2025-Spring" },
      // Some Year 3 (2 courses)
      { studentId: junior.student!.id, courseId: findCourse("CS301")!.id, grade: "A", term: "2025-Fall" },
      { studentId: junior.student!.id, courseId: findCourse("CS302")!.id, grade: "A-", term: "2025-Fall" },
    ],
  })
  console.log(`  ✅ Created junior@smu.edu.sg (20 courses, GPA 3.7)`)

  // 4. SENIOR - 32 courses completed, almost graduated, GPA 3.8
  const senior = await prisma.user.create({
    data: {
      email: "senior@smu.edu.sg",
      name: "Morgan Senior",
      emailVerified: true,
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
          university: "SMU",
          major: "Computer Science",
          year: 4,
          enrollmentYear: 2022,
          expectedGraduationYear: 2026,
          gpa: 3.8,
        },
      },
    },
    include: { student: true },
  })

  await prisma.completedCourse.createMany({
    data: [
      // Year 1 (8 courses)
      { studentId: senior.student!.id, courseId: findCourse("CS101")!.id, grade: "A", term: "2022-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS102")!.id, grade: "A", term: "2023-Spring" },
      { studentId: senior.student!.id, courseId: findCourse("MATH101")!.id, grade: "A-", term: "2022-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("MATH102")!.id, grade: "A", term: "2023-Spring" },
      { studentId: senior.student!.id, courseId: findCourse("IS101")!.id, grade: "A", term: "2022-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("COMM101")!.id, grade: "A-", term: "2023-Spring" },
      { studentId: senior.student!.id, courseId: findCourse("STAT101")!.id, grade: "A", term: "2022-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("MATH103")!.id, grade: "A", term: "2023-Spring" },
      // Year 2 (10 courses)
      { studentId: senior.student!.id, courseId: findCourse("CS201")!.id, grade: "A", term: "2023-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS202")!.id, grade: "A", term: "2023-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS203")!.id, grade: "A-", term: "2023-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS204")!.id, grade: "A", term: "2024-Spring" },
      { studentId: senior.student!.id, courseId: findCourse("CS205")!.id, grade: "A", term: "2024-Spring" },
      { studentId: senior.student!.id, courseId: findCourse("CS206")!.id, grade: "A-", term: "2024-Spring" },
      { studentId: senior.student!.id, courseId: findCourse("IS102")!.id, grade: "A", term: "2023-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("ECON101")!.id, grade: "A-", term: "2023-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("PHIL101")!.id, grade: "A", term: "2024-Spring" },
      { studentId: senior.student!.id, courseId: findCourse("WRIT101")!.id, grade: "A-", term: "2024-Spring" },
      // Year 3 (10 courses)
      { studentId: senior.student!.id, courseId: findCourse("CS301")!.id, grade: "A", term: "2024-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS302")!.id, grade: "A", term: "2024-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS303")!.id, grade: "A-", term: "2024-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS304")!.id, grade: "A", term: "2025-Spring" },
      { studentId: senior.student!.id, courseId: findCourse("CS305")!.id, grade: "A-", term: "2025-Spring" },
      { studentId: senior.student!.id, courseId: findCourse("CS400")!.id, grade: "A", term: "2024-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS401")!.id, grade: "A", term: "2025-Spring" },
      { studentId: senior.student!.id, courseId: findCourse("CS402")!.id, grade: "A-", term: "2025-Spring" },
      { studentId: senior.student!.id, courseId: findCourse("CS450")!.id, grade: "A", term: "2024-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS451")!.id, grade: "B+", term: "2025-Spring" },
      // Year 4 so far (4 courses)
      { studentId: senior.student!.id, courseId: findCourse("CS403")!.id, grade: "A", term: "2025-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS404")!.id, grade: "A", term: "2025-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS490")!.id, grade: "A-", term: "2025-Fall" },
      { studentId: senior.student!.id, courseId: findCourse("CS452")!.id, grade: "A", term: "2025-Fall" },
    ],
  })
  console.log(`  ✅ Created senior@smu.edu.sg (32 courses, GPA 3.8)`)

  // 5. STRUGGLING STUDENT - Behind schedule, low GPA, grade deficiency
  const struggling = await prisma.user.create({
    data: {
      email: "struggling@smu.edu.sg",
      name: "Casey Struggling",
      emailVerified: true,
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
          university: "SMU",
          major: "Computer Science",
          year: 3,
          enrollmentYear: 2023,
          expectedGraduationYear: 2027,
          gpa: 2.3,
        },
      },
    },
    include: { student: true },
  })

  await prisma.completedCourse.createMany({
    data: [
      // Year 1 - Mixed grades
      { studentId: struggling.student!.id, courseId: findCourse("CS101")!.id, grade: "C+", term: "2023-Fall" },
      { studentId: struggling.student!.id, courseId: findCourse("CS102")!.id, grade: "D", term: "2024-Spring" },
      { studentId: struggling.student!.id, courseId: findCourse("MATH101")!.id, grade: "C", term: "2023-Fall" },
      { studentId: struggling.student!.id, courseId: findCourse("MATH102")!.id, grade: "C-", term: "2024-Spring" },
      { studentId: struggling.student!.id, courseId: findCourse("IS101")!.id, grade: "B", term: "2023-Fall" },
      { studentId: struggling.student!.id, courseId: findCourse("COMM101")!.id, grade: "B-", term: "2024-Spring" },
      // Year 2 - Still struggling
      { studentId: struggling.student!.id, courseId: findCourse("STAT101")!.id, grade: "C+", term: "2024-Fall" },
      { studentId: struggling.student!.id, courseId: findCourse("MATH103")!.id, grade: "C", term: "2024-Fall" },
      { studentId: struggling.student!.id, courseId: findCourse("IS102")!.id, grade: "B-", term: "2025-Spring" },
      { studentId: struggling.student!.id, courseId: findCourse("ECON101")!.id, grade: "C+", term: "2025-Spring" },
      // Year 3 - Few courses
      { studentId: struggling.student!.id, courseId: findCourse("PHIL101")!.id, grade: "B", term: "2025-Fall" },
      { studentId: struggling.student!.id, courseId: findCourse("WRIT101")!.id, grade: "C+", term: "2025-Fall" },
    ],
  })
  console.log(`  ✅ Created struggling@smu.edu.sg (12 courses, GPA 2.3, D in CS102)`)
}

// ============================================================
// 6. Seed Professors & Course Instructors
// (SMU SCIS faculty scraped from computing.smu.edu.sg)
// ============================================================
async function seedProfessors(smuCourses: any[]) {
  const findCourse = (code: string) =>
    smuCourses.find((c) => c.code === code)

  // Real SMU SCIS Faculty (scraped from computing.smu.edu.sg/faculty/profile/)
  const scisFaculty = [
    // Professors
    { name: "Sun Jun", university: "SMU" as University, department: "Computer Science" },
    { name: "Debin Gao", university: "SMU" as University, department: "Computer Science" },
    { name: "Lim Ee Peng", university: "SMU" as University, department: "Computer Science" },
    { name: "Rajesh Krishna Balan", university: "SMU" as University, department: "Computer Science" },
    { name: "Zheng Baihua", university: "SMU" as University, department: "Computer Science" },
    { name: "Venky Shankararaman", university: "SMU" as University, department: "Information Systems" },
    { name: "Michelle Cheong", university: "SMU" as University, department: "Information Systems" },
    // Associate Professors
    { name: "Chris Poskitt", university: "SMU" as University, department: "Computer Science" },
    { name: "Dai Bing Tian", university: "SMU" as University, department: "Computer Science" },
    { name: "Don Ta", university: "SMU" as University, department: "Computer Science" },
    { name: "Ouh Eng Lieh", university: "SMU" as University, department: "Computer Science" },
    { name: "Yang Guomin", university: "SMU" as University, department: "Computer Science" },
    { name: "He Shengfeng", university: "SMU" as University, department: "Computer Science" },
    { name: "Kyong Jin Shim", university: "SMU" as University, department: "Information Systems" },
    { name: "Qian Tang", university: "SMU" as University, department: "Information Systems" },
    // Assistant Professors
    { name: "Antoine Ledent", university: "SMU" as University, department: "Computer Science" },
    { name: "Duan Yue", university: "SMU" as University, department: "Computer Science" },
    { name: "Xie Xiaofei", university: "SMU" as University, department: "Computer Science" },
    { name: "Jonathan David Chase", university: "SMU" as University, department: "Computer Science" },
    // Principal Lecturer
    { name: "Lee Yeow Leong", university: "SMU" as University, department: "Computer Science" },
  ]

  await prisma.professor.createMany({ data: scisFaculty })
  const allProfessors = await prisma.professor.findMany()
  const findProf = (name: string) => allProfessors.find((p) => p.name === name)

  // Link professors to SMU courses (based on research areas)
  const instructorLinks = [
    // Sun Jun - Software Engineering, AI, Cybersecurity
    { prof: "Sun Jun", course: "CS203", term: "2024-Fall" },
    { prof: "Sun Jun", course: "CS400", term: "2025-Fall" },
    // Debin Gao - Cybersecurity, Software Engineering
    { prof: "Debin Gao", course: "CS206", term: "2024-Fall" },
    { prof: "Debin Gao", course: "CS420", term: "2025-Spring" },
    // Lim Ee Peng - AI, Data Science
    { prof: "Lim Ee Peng", course: "CS207", term: "2024-Fall" },
    { prof: "Lim Ee Peng", course: "CS410", term: "2025-Fall" },
    // Zheng Baihua - Data Management, AI
    { prof: "Zheng Baihua", course: "CS204", term: "2024-Fall" },
    { prof: "Zheng Baihua", course: "CS204", term: "2025-Spring" },
    // Chris Poskitt - Software Engineering, Cybersecurity
    { prof: "Chris Poskitt", course: "CS203", term: "2025-Spring" },
    { prof: "Chris Poskitt", course: "CS305", term: "2025-Spring" },
    // Dai Bing Tian - ML, AI
    { prof: "Dai Bing Tian", course: "CS301", term: "2024-Fall" },
    { prof: "Dai Bing Tian", course: "CS411", term: "2025-Spring" },
    // Don Ta - ML, Software Engineering
    { prof: "Don Ta", course: "CS101", term: "2024-Fall" },
    { prof: "Don Ta", course: "CS101", term: "2025-Spring" },
    // Ouh Eng Lieh - ML, HCI, Software Engineering
    { prof: "Ouh Eng Lieh", course: "CS102", term: "2024-Fall" },
    { prof: "Ouh Eng Lieh", course: "CS102", term: "2025-Spring" },
    // Yang Guomin - Cybersecurity
    { prof: "Yang Guomin", course: "CS421", term: "2025-Spring" },
    { prof: "Yang Guomin", course: "CS422", term: "2025-Fall" },
    // He Shengfeng - ML, Multimedia
    { prof: "He Shengfeng", course: "CS301", term: "2025-Spring" },
    { prof: "He Shengfeng", course: "CS412", term: "2025-Fall" },
    // Venky Shankararaman - IS, Software Engineering
    { prof: "Venky Shankararaman", course: "IS101", term: "2024-Fall" },
    { prof: "Venky Shankararaman", course: "IS102", term: "2025-Spring" },
    // Michelle Cheong - AI, Decision Making
    { prof: "Michelle Cheong", course: "CS207", term: "2025-Spring" },
    { prof: "Michelle Cheong", course: "CS414", term: "2025-Fall" },
    // Kyong Jin Shim - ML, HCI, Analytics
    { prof: "Kyong Jin Shim", course: "CS205", term: "2024-Fall" },
    { prof: "Kyong Jin Shim", course: "CS205", term: "2025-Spring" },
    // Qian Tang - IS Management, Analytics
    { prof: "Qian Tang", course: "IS101", term: "2025-Spring" },
    // Antoine Ledent - AI, ML
    { prof: "Antoine Ledent", course: "CS201", term: "2024-Fall" },
    { prof: "Antoine Ledent", course: "CS201", term: "2025-Spring" },
    // Duan Yue - Cybersecurity, Software Engineering
    { prof: "Duan Yue", course: "CS305", term: "2024-Fall" },
    { prof: "Duan Yue", course: "CS423", term: "2025-Fall" },
    // Xie Xiaofei - ML, Software Engineering, Cybersecurity
    { prof: "Xie Xiaofei", course: "CS302", term: "2024-Fall" },
    { prof: "Xie Xiaofei", course: "CS302", term: "2025-Spring" },
    // Jonathan David Chase - Optimization, AI
    { prof: "Jonathan David Chase", course: "CS451", term: "2025-Spring" },
    { prof: "Jonathan David Chase", course: "CS418", term: "2025-Fall" },
    // Lee Yeow Leong - Software Engineering
    { prof: "Lee Yeow Leong", course: "CS203", term: "2024-Fall" },
    { prof: "Lee Yeow Leong", course: "CS400", term: "2024-Fall" },
    // Rajesh Krishna Balan - Pervasive Systems
    { prof: "Rajesh Krishna Balan", course: "CS208", term: "2024-Fall" },
    { prof: "Rajesh Krishna Balan", course: "CS208", term: "2025-Spring" },
  ]

  const instructorData = instructorLinks
    .map((link) => {
      const prof = findProf(link.prof)
      const course = findCourse(link.course)
      if (!prof || !course) return null
      return { professorId: prof.id, courseId: course.id, term: link.term }
    })
    .filter(Boolean) as any[]

  await prisma.courseInstructor.createMany({ data: instructorData })

  return allProfessors
}

// ============================================================
// 7. Seed Reviews
// ============================================================
async function seedReviews(smuCourses: any[]) {
  const findCourse = (code: string) =>
    smuCourses.find((c) => c.code === code)

  // Get students and professors
  const juniorUser = await prisma.user.findUnique({ where: { email: "junior@smu.edu.sg" }, include: { student: true } })
  const seniorUser = await prisma.user.findUnique({ where: { email: "senior@smu.edu.sg" }, include: { student: true } })
  const sophomoreUser = await prisma.user.findUnique({ where: { email: "sophomore@smu.edu.sg" }, include: { student: true } })

  const allProfessors = await prisma.professor.findMany()
  const findProf = (name: string) => allProfessors.find((p) => p.name === name)

  // Course reviews
  const courseReviewsData = [
    // Junior's reviews
    { student: juniorUser!.student!, courseCode: "CS101", rating: 5, difficulty: 2, workload: 2, term: "2023-Fall",
      content: "Great introductory course. Professor explains concepts clearly and the assignments build on each other nicely. Highly recommend for first-year students." },
    { student: juniorUser!.student!, courseCode: "CS102", rating: 4, difficulty: 3, workload: 3, term: "2024-Spring",
      content: "Solid course on data structures. The lab sessions were very helpful for understanding linked lists and trees. Exams can be tricky though." },
    { student: juniorUser!.student!, courseCode: "CS201", rating: 5, difficulty: 4, workload: 4, term: "2024-Fall",
      content: "Challenging but rewarding. Dynamic programming section was tough but the professor broke it down well. Office hours were essential." },
    { student: juniorUser!.student!, courseCode: "CS203", rating: 4, difficulty: 3, workload: 3, term: "2024-Fall",
      content: "Good overview of software engineering practices. Group project was a great learning experience. Could use more on modern DevOps practices." },
    { student: juniorUser!.student!, courseCode: "MATH101", rating: 3, difficulty: 3, workload: 2, term: "2023-Fall",
      content: "Standard calculus course. Nothing extraordinary but covers the fundamentals well. Textbook is helpful for self-study." },
    { student: juniorUser!.student!, courseCode: "CS301", rating: 5, difficulty: 5, workload: 5, term: "2025-Fall",
      content: "The most challenging course I have taken. Machine learning concepts are fascinating. Heavy math prerequisites but incredibly rewarding." },
    // Senior's reviews
    { student: seniorUser!.student!, courseCode: "CS101", rating: 4, difficulty: 2, workload: 2, term: "2022-Fall",
      content: "Well-structured intro course. Python is a great first language. Weekly quizzes kept you on track. Wish there were more real-world examples." },
    { student: seniorUser!.student!, courseCode: "CS102", rating: 5, difficulty: 3, workload: 3, term: "2023-Spring",
      content: "Essential for any CS student. The progression from arrays to trees to graphs is logical. Best TA team I have encountered." },
    { student: seniorUser!.student!, courseCode: "CS201", rating: 4, difficulty: 4, workload: 4, term: "2023-Fall",
      content: "Algorithm design thinking changes how you approach problems. Graph algorithms section was my favorite. Start the assignments early." },
    { student: seniorUser!.student!, courseCode: "CS203", rating: 5, difficulty: 3, workload: 4, term: "2023-Fall",
      content: "Excellent preparation for industry. Agile methodology practice was very practical. The group project simulates real work environments." },
    { student: seniorUser!.student!, courseCode: "CS301", rating: 4, difficulty: 5, workload: 5, term: "2024-Fall",
      content: "Steep learning curve but the content is cutting-edge. Neural network assignments were particularly interesting. Need strong math background." },
    { student: seniorUser!.student!, courseCode: "CS400", rating: 5, difficulty: 4, workload: 4, term: "2024-Fall",
      content: "Advanced software engineering at its best. Design patterns and architecture discussions were invaluable. Code reviews taught me a lot." },
    { student: seniorUser!.student!, courseCode: "CS450", rating: 4, difficulty: 3, workload: 3, term: "2024-Fall",
      content: "Fun and creative course. Building a game from scratch was incredibly satisfying. Unity engine has a learning curve but worth it." },
    // Sophomore's reviews
    { student: sophomoreUser!.student!, courseCode: "CS101", rating: 5, difficulty: 1, workload: 2, term: "2024-Fall",
      content: "Perfect introduction to programming. I had no prior coding experience and this course made everything click. Highly recommended for beginners." },
    { student: sophomoreUser!.student!, courseCode: "CS102", rating: 4, difficulty: 3, workload: 3, term: "2025-Spring",
      content: "Good follow-up to CS101. The jump in difficulty is noticeable but manageable. Binary trees took some time to fully understand." },
    { student: sophomoreUser!.student!, courseCode: "MATH101", rating: 3, difficulty: 2, workload: 2, term: "2024-Fall",
      content: "Decent math course. Covers what you need for CS. Some topics felt rushed but overall adequate preparation for further courses." },
  ]

  for (const r of courseReviewsData) {
    const course = findCourse(r.courseCode)
    if (!course) continue
    await prisma.courseReview.create({
      data: {
        studentId: r.student.id,
        courseId: course.id,
        rating: r.rating,
        difficultyRating: r.difficulty,
        workloadRating: r.workload,
        content: r.content,
        term: r.term,
        isAnonymous: true,
      },
    })
  }

  // Professor reviews (using real SCIS faculty names)
  const profReviewsData = [
    // Junior's professor reviews
    { student: juniorUser!.student!, profName: "Don Ta", courseCode: "CS101", rating: 5, difficulty: 2, workload: 2, term: "2023-Fall",
      content: "Don Ta is one of the best professors in SCIS. Explains complex concepts with simple analogies. Always available during office hours and genuinely cares about students." },
    { student: juniorUser!.student!, profName: "Dai Bing Tian", courseCode: "CS102", rating: 4, difficulty: 3, workload: 3, term: "2024-Spring",
      content: "Knowledgeable professor with a deep understanding of data structures. Lectures are well-organized and the coding demos really help reinforce the concepts." },
    { student: juniorUser!.student!, profName: "Ouh Eng Lieh", courseCode: "CS201", rating: 5, difficulty: 4, workload: 4, term: "2024-Fall",
      content: "Ouh Eng Lieh makes algorithms come alive. His enthusiasm is contagious and he genuinely cares about student understanding. Office hours are always packed." },
    { student: juniorUser!.student!, profName: "Chris Poskitt", courseCode: "CS203", rating: 4, difficulty: 3, workload: 4, term: "2024-Fall",
      content: "Chris Poskitt runs a tight ship for software engineering. Great at teaching testing and verification concepts. The group project is very well-structured." },
    { student: juniorUser!.student!, profName: "He Shengfeng", courseCode: "CS301", rating: 5, difficulty: 5, workload: 5, term: "2025-Fall",
      content: "He Shengfeng is incredibly knowledgeable in ML. Lectures are research-level but he makes the material accessible. Assignments are tough but you learn so much." },
    // Senior's professor reviews
    { student: seniorUser!.student!, profName: "Don Ta", courseCode: "CS101", rating: 5, difficulty: 2, workload: 2, term: "2022-Fall",
      content: "Outstanding teacher. Makes programming feel accessible even for complete beginners. Patient and encouraging. Best prof for intro courses." },
    { student: seniorUser!.student!, profName: "He Shengfeng", courseCode: "CS301", rating: 4, difficulty: 5, workload: 5, term: "2024-Fall",
      content: "Very knowledgeable in ML and AI. Research-focused teaching style. Assignments are challenging but you learn a lot from the process." },
    { student: seniorUser!.student!, profName: "Lee Yeow Leong", courseCode: "CS400", rating: 5, difficulty: 4, workload: 4, term: "2024-Fall",
      content: "Lee Yeow Leong brings real industry experience to the classroom. His code review sessions are legendary. Highly recommended for aspiring software engineers." },
    { student: seniorUser!.student!, profName: "Sun Jun", courseCode: "CS203", rating: 5, difficulty: 3, workload: 3, term: "2023-Fall",
      content: "Sun Jun is an excellent lecturer for software engineering. Clear explanations of design patterns and architecture. Very responsive on the forums." },
    // Sophomore's professor reviews
    { student: sophomoreUser!.student!, profName: "Don Ta", courseCode: "CS101", rating: 5, difficulty: 1, workload: 2, term: "2024-Fall",
      content: "Best professor for first-year students. Breaks down programming concepts beautifully. Very approachable and always willing to help after class." },
    { student: sophomoreUser!.student!, profName: "Dai Bing Tian", courseCode: "CS102", rating: 4, difficulty: 3, workload: 3, term: "2025-Spring",
      content: "Clear teaching style for data structures. The lab exercises complement the lectures perfectly. Would take another course with him." },
  ]

  for (const r of profReviewsData) {
    const prof = findProf(r.profName)
    const course = findCourse(r.courseCode)
    if (!prof || !course) continue
    await prisma.professorReview.create({
      data: {
        studentId: r.student.id,
        professorId: prof.id,
        courseId: course.id,
        rating: r.rating,
        difficultyRating: r.difficulty,
        workloadRating: r.workload,
        content: r.content,
        term: r.term,
        isAnonymous: true,
      },
    })
  }

  return { courseReviews: courseReviewsData.length, professorReviews: profReviewsData.length }
}

// ============================================================
// Main Execution
// ============================================================
async function main() {
  console.log("🌱 Starting comprehensive seed...\n")

  // 1. Clear all existing data
  await clearAllData()

  // 2. Seed SMU courses
  const smuCourses = await seedSMUCourses()
  console.log(`✅ Created ${smuCourses.length} SMU courses\n`)

  // 3. Create prerequisites
  const prereqCount = await createPrerequisites(smuCourses)
  console.log(`✅ Created ${prereqCount} prerequisite relationships\n`)

  // 4. Create test students
  await createTestStudents(smuCourses)
  console.log(`✅ Created 5 test students with academic history\n`)

  // 5. Seed professors & course instructors
  const professors = await seedProfessors(smuCourses)
  console.log(`✅ Created ${professors.length} professors with course assignments\n`)

  // 6. Seed reviews
  const reviewCounts = await seedReviews(smuCourses)
  console.log(`✅ Created ${reviewCounts.courseReviews} course reviews and ${reviewCounts.professorReviews} professor reviews\n`)

  // 7. Summary
  console.log("🎉 Seed completed successfully!\n")
  console.log("📊 Summary:")
  console.log(`  - Courses: ${smuCourses.length}`)
  console.log(`  - Prerequisites: ${prereqCount}`)
  console.log(`  - Professors: ${professors.length}`)
  console.log(`  - Course Reviews: ${reviewCounts.courseReviews}`)
  console.log(`  - Professor Reviews: ${reviewCounts.professorReviews}`)
  console.log(`  - Test Students: 5`)
  console.log(`  - Completed Course Records: 65+\n`)
  console.log("📝 Test Accounts (all use password: password123):")
  console.log("  - freshman@smu.edu.sg - Year 1, GPA 0.0, 0 completed")
  console.log("  - sophomore@smu.edu.sg - Year 2, GPA 3.5, 8 completed")
  console.log("  - junior@smu.edu.sg - Year 3, GPA 3.7, 20 completed")
  console.log("  - senior@smu.edu.sg - Year 4, GPA 3.8, 32 completed")
  console.log("  - struggling@smu.edu.sg - Year 3, GPA 2.3, 12 completed (D in CS102)\n")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
