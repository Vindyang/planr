import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("universityId");

    if (!universityId) {
      return NextResponse.json(
        { error: "universityId is required" },
        { status: 400 }
      );
    }

    const departments = await prisma.department.findMany({
      where: {
        universityId,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Error fetching departments:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}
