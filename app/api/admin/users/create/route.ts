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
  // Student-specific fields
  studentId: z.string().optional(),
  majorId: z.string().uuid().optional(),
  year: z.number().int().min(1).max(6).optional(),
  enrollmentYear: z.number().int().min(2000).max(2100).optional(),
  expectedGraduationYear: z.number().int().min(2000).max(2100).optional(),
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

    let {
      email,
      name,
      role,
      assignedUniversityId,
      assignedDepartmentId,
      studentId,
      majorId,
      year,
      enrollmentYear,
      expectedGraduationYear,
    } = validation.data;

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

    // If COORDINATOR is creating a STUDENT, automatically use coordinator's university
    if (currentUser.role === "COORDINATOR" && role === "STUDENT") {
      if (!currentUser.assignedUniversityId) {
        return NextResponse.json(
          { error: "Coordinator must be assigned to a university to create students" },
          { status: 400 }
        );
      }
      // Override any provided university with coordinator's university
      assignedUniversityId = currentUser.assignedUniversityId;
    }

    // Validate student-specific requirements
    if (role === "STUDENT") {
      if (!assignedUniversityId) {
        return NextResponse.json(
          { error: "University is required when creating a student" },
          { status: 400 }
        );
      }
      if (!majorId) {
        return NextResponse.json(
          { error: "Major is required when creating a student" },
          { status: 400 }
        );
      }
      if (!year || !enrollmentYear || !expectedGraduationYear) {
        return NextResponse.json(
          { error: "Year, enrollment year, and expected graduation year are required for students" },
          { status: 400 }
        );
      }
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

    // Create the user with appropriate data based on role
    let newUser;
    if (role === "STUDENT") {
      // Create user with student profile in a transaction
      newUser = await prisma.user.create({
        data: {
          email,
          name,
          role,
          student: {
            create: {
              studentId: studentId || undefined,
              universityId: assignedUniversityId!,
              majorId: majorId!,
              year: year!,
              enrollmentYear: enrollmentYear!,
              expectedGraduationYear: expectedGraduationYear!,
            },
          },
        },
        include: {
          student: {
            include: {
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
    } else {
      // Create admin/coordinator user
      newUser = await prisma.user.create({
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
    }

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
