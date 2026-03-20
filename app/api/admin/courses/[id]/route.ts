import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logger";
import { hasPermission } from "@/lib/access-control";
import { UserRole } from "@prisma/client";

const updateCourseSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  units: z.number().int().min(0).max(20).optional(),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure user is admin
    const { user: currentUser } = await requireAdmin();

    // Check permission to edit courses
    if (!hasPermission(currentUser.role as UserRole, "course", "edit")) {
      return NextResponse.json(
        { error: "You do not have permission to edit courses" },
        { status: 403 }
      );
    }

    const { id: courseId } = await params;
    const body = await request.json();
    const validation = updateCourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        university: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // If changing department, verify it belongs to the same university (if not empty)
    if (validation.data.departmentId !== undefined && validation.data.departmentId !== "") {
      const department = await prisma.department.findUnique({
        where: { id: validation.data.departmentId },
        select: { universityId: true },
      });

      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 }
        );
      }

      if (department.universityId !== existingCourse.universityId) {
        return NextResponse.json(
          { error: "Department does not belong to the course's university" },
          { status: 400 }
        );
      }
    }

    // If changing code, check for duplicates
    if (validation.data.code && validation.data.code !== existingCourse.code) {
      const duplicate = await prisma.course.findFirst({
        where: {
          code: validation.data.code,
          universityId: existingCourse.universityId,
          NOT: { id: courseId },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Course code already exists for this university" },
          { status: 409 }
        );
      }
    }

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...validation.data,
        departmentId: validation.data.departmentId !== undefined
          ? (validation.data.departmentId === "" ? null : validation.data.departmentId)
          : undefined,
      },
      include: {
        university: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    // Log audit trail
    await createAuditLog({
      action: "UPDATE",
      entityType: "COURSE",
      entityId: courseId,
      userId: currentUser.id,
      changes: { before: existingCourse, after: updatedCourse },
      metadata: getRequestMetadata(request),
    });

    return NextResponse.json({ course: updatedCourse });
  } catch (error) {
    console.error("Error updating course:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure user is admin
    const { user: currentUser } = await requireAdmin();

    // Check permission to delete courses
    if (!hasPermission(currentUser.role as UserRole, "course", "delete")) {
      return NextResponse.json(
        { error: "You do not have permission to delete courses" },
        { status: 403 }
      );
    }

    const { id: courseId } = await params;

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        code: true,
        _count: {
          select: {
            prerequisiteFor: true,
            completedCourses: true,
            courseReviews: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Soft delete by setting isActive to false instead of hard delete
    // This preserves data integrity for students who have completed the course
    await prisma.course.update({
      where: { id: courseId },
      data: { isActive: false },
    });

    // Log audit trail
    await createAuditLog({
      action: "DELETE",
      entityType: "COURSE",
      entityId: courseId,
      userId: currentUser.id,
      changes: { before: course },
      metadata: getRequestMetadata(request),
    });

    return NextResponse.json({
      message: "Course deactivated successfully",
      courseCode: course.code,
    });
  } catch (error) {
    console.error("Error deleting course:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
