import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logger";
import {
  canManageUserByRole,
  canAssignRole,
  getManageableRoles,
  canDeleteUser,
} from "@/lib/access-control";

const updateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  assignedUniversityId: z.string().uuid().nullable().optional(),
  assignedDepartmentId: z.string().uuid().nullable().optional(),
  // Student-specific fields
  studentId: z.string().nullable().optional(),
  majorId: z.string().uuid().optional(),
  secondMajorId: z.string().uuid().nullable().optional(),
  minorId: z.string().uuid().nullable().optional(),
  year: z.number().int().min(1).max(6).optional(),
  enrollmentYear: z.number().int().min(2000).max(2100).optional(),
  expectedGraduationYear: z.number().int().min(2000).max(2100).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure user is admin
    const { user: currentUser } = await requireAdmin();

    const { id: userId } = await params;
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
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
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent users from modifying their own role
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot modify your own role" },
        { status: 403 }
      );
    }

    // Check if current user has permission to manage the target user
    if (!canManageUserByRole(currentUser.role as UserRole, targetUser.role as UserRole)) {
      const manageableRoles = getManageableRoles(currentUser.role as UserRole);
      return NextResponse.json(
        {
          error: `${currentUser.role} cannot manage ${targetUser.role} users`,
          details: `You can only manage users with these roles: ${manageableRoles.join(", ")}`,
        },
        { status: 403 }
      );
    }

    // If changing role, check if current user has permission to assign the new role
    if (validation.data.role && !canAssignRole(currentUser.role as UserRole, validation.data.role)) {
      return NextResponse.json(
        {
          error: `${currentUser.role} cannot assign ${validation.data.role} role`,
          details: "You can only assign roles that you have permission to manage",
        },
        { status: 403 }
      );
    }

    // Check if we need to update student-specific fields
    const hasStudentUpdates =
      validation.data.studentId !== undefined ||
      validation.data.majorId !== undefined ||
      validation.data.secondMajorId !== undefined ||
      validation.data.minorId !== undefined ||
      validation.data.year !== undefined ||
      validation.data.enrollmentYear !== undefined ||
      validation.data.expectedGraduationYear !== undefined;

    // If updating student fields, check if user is a student
    if (hasStudentUpdates && targetUser.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Cannot update student fields for non-student users" },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(validation.data.role && { role: validation.data.role }),
        ...(validation.data.assignedUniversityId !== undefined && {
          assignedUniversityId: validation.data.assignedUniversityId,
        }),
        ...(validation.data.assignedDepartmentId !== undefined && {
          assignedDepartmentId: validation.data.assignedDepartmentId,
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
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
    });

    // Update student-specific fields if provided
    if (hasStudentUpdates && updatedUser.student) {
      await prisma.student.update({
        where: { userId: userId },
        data: {
          ...(validation.data.studentId !== undefined && { studentId: validation.data.studentId }),
          ...(validation.data.majorId && { majorId: validation.data.majorId }),
          ...(validation.data.secondMajorId !== undefined && { secondMajorId: validation.data.secondMajorId }),
          ...(validation.data.minorId !== undefined && { minorId: validation.data.minorId }),
          ...(validation.data.year && { year: validation.data.year }),
          ...(validation.data.enrollmentYear && { enrollmentYear: validation.data.enrollmentYear }),
          ...(validation.data.expectedGraduationYear && { expectedGraduationYear: validation.data.expectedGraduationYear }),
        },
      });
    }

    // Log audit trail
    await createAuditLog({
      action: "UPDATE",
      entityType: "USER",
      entityId: userId,
      userId: currentUser.id,
      changes: { before: targetUser, after: updatedUser },
      metadata: getRequestMetadata(request),
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: currentUser } = await requireAdmin();
    const { id: userId } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 403 });
    }

    if (!canDeleteUser(currentUser.role as UserRole, targetUser.role as UserRole)) {
      return NextResponse.json(
        { error: `${currentUser.role} cannot delete ${targetUser.role} users` },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id: userId } });

    await createAuditLog({
      action: "DELETE",
      entityType: "USER",
      entityId: userId,
      userId: currentUser.id,
      changes: { before: targetUser },
      metadata: getRequestMetadata(request),
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
