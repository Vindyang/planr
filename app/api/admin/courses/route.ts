import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logger";
import { hasPermission } from "@/lib/access-control";
import { UserRole } from "@prisma/client";

const createCourseSchema = z.object({
  code: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  description: z.string().default(""),
  units: z.number().int().min(0).max(20),
  universityId: z.string().uuid(),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin
    const { user: currentUser } = await requireAdmin();

    // Check permission to view courses
    if (!hasPermission(currentUser.role as UserRole, "course", "view")) {
      return NextResponse.json(
        { error: "You do not have permission to view courses" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const university = searchParams.get("university") || "";
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");

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

    // Get total count for pagination
    const total = await prisma.course.count({ where });

    // Fetch courses with pagination
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      courses,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
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
    const { user: currentUser } = await requireAdmin();

    // Check permission to create courses
    if (!hasPermission(currentUser.role as UserRole, "course", "create")) {
      return NextResponse.json(
        { error: "You do not have permission to create courses" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createCourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify department exists and matches university (if department is provided)
    if (validation.data.departmentId && validation.data.departmentId !== "") {
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
      data: {
        ...validation.data,
        departmentId: validation.data.departmentId && validation.data.departmentId !== ""
          ? validation.data.departmentId
          : null,
      },
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

    // Log audit trail
    await createAuditLog({
      action: "CREATE",
      entityType: "COURSE",
      entityId: course.id,
      userId: currentUser.id,
      changes: { after: course },
      metadata: getRequestMetadata(request),
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
