import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin and get current user info
    const { user: currentUser } = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") as UserRole | null;
    const university = searchParams.get("university") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");

    // Build where clause
    const where: any = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by role
    if (role && Object.values(UserRole).includes(role)) {
      where.role = role;
    }

    // COORDINATOR-specific filtering: only show students in their department
    if (currentUser.role === "COORDINATOR") {
      if (!currentUser.assignedDepartmentId) {
        // If coordinator has no assigned department, return empty list
        return NextResponse.json({
          users: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
        });
      }

      // Only show students whose major matches the coordinator's department
      where.role = "STUDENT";
      where.student = {
        majorId: currentUser.assignedDepartmentId,
      };
    }

    // Filter by university (for students) - only if not already set by coordinator filter
    if (university && !where.student) {
      where.student = {
        university: {
          code: university,
        },
      };
    } else if (university && where.student && !where.student.university) {
      // Merge with existing student filter
      where.student.university = {
        code: university,
      };
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Fetch users with related data and pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
        assignedUniversityId: true,
        assignedDepartmentId: true,
        assignedUniversity: {
          select: {
            code: true,
            name: true,
          },
        },
        assignedDepartment: {
          select: {
            code: true,
            name: true,
          },
        },
        student: {
          select: {
            id: true,
            studentId: true,
            majorId: true,
            secondMajorId: true,
            minorId: true,
            universityId: true,
            year: true,
            enrollmentYear: true,
            expectedGraduationYear: true,
            university: {
              select: {
                code: true,
                name: true,
              },
            },
            major: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
