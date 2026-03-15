import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCourseSchema = z.object({
  code: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  description: z.string().default(""),
  units: z.number().int().min(0).max(20),
  universityId: z.string().uuid(),
  departmentId: z.string().uuid(),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const university = searchParams.get("university") || "";
    const isActive = searchParams.get("isActive");

    // Build where clause
    const where: any = {};

    // Search by code or title
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by university
    if (university) {
      where.university = {
        code: university,
      };
    }

    // Filter by active status
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    // Fetch courses
    const courses = await prisma.course.findMany({
      where,
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        units: true,
        isActive: true,
        university: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            prerequisites: true,
            prerequisiteFor: true,
          },
        },
      },
      orderBy: [
        { university: { code: "asc" } },
        { code: "asc" },
      ],
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching courses:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure user is admin
    await requireAdmin();

    const body = await request.json();
    const validation = createCourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify university and department exist and match
    const department = await prisma.department.findUnique({
      where: { id: validation.data.departmentId },
      select: { universityId: true },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    if (department.universityId !== validation.data.universityId) {
      return NextResponse.json(
        { error: "Department does not belong to the specified university" },
        { status: 400 }
      );
    }

    // Check for duplicate course code within the university
    const existing = await prisma.course.findFirst({
      where: {
        code: validation.data.code,
        universityId: validation.data.universityId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Course code already exists for this university" },
        { status: 409 }
      );
    }

    // Create course
    const course = await prisma.course.create({
      data: validation.data,
      include: {
        university: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
