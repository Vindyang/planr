import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/access-control";

export async function GET() {
  try {
    // Ensure user is admin
    const { user: currentUser } = await requireAdmin();

    // Check permission to view admin statistics (using audit_log as proxy for admin-level data)
    if (!hasPermission(currentUser.role as UserRole, "audit_log", "view")) {
      return NextResponse.json(
        { error: "You do not have permission to view admin statistics" },
        { status: 403 }
      );
    }

    // Get user counts by role
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        id: true,
      },
    });

    const userCounts = {
      total: 0,
      students: 0,
      coordinators: 0,
      admins: 0,
      superAdmins: 0,
    };

    usersByRole.forEach((group) => {
      userCounts.total += group._count.id;
      switch (group.role) {
        case UserRole.STUDENT:
          userCounts.students = group._count.id;
          break;
        case UserRole.COORDINATOR:
          userCounts.coordinators = group._count.id;
          break;
        case UserRole.ADMIN:
          userCounts.admins = group._count.id;
          break;
        case UserRole.SUPER_ADMIN:
          userCounts.superAdmins = group._count.id;
          break;
      }
    });

    // Get active courses count by university
    const coursesByUniversity = await prisma.course.groupBy({
      by: ["universityId"],
      where: {
        isActive: true,
      },
      _count: {
        id: true,
      },
    });

    // Look up university codes for the IDs
    const universityIds = coursesByUniversity.map((g) => g.universityId);
    const universities = await prisma.university.findMany({
      where: {
        id: {
          in: universityIds,
        },
      },
      select: {
        id: true,
        code: true,
      },
    });

    const universityCodeMap = new Map(universities.map((u) => [u.id, u.code]));

    const courseCounts = {
      total: 0,
      byUniversity: {} as Record<string, number>,
    };

    coursesByUniversity.forEach((group) => {
      courseCounts.total += group._count.id;
      const universityCode = universityCodeMap.get(group.universityId) || group.universityId;
      courseCounts.byUniversity[universityCode] = group._count.id;
    });

    // Get total active student profiles
    const activeStudents = await prisma.student.count();

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Get review counts
    const courseReviewsCount = await prisma.courseReview.count();
    const professorReviewsCount = await prisma.professorReview.count();

    return NextResponse.json({
      users: userCounts,
      courses: courseCounts,
      students: activeStudents,
      recentRegistrations: recentUsers,
      reviews: {
        courseReviews: courseReviewsCount,
        professorReviews: professorReviewsCount,
        total: courseReviewsCount + professorReviewsCount,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
