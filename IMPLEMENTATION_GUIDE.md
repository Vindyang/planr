# Planr - Complete Implementation Guide

## Implementation Progress

### ✅ Completed Steps

- [x] **Prerequisites** - Bun, PostgreSQL, Git installed
- [x] **Project Setup** - Dependencies installed, environment configured
- [x] **Step 1: Database Setup & Prisma Configuration**
  - [x] Initialized Prisma 7.3.0 with pg adapter
  - [x] Created schema with lowercase models
  - [x] Merged Better Auth tables with custom tables
  - [x] Ran initial migration
  - [x] Created seed script (courses only)
  - [x] Successfully seeded database with 10 courses
- [x] **Step 2: Authentication System (Better Auth)**
  - [x] Installed and configured Better Auth
  - [x] Created auth API routes
  - [x] Created login page with Better Auth
  - [x] Created signup page with Better Auth
  - [x] Created student profile API endpoint
  - [x] Created middleware for protected routes
  - [x] Integrated auth with Prisma schema

- [x] **Step 3: Student Profile & Data Management**
  - [x] Created API endpoints for student data (CRUD via Server Actions)
  - [x] Dashboard fetches real student data from API
  - [x] Profile page with edit personal/academic info
  - [x] Add completed courses (searchable course selector, grade, term)
  - [x] Remove completed courses
  - [x] GPA auto-calculates from completed course grades
  - [x] Credits earned sums actual course units
  - [x] Added API response types to lib/types.ts
- [x] **Step 4: Enhanced Eligibility System**
  - [x] Created `lib/eligibility/` module with 7 files
  - [x] Implemented grade requirement checking (C or better for hard prereqs)
  - [x] Implemented prerequisite graph traversal (DFS for chains)
  - [x] Implemented topological sort for suggested course sequences
  - [x] Created `/api/courses/[id]/eligibility` endpoint
  - [x] Updated dashboard to use enhanced eligibility
  - [x] Updated courses pages with eligibility status
  - [x] Added grade deficiency warnings in UI
- [x] **Step 5: Course Catalog & Detail Pages**
  - [x] Course catalog page with search and filters
  - [x] Course detail page with prerequisites display
  - [x] Eligibility status badges on courses
  - [x] "Why not eligible" explanations
  - [x] Suggested course sequence display

### 🚧 In Progress

- [ ] **Step 6: Multi-Semester Planner** - Not started
- [ ] **Step 7: Enhanced Dashboard** - Not started
- [ ] **Step 8: User Experience Enhancements** - Not started
- [ ] **Step 9: Testing & Data Population** - Not started
- [ ] **Step 10: Responsive Design & Mobile Optimization** - Not started

### 📝 Notes

