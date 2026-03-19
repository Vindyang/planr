import { createAccessControl } from "better-auth/plugins/access";
import { UserRole } from "@prisma/client";

/**
 * Define resources and their possible actions
 * Resources represent entities (user, course, etc.)
 * Actions represent what can be done on those entities
 */
export const statement = {
  // User management actions
  user: ["create", "view", "edit", "delete", "assign_role"],

  // Admin-specific user management (for managing admin roles)
  admin: ["create", "edit", "delete"],

  // Super admin-specific actions
  super_admin: ["create", "edit", "delete"],

  // Course management
  course: ["create", "view", "edit", "delete"],

  // University and department management
  university: ["create", "view", "edit", "delete"],
  department: ["create", "view", "edit", "delete"],

  // Audit logs
  audit_log: ["view"],
} as const;

/**
 * Create the access control instance
 */
export const ac = createAccessControl(statement);

/**
 * Define role permissions using Better Auth's access control
 */

// STUDENT role - minimal permissions
export const studentPermissions = ac.newRole({
  user: ["view"], // Can only view their own profile
  course: ["view"], // Can view courses
});

// COORDINATOR role - can manage students
export const coordinatorPermissions = ac.newRole({
  user: ["create", "view", "edit"], // Can manage regular users (students)
  course: ["view", "edit"], // Can manage courses
  department: ["view"], // Can view department info
  university: ["view"], // Can view university info
});

// ADMIN role - can manage coordinators and students
export const adminPermissions = ac.newRole({
  user: ["create", "view", "edit", "delete", "assign_role"], // Can manage non-admin users
  course: ["create", "view", "edit", "delete"], // Full course management
  university: ["create", "view", "edit", "delete"], // Can manage universities
  department: ["create", "view", "edit", "delete"], // Can manage departments
  audit_log: ["view"], // Can view audit logs
  // Note: ADMIN cannot manage other ADMINs or SUPER_ADMINs
});

// SUPER_ADMIN role - full permissions
export const superAdminPermissions = ac.newRole({
  user: ["create", "view", "edit", "delete", "assign_role"], // Can manage all users
  admin: ["create", "edit", "delete"], // Can manage admin users
  super_admin: ["create", "edit", "delete"], // Can manage super admin users
  course: ["create", "view", "edit", "delete"], // Full course management
  university: ["create", "view", "edit", "delete"], // Full university management
  department: ["create", "view", "edit", "delete"], // Full department management
  audit_log: ["view"], // Can view audit logs
});

/**
 * Map UserRole to permission sets
 */
const rolePermissionsMap = {
  STUDENT: studentPermissions,
  COORDINATOR: coordinatorPermissions,
  ADMIN: adminPermissions,
  SUPER_ADMIN: superAdminPermissions,
} as const;

/**
 * Type for resources and actions
 */
type Resource = keyof typeof statement;
type ActionForResource<R extends Resource> = (typeof statement)[R][number];

/**
 * Internal permission definitions for each role
 * This mirrors what we defined with Better Auth's access control
 */
const rolePermissions: Record<UserRole, Record<string, string[]>> = {
  STUDENT: {
    user: ["view"],
    course: ["view"],
  },
  COORDINATOR: {
    user: ["create", "view", "edit"],
    course: ["view", "edit"],
    department: ["view"],
    university: ["view"],
  },
  ADMIN: {
    user: ["create", "view", "edit", "delete", "assign_role"],
    course: ["create", "view", "edit", "delete"],
    university: ["create", "view", "edit", "delete"],
    department: ["create", "view", "edit", "delete"],
    audit_log: ["view"],
  },
  SUPER_ADMIN: {
    user: ["create", "view", "edit", "delete", "assign_role"],
    admin: ["create", "edit", "delete"],
    super_admin: ["create", "edit", "delete"],
    course: ["create", "view", "edit", "delete"],
    university: ["create", "view", "edit", "delete"],
    department: ["create", "view", "edit", "delete"],
    audit_log: ["view"],
  },
};

/**
 * Check if a user role has permission to perform an action on a resource
 */
export function hasPermission<R extends Resource>(
  userRole: UserRole,
  resource: R,
  action: ActionForResource<R>
): boolean {
  const permissions = rolePermissions[userRole];
  const resourceActions = permissions[resource];

  if (!resourceActions) {
    return false;
  }

  return resourceActions.includes(action);
}

/**
 * Check if a user can manage (create/edit/delete) another user based on target role
 *
 * Rules:
 * - SUPER_ADMIN can manage ADMIN, COORDINATOR, and STUDENT (but NOT other SUPER_ADMINs)
 * - ADMIN can manage COORDINATOR and STUDENT (but NOT other ADMINs or SUPER_ADMINs)
 * - COORDINATOR can manage STUDENT only
 * - STUDENT cannot manage anyone
 */
