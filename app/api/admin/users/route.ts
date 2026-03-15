import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") as UserRole | null;
    const university = searchParams.get("university") || "";

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

    // Filter by university (for students)
    if (university) {
      where.student = {
        university: {
          code: university,
        },
      };
    }

    // Fetch users with related data
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
            university: {
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
    });

    return NextResponse.json({ users });
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
