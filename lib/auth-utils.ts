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
    select: { role: true, id: true, email: true, name: true },
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