export function canManageUserByRole(
  actorRole: UserRole,
  targetRole: UserRole
): boolean {
  // SUPER_ADMIN can manage ADMIN, COORDINATOR, and STUDENT (but not other SUPER_ADMINs)
  if (actorRole === "SUPER_ADMIN") {
    // SUPER_ADMIN cannot edit other SUPER_ADMINs
    if (targetRole === "SUPER_ADMIN") {
      return false;
    }
    // Check if SUPER_ADMIN has permission to manage ADMINs
    if (targetRole === "ADMIN") {
      return hasPermission(actorRole, "admin", "edit");
    }
    return hasPermission(actorRole, "user", "edit");
  }

  // ADMIN can manage COORDINATOR and STUDENT (but not ADMIN or SUPER_ADMIN)
  if (actorRole === "ADMIN") {
    if (targetRole === "SUPER_ADMIN" || targetRole === "ADMIN") {
      return false; // ADMIN cannot manage ADMIN or SUPER_ADMIN
    }
    return hasPermission(actorRole, "user", "edit");
  }

  // COORDINATOR can manage STUDENT only
  if (actorRole === "COORDINATOR") {
    if (targetRole !== "STUDENT") {
      return false;
    }
    return hasPermission(actorRole, "user", "edit");
  }

  // STUDENT cannot manage anyone
  return false;
}

/**
 * Check if a user can assign a specific role to another user
 *
 * Rules:
 * - SUPER_ADMIN can assign ADMIN, COORDINATOR, and STUDENT (but NOT SUPER_ADMIN)
 * - ADMIN can assign COORDINATOR and STUDENT (but NOT ADMIN or SUPER_ADMIN)
 * - COORDINATOR can assign STUDENT only
 * - STUDENT cannot assign any role
 */
export function canAssignRole(
  actorRole: UserRole,
  roleToAssign: UserRole
): boolean {
  // No one can assign SUPER_ADMIN role (not even other SUPER_ADMINs)
  if (roleToAssign === "SUPER_ADMIN") {
    return false;
  }

  // SUPER_ADMIN can assign ADMIN, COORDINATOR, and STUDENT
  if (actorRole === "SUPER_ADMIN") {
    if (roleToAssign === "ADMIN") {
      return hasPermission(actorRole, "admin", "create");
    }
    return hasPermission(actorRole, "user", "create");
  }

  // ADMIN can assign COORDINATOR and STUDENT (but not ADMIN)
  if (actorRole === "ADMIN") {
    if (roleToAssign === "ADMIN") {
      return false;
    }
    return hasPermission(actorRole, "user", "create");
  }

  // COORDINATOR can assign STUDENT only
  if (actorRole === "COORDINATOR") {
    if (roleToAssign !== "STUDENT") {
      return false;
    }
    return hasPermission(actorRole, "user", "create");
  }

  // STUDENT cannot assign any role
  return false;
}

/**
 * Get all roles that an actor can manage
 */
export function getManageableRoles(actorRole: UserRole): UserRole[] {
  const allRoles: UserRole[] = ["SUPER_ADMIN", "ADMIN", "COORDINATOR", "STUDENT"];
  return allRoles.filter(role => canManageUserByRole(actorRole, role));
}

/**
 * Get all roles that an actor can assign to others
 */
export function getAssignableRoles(actorRole: UserRole): UserRole[] {
  const allRoles: UserRole[] = ["SUPER_ADMIN", "ADMIN", "COORDINATOR", "STUDENT"];
  return allRoles.filter(role => canAssignRole(actorRole, role));
}

/**
 * Check if a user can create users with a specific role
 */
export function canCreateUserWithRole(actorRole: UserRole, targetRole: UserRole): boolean {
  return canAssignRole(actorRole, targetRole);
}

/**
 * Check if a user can delete another user based on target role
 */
export function canDeleteUser(actorRole: UserRole, targetRole: UserRole): boolean {
  // Same rules as canManageUserByRole, but also check delete permission
  if (!canManageUserByRole(actorRole, targetRole)) {
    return false;
  }

  // Check if actor has delete permission
  if (actorRole === "SUPER_ADMIN" && targetRole === "ADMIN") {
    return hasPermission(actorRole, "admin", "delete");
  }

  return hasPermission(actorRole, "user", "delete");
}

/**
 * Check if a user can view audit logs
 */
export function canViewAuditLogs(actorRole: UserRole): boolean {
  return hasPermission(actorRole, "audit_log", "view");
}

/**
 * Check if a user can manage courses
 */
export function canManageCourses(actorRole: UserRole): boolean {
  return hasPermission(actorRole, "course", "edit");
}

/**
 * Check if a user can manage universities/departments
 */
export function canManageUniversities(actorRole: UserRole): boolean {
  return hasPermission(actorRole, "university", "edit");
}

export function canManageDepartments(actorRole: UserRole): boolean {
  return hasPermission(actorRole, "department", "edit");
}
