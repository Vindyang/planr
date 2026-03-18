import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logger";
import { canAssignRole, getAssignableRoles } from "@/lib/access-control";

const createAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "COORDINATOR", "STUDENT"]),
  assignedUniversityId: z.string().uuid().optional(),
  assignedDepartmentId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Ensure user is admin or super admin
    const { user: currentUser } = await requireAdmin();

    const body = await request.json();
    const validation = createAdminSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, name, role, assignedUniversityId, assignedDepartmentId } = validation.data;

    // Check if current user has permission to assign this role
    if (!canAssignRole(currentUser.role as UserRole, role as UserRole)) {
      const assignableRoles = getAssignableRoles(currentUser.role as UserRole);
      return NextResponse.json(
        {
          error: `${currentUser.role} cannot create users with ${role} role`,
          details: `You can only create users with these roles: ${assignableRoles.join(", ")}`,
        },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Validate university and department relationship
    if (assignedDepartmentId && !assignedUniversityId) {
      return NextResponse.json(
        { error: "University is required when assigning a department" },
        { status: 400 }
      );
    }

    if (assignedDepartmentId && assignedUniversityId) {
      const department = await prisma.department.findUnique({
        where: { id: assignedDepartmentId },
        select: { universityId: true },
      });

      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 }
        );
      }

      if (department.universityId !== assignedUniversityId) {
        return NextResponse.json(
          { error: "Department does not belong to the specified university" },
          { status: 400 }
        );
      }
    }

    // Create the admin/coordinator user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        assignedUniversityId: assignedUniversityId || null,
        assignedDepartmentId: assignedDepartmentId || null,
      },
      include: {
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
      action: "CREATE",
      entityType: "USER",
      entityId: newUser.id,
      userId: currentUser.id,
      changes: { after: newUser },
      metadata: {
        ...getRequestMetadata(request),
        createdRole: role,
        assignedToUniversity: assignedUniversityId,
        assignedToDepartment: assignedDepartmentId,
      },
    });

    // TODO: Send email invitation to the new admin/coordinator
    // This would typically use a service like SendGrid, AWS SES, etc.
    // For now, we'll just return success

    return NextResponse.json(
      {
        user: newUser,
        message: "Admin account created successfully. Invitation email will be sent.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create admin account" },
      { status: 500 }
    );
  }
}
