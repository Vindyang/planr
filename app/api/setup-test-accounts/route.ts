import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    // Check if running in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      )
    }

    const testAccounts = [
      {
        email: "freshman@smu.edu.sg",
        password: "password123",
        name: "Alex Freshman",
        university: "SMU" as const,
        major: "Computer Science",
        year: 1,
        enrollmentYear: 2025,
        expectedGraduationYear: 2029,
        gpa: 0.0,
      },
      {
        email: "sophomore@smu.edu.sg",
        password: "password123",
        name: "Jordan Sophomore",
        university: "SMU" as const,
        major: "Computer Science",
        year: 2,
        enrollmentYear: 2024,
        expectedGraduationYear: 2028,
        gpa: 3.5,
      },
      {
        email: "junior@smu.edu.sg",
        password: "password123",
        name: "Taylor Junior",
        university: "SMU" as const,
        major: "Computer Science",
        year: 3,
        enrollmentYear: 2023,
        expectedGraduationYear: 2027,
        gpa: 3.7,
      },
      {
        email: "senior@smu.edu.sg",
        password: "password123",
        name: "Morgan Senior",
        university: "SMU" as const,
        major: "Computer Science",
        year: 4,
        enrollmentYear: 2022,
        expectedGraduationYear: 2026,
        gpa: 3.8,
      },
      {
        email: "struggling@smu.edu.sg",
        password: "password123",
        name: "Casey Struggling",
        university: "SMU" as const,
        major: "Computer Science",
        year: 3,
        enrollmentYear: 2023,
        expectedGraduationYear: 2027,
        gpa: 2.3,
      },
      {
        email: "nus-student@nus.edu.sg",
        password: "password123",
        name: "Jamie NUS",
        university: "NUS" as const,
        major: "Computer Science",
        year: 2,
        enrollmentYear: 2024,
        expectedGraduationYear: 2028,
        gpa: 3.6,
      },
    ]

    const created = []

    for (const account of testAccounts) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email },
      })

      if (existingUser) {
        continue
      }

      // Use Better Auth's signUp API to create the user
      const result = await auth.api.signUpEmail({
        body: {
          email: account.email,
          password: account.password,
          name: account.name,
        },
      })

      if (result) {
        // Look up university by code
        const university = await prisma.university.findUnique({
          where: { code: account.university },
        })

        if (!university) {
          console.error(`❌ University ${account.university} not found`)
          continue
        }

        // Look up department (major) by name
        const major = await prisma.department.findFirst({
          where: {
            universityId: university.id,
            name: account.major,
          },
        })

        if (!major) {
          console.error(`❌ Major ${account.major} not found at ${account.university}`)
          continue
        }

        // Create student profile
        await prisma.student.create({
          data: {
            userId: result.user.id,
            universityId: university.id,
            majorId: major.id,
            year: account.year,
            enrollmentYear: account.enrollmentYear,
            expectedGraduationYear: account.expectedGraduationYear,
            gpa: account.gpa,
          },
        })

        created.push(account.email)
        console.log(`✅ Created ${account.email}`)
      }
    }

    return NextResponse.json({
      success: true,
      created,
      message: `Created ${created.length} test accounts`,
    })
  } catch (error: any) {
    console.error("Error creating test accounts:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create test accounts" },
      { status: 500 }
    )
  }
}
