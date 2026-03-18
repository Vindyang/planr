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
} from "@/lib/access-control";

const updateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  assignedUniversityId: z.string().uuid().nullable().optional(),
  assignedDepartmentId: z.string().uuid().nullable().optional(),
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
      },
    });

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
