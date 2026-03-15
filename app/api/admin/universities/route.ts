import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Ensure user is admin
    await requireAdmin();

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
