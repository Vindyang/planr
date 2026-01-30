import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const profileSchema = z.object({
  userId: z.string(),
  university: z.enum(["SMU", "NUS", "NTU", "SUTD", "SUSS"]),
  major: z.string().min(2),
  year: z.number().min(1).max(4),
  enrollmentYear: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    // Create student profile
    const student = await prisma.student.create({
      data: {
        userId: validatedData.userId,
        university: validatedData.university,
        major: validatedData.major,
        year: validatedData.year,
        enrollmentYear: validatedData.enrollmentYear,
        expectedGraduationYear: validatedData.enrollmentYear + 4,
        gpa: 0,
      },
    })

    return NextResponse.json(
      {
        message: "Student profile created successfully",
        student: {
          id: student.id,
          university: student.university,
          major: student.major,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Profile creation error:", error)
    return NextResponse.json(
      { error: "Failed to create student profile" },
      { status: 500 }
    )
  }
}
