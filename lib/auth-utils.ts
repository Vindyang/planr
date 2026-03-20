import { cache } from "react";
import { UserRole } from "@prisma/client";
import { getSession } from "./auth";
import { prisma } from "./prisma";

/**
 * Requires user to have one of the specified roles
 * @param allowedRoles Array of roles that are allowed to access
 * @returns Object containing session and user role
 * @throws Error if unauthorized or forbidden
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      role: true, 
      id: true, 
      email: true, 
      name: true,
      assignedUniversityId: true,
      assignedDepartmentId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }

  return { session, role: user.role, user };
}

/**
 * Requires user to be an admin, super admin, or coordinator
 * @returns Object containing session, role, and user data
 * @throws Error if unauthorized or not admin
 */
export async function requireAdmin() {
  return requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COORDINATOR]);
}

/**
 * Requires user to be a super admin (highest privilege level)
 * @returns Object containing session, role, and user data
 * @throws Error if unauthorized or not super admin
 */
export async function requireSuperAdmin() {
  return requireRole([UserRole.SUPER_ADMIN]);
}

/**
 * Requires user to be an admin or coordinator
 * @returns Object containing session, role, and user data
 * @throws Error if unauthorized or not admin/coordinator
 */
export async function requireAdminOrCoordinator() {
  return requireRole([UserRole.ADMIN, UserRole.COORDINATOR]);
}

/**
 * Gets the role of a user by their ID (cached)
 * @param userId The user ID to look up
 * @returns The user's role or null if not found
 */
export const getUserRole = cache(async (userId: string): Promise<UserRole | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role ?? null;
});

/**
 * Gets the full user data with role (cached)
 * @param userId The user ID to look up
 * @returns User object with role or null if not found
 */
export const getUserWithRole = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      createdAt: true,
    },
  });
});

/**
 * Checks if a user has a specific role
 * @param userId The user ID to check
 * @param role The role to check for
 * @returns True if user has the role, false otherwise
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const userRole = await getUserRole(userId);
  return userRole === role;
}

/**
 * Checks if a user is an admin
 * @param userId The user ID to check
 * @returns True if user is admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, UserRole.ADMIN);
}

/**
 * Requires user to have access to a specific university
 * @param university The university to check access for
 * @returns Object containing session, role, and user data
 * @throws Error if unauthorized or forbidden
 */
export async function requireUniversityAccess(university: string) {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      id: true,
      email: true,
      name: true,
      assignedUniversityId: true,
      assignedDepartmentId: true,
      assignedUniversity: {
        select: {
          code: true,
          id: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // SUPER_ADMIN has access to all universities
  if (user.role === UserRole.SUPER_ADMIN) {
    return { session, role: user.role, user };
  }

  // ADMIN and COORDINATOR must have matching assignedUniversity
  if (
    user.role === UserRole.ADMIN ||
    user.role === UserRole.COORDINATOR
  ) {
    if (user.assignedUniversity?.code !== university) {
      throw new Error("Forbidden - No access to this university");
    }
    return { session, role: user.role, user };
  }

  // Students and others cannot access admin routes
  throw new Error("Forbidden");
}

/**
 * Requires user to have access to a specific department within a university
 * @param university The university to check access for
 * @param department The department to check access for
 * @returns Object containing session, role, and user data
 * @throws Error if unauthorized or forbidden
 */
export async function requireDepartmentAccess(university: string, department: string) {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      id: true,
      email: true,
      name: true,
      assignedUniversityId: true,
      assignedDepartmentId: true,
      assignedUniversity: {
        select: {
          code: true,
          id: true,
        },
      },
      assignedDepartment: {
        select: {
          code: true,
          name: true,
          id: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // SUPER_ADMIN has access to all departments
  if (user.role === UserRole.SUPER_ADMIN) {
    return { session, role: user.role, user };
  }

  // ADMIN must have matching university (can access all departments in their university)
  if (user.role === UserRole.ADMIN) {
    if (user.assignedUniversity?.code !== university) {
      throw new Error("Forbidden - No access to this university");
    }
    return { session, role: user.role, user };
  }

  // COORDINATOR must have matching university AND department
  if (user.role === UserRole.COORDINATOR) {
    if (user.assignedUniversity?.code !== university) {
      throw new Error("Forbidden - No access to this university");
    }
    if (user.assignedDepartment?.name !== department) {
      throw new Error("Forbidden - No access to this department");
    }
    return { session, role: user.role, user };
  }

  // Students and others cannot access admin routes
  throw new Error("Forbidden");
}

/**
 * Gets the user with their university and department assignments
 * @param userId The user ID to look up
 * @returns User object with assignments or null if not found
 */
export const getUserWithAssignments = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      assignedUniversityId: true,
      assignedDepartmentId: true,
      assignedUniversity: {
        select: {
          code: true,
          name: true,
          id: true,
        },
      },
      assignedDepartment: {
        select: {
          code: true,
          name: true,
          id: true,
        },
      },
      createdAt: true,
    },
  });
});
