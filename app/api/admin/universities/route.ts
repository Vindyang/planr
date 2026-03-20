import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access-control";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    // Ensure user is admin
    const { user: currentUser } = await requireAdmin();

    // Check permission to view universities
    if (!hasPermission(currentUser.role as UserRole, "university", "view")) {
      return NextResponse.json(
        { error: "You do not have permission to view universities" },
        { status: 403 }
      );
    }

    const universities = await prisma.university.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
      },
      where: {
        isActive: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    return NextResponse.json({ universities });
  } catch (error) {
    console.error("Error fetching universities:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch universities" },
      { status: 500 }
    );
  }
}