**Key Changes from Original Guide:**
- Using **Better Auth** instead of NextAuth.js
- Using **Prisma 7** with pg adapter (instead of direct connection)
- All database tables use **lowercase names** and **snake_case** columns
- Seed script creates **courses only** (users created via signup flow)
- Using **Supabase** for PostgreSQL hosting
- Environment variables consolidated in single `.env` file

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Step 1: Database Setup & Prisma Configuration](#step-1-database-setup--prisma-configuration)
4. [Step 2: Authentication System](#step-2-authentication-system)
5. [Step 3: Student Profile & Data Management](#step-3-student-profile--data-management)
6. [Step 4: Enhanced Eligibility System](#step-4-enhanced-eligibility-system)
7. [Step 5: Course Catalog & Detail Pages](#step-5-course-catalog--detail-pages)
8. [Step 6: Multi-Semester Planner](#step-6-multi-semester-planner)
9. [Step 7: Enhanced Dashboard](#step-7-enhanced-dashboard)
10. [Step 8: User Experience Enhancements](#step-8-user-experience-enhancements)
11. [Step 9: Testing & Data Population](#step-9-testing--data-population)
12. [Step 10: Responsive Design & Mobile Optimization](#step-10-responsive-design--mobile-optimization)
13. [Verification Checklist](#verification-checklist)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Bun** (v1.0+): Install from https://bun.sh
- **PostgreSQL** (v14+): Install from https://www.postgresql.org/download/
- **Git**: For version control
- **Code Editor**: VS Code recommended with Prisma extension

### Verify Installations

```bash
bun --version
psql --version
git --version
```

---

## Project Setup

### 1. Clone and Initialize

```bash
cd /Users/vindyanggiono/Documents/coding/GitHub/planr
bun install
```

### 2. Install All Dependencies

```bash
# Database & ORM
bun add prisma @prisma/client bcryptjs
bun add -d @types/bcryptjs

# Authentication
bun add next-auth@beta

# Drag-and-Drop
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Form Handling & Validation
bun add zod react-hook-form @hookform/resolvers

# Date Utilities
bun add date-fns

# Dev/Testing
bun add -d vitest @testing-library/react @testing-library/jest-dom
```

### 3. Create Environment File

Create `.env.local` in project root:

```env
# Database (update with your PostgreSQL credentials)
DATABASE_URL="postgresql://postgres:password@localhost:5432/planr"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl-rand-base64-32"

# Optional: For production
# NODE_ENV="production"
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 4. Setup PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE planr;

# Exit psql
\q
```

---

## Step 1: Database Setup & Prisma Configuration

### 1.1 Initialize Prisma

```bash
bunx prisma init
```

### 1.2 Create Prisma Schema

Create/update `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum UserRole {
  STUDENT
  COORDINATOR
  ADMIN
}

enum CourseStatus {
  COMPLETED
  IN_PROGRESS
  PLANNED
}

enum PrerequisiteType {
  HARD
  SOFT
  COREQUISITE
}

enum PlanStatus {
  PLANNED
  ENROLLED
  DROPPED
}

enum University {
  SMU
  NUS
  NTU
  SUTD
  SUSS
}

// Models
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String    @map("password_hash")
  role              UserRole  @default(STUDENT)
  name              String
  emailVerified     Boolean   @default(false) @map("email_verified")
  verificationToken String?   @map("verification_token")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  student           Student?

  @@map("users")
}

model Student {
  id                     String   @id @default(uuid())
  userId                 String   @unique @map("user_id")
  studentId              String?  @map("student_id")
  university             University
  major                  String
  secondMajor            String?  @map("second_major")
  minor                  String?
  year                   Int
  enrollmentYear         Int      @map("enrollment_year")
  expectedGraduationYear Int      @map("expected_graduation_year")
  gpa                    Float    @default(0)

  user                   User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  completedCourses       CompletedCourse[]
  semesterPlans          SemesterPlan[]

  @@map("students")
}

model Course {
  id               String         @id @default(uuid())
  code             String
  university       University
  title            String
  description      String         @db.Text
  units            Int
  termsOffered     String[]       @map("terms_offered")
  tags             String[]
  isActive         Boolean        @default(true) @map("is_active")
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")

  prerequisites    Prerequisite[] @relation("CoursePrerequisites")
  prerequisiteFor  Prerequisite[] @relation("PrerequisiteCourses")
  completedCourses CompletedCourse[]
  plannedCourses   PlannedCourse[]

  @@unique([code, university])
  @@map("courses")
}

model Prerequisite {
  id                    String            @id @default(uuid())
  courseId              String            @map("course_id")
  prerequisiteCourseId  String            @map("prerequisite_course_id")
  type                  PrerequisiteType
  notes                 String?

  course                Course            @relation("CoursePrerequisites", fields: [courseId], references: [id], onDelete: Cascade)
  prerequisiteCourse    Course            @relation("PrerequisiteCourses", fields: [prerequisiteCourseId], references: [id], onDelete: Cascade)

  @@map("prerequisites")
}

model CompletedCourse {
  id         String        @id @default(uuid())
  studentId  String        @map("student_id")
  courseId   String        @map("course_id")
  grade      String
  term       String
  status     CourseStatus  @default(COMPLETED)
  createdAt  DateTime      @default(now()) @map("created_at")

  student    Student       @relation(fields: [studentId], references: [id], onDelete: Cascade)
  course     Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@map("completed_courses")
}

model SemesterPlan {
  id             String          @id @default(uuid())
  studentId      String          @map("student_id")
  term           String
  year           Int
  isActive       Boolean         @default(false) @map("is_active")
  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")

  student        Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  plannedCourses PlannedCourse[]

  @@map("semester_plans")
}

model PlannedCourse {
  id              String        @id @default(uuid())
  semesterPlanId  String        @map("semester_plan_id")
  courseId        String        @map("course_id")
  status          PlanStatus    @default(PLANNED)
  addedAt         DateTime      @default(now()) @map("added_at")

  semesterPlan    SemesterPlan  @relation(fields: [semesterPlanId], references: [id], onDelete: Cascade)
  course          Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@map("planned_courses")
}

model GraduationRequirement {
  id               String      @id @default(uuid())
  university       University
  major            String
  requirementType  String      @map("requirement_type")
  requirementValue Json        @map("requirement_value")

  @@map("graduation_requirements")
}
```

### 1.3 Create Prisma Client Singleton

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 1.4 Run Initial Migration

```bash
bunx prisma migrate dev --name init
```

### 1.5 Create Seed Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient, University, PrerequisiteType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.plannedCourse.deleteMany();
  await prisma.semesterPlan.deleteMany();
  await prisma.completedCourse.deleteMany();
  await prisma.prerequisite.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const studentUser = await prisma.user.create({
    data: {
      email: "student@smu.edu.sg",
      passwordHash: hashedPassword,
      name: "Peter Lim",
      role: "STUDENT",
      emailVerified: true,
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      studentId: "SMU001",
      university: "SMU",
      major: "Computer Science",
      year: 2,
      enrollmentYear: 2023,
      expectedGraduationYear: 2027,
      gpa: 3.67,
    },
  });

  console.log("✅ Created test student:", studentUser.email);

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
  ];

  const createdCourses = await Promise.all(
    courses.map((course) => prisma.course.create({ data: course })),
  );

  console.log(`✅ Created ${createdCourses.length} courses`);

  // Create prerequisites
  const courseMap = new Map(createdCourses.map((c) => [c.code, c]));

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
  ];

  await Promise.all(
    prerequisites.map(({ course, prerequisite, type }) =>
      prisma.prerequisite.create({
        data: {
          courseId: courseMap.get(course)!.id,
          prerequisiteCourseId: courseMap.get(prerequisite)!.id,
          type,
        },
      }),
    ),
  );

  console.log(`✅ Created ${prerequisites.length} prerequisites`);

  // Add completed courses for test student
  await prisma.completedCourse.create({
    data: {
      studentId: student.id,
      courseId: courseMap.get("CS101")!.id,
      grade: "A",
      term: "2024-Fall",
      status: "COMPLETED",
    },
  });

  await prisma.completedCourse.create({
    data: {
      studentId: student.id,
      courseId: courseMap.get("CS102")!.id,
      grade: "B+",
      term: "2025-Spring",
      status: "COMPLETED",
    },
  });

  console.log("✅ Added completed courses for test student");
  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 1.6 Update package.json for Seed

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "bun run prisma/seed.ts"
  }
}
```

### 1.7 Run Seed

```bash
bunx prisma db seed
```

### 1.8 Verify with Prisma Studio

```bash
bunx prisma studio
```

Open http://localhost:5555 and verify:

- Users table has test student
- Courses table has 10 courses
- Prerequisites table has relationships
- CompletedCourses table has 2 entries

---

## Step 2: Authentication System

### 2.1 Create Auth Configuration

Create `lib/auth-options.ts`:

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            student: true,
          },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.student?.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.studentId = user.studentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.studentId = token.studentId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### 2.2 Create NextAuth Types

Create `types/next-auth.d.ts`:

```typescript
import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    studentId?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      studentId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    studentId?: string;
  }
}
```

### 2.3 Create Auth API Route

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 2.4 Create Signup API Route

Create `app/api/auth/signup/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  university: z.enum(["SMU", "NUS", "NTU", "SUTD", "SUSS"]),
  major: z.string().min(2, "Major is required"),
  year: z.number().min(1).max(4),
  enrollmentYear: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Create user and student profile
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        role: "STUDENT",
        student: {
          create: {
            university: validatedData.university,
            major: validatedData.major,
            year: validatedData.year,
            enrollmentYear: validatedData.enrollmentYear,
            expectedGraduationYear: validatedData.enrollmentYear + 4,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
```

### 2.5 Create Auth Helper Functions

Create `lib/auth.ts`:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireStudent() {
  const user = await requireAuth();

  if (user.role !== "STUDENT" || !user.studentId) {
    redirect("/dashboard");
  }

  return user;
}
```

### 2.6 Create Middleware for Protected Routes

Create `middleware.ts` in project root:

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/courses/:path*",
    "/planner/:path*",
  ],
};
```

### 2.7 Create Login Page

Create `app/(auth)/login/page.tsx`:

```typescript
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Planr</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@smu.edu.sg"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>

        <div className="mt-4 rounded-md bg-blue-50 p-3 text-xs text-blue-700">
          <p className="font-semibold">Test Account:</p>
          <p>Email: student@smu.edu.sg</p>
          <p>Password: password123</p>
        </div>
      </Card>
    </div>
  )
}
```

### 2.8 Create Signup Page

Create `app/(auth)/signup/page.tsx`:

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select } from "@/components/ui/select"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "SMU",
    major: "",
    year: 1,
    enrollmentYear: new Date().getFullYear(),
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          university: formData.university,
          major: formData.major,
          year: formData.year,
          enrollmentYear: formData.enrollmentYear,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Something went wrong")
        return
      }

      router.push("/login?registered=true")
    } catch (error) {
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Planr</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">University Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="student@smu.edu.sg"
              required
            />
          </div>

          <div>
            <Label htmlFor="university">University</Label>
            <select
              id="university"
              className="w-full rounded-md border px-3 py-2"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
            >
              <option value="SMU">Singapore Management University</option>
              <option value="NUS">National University of Singapore</option>
              <option value="NTU">Nanyang Technological University</option>
              <option value="SUTD">Singapore University of Technology and Design</option>
              <option value="SUSS">Singapore University of Social Sciences</option>
            </select>
          </div>

          <div>
            <Label htmlFor="major">Major</Label>
            <Input
              id="major"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              placeholder="Computer Science"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Current Year</Label>
              <select
                id="year"
                className="w-full rounded-md border px-3 py-2"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
            </div>

            <div>
              <Label htmlFor="enrollmentYear">Enrollment Year</Label>
              <Input
                id="enrollmentYear"
                type="number"
                value={formData.enrollmentYear}
                onChange={(e) => setFormData({ ...formData, enrollmentYear: parseInt(e.target.value) })}
                min={2020}
                max={2030}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              minLength={8}
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
```

### 2.9 Create Auth Layout

Create `app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

### 2.10 Update Root Layout with SessionProvider

Update `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import SessionProvider from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Planr - Academic Planning Made Easy",
  description: "Plan your university courses with confidence",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

### 2.11 Create SessionProvider Component

Create `components/SessionProvider.tsx`:

```typescript
"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session: any
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
}
```

### 2.12 Update Navbar with User Menu

Update `components/layout/Navbar.tsx` to add logout functionality:

```typescript
"use client"

import { IconSearch, IconBell, IconUser, IconLogout } from "@tabler/icons-react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold">Planr</h1>
          <div className="hidden space-x-6 md:flex">
            <a href="/dashboard" className="text-gray-700 hover:text-gray-900">
              Dashboard
            </a>
            <a href="/planner" className="text-gray-700 hover:text-gray-900">
              Planner
            </a>
            <a href="/courses" className="text-gray-700 hover:text-gray-900">
              Courses
            </a>
            <a href="/reviews" className="text-gray-700 hover:text-gray-900">
              Reviews
            </a>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <IconSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              className="rounded-full border pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="rounded-full p-2 hover:bg-gray-100">
            <IconBell className="h-5 w-5 text-gray-600" />
          </button>

          {session?.user && (
            <div className="relative group">
              <button className="rounded-full p-2 hover:bg-gray-100">
                <IconUser className="h-5 w-5 text-gray-600" />
              </button>

              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-semibold">{session.user.name}</div>
                    <div className="text-xs text-gray-500">{session.user.email}</div>
                  </div>
                  <a
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </a>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <IconLogout className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
```

### 2.13 Test Authentication

```bash
bun run dev
```

Test the following:

1. Navigate to http://localhost:3000/login
2. Login with test account: `student@smu.edu.sg` / `password123`
3. Verify redirect to dashboard
4. Test logout functionality
5. Try accessing protected routes without login (should redirect)
6. Test signup flow with new account

---

## Next Steps

Continue with Step 3: Student Profile & Data Management (see full plan document for remaining steps)

**Success Criteria for Step 2:**

- ✅ Users can sign up with email/password
- ✅ Users can log in and session persists
- ✅ Users can log out
- ✅ Protected routes redirect to /login
- ✅ Navbar shows user profile with dropdown

---

## Quick Commands Reference

```bash
# Development
bun run dev                      # Start development server
bunx prisma studio              # Open database GUI
bunx prisma db seed             # Re-seed database

# Database
bunx prisma migrate dev         # Create and apply migration
bunx prisma migrate reset       # Reset database (careful!)
bunx prisma generate            # Regenerate Prisma client

# Build & Deploy
bun run build                   # Build for production
bun run start                   # Start production server

# Testing
bun test                        # Run tests
bun test --watch               # Run tests in watch mode
```

---

**Note**: This guide covers Steps 1-2 in detail. For Steps 3-10, refer to the full development plan at `/Users/vindyanggiono/.claude/plans/calm-questing-knuth.md` and continue building each feature incrementally.
