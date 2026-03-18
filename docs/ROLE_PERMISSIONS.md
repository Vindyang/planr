# Role-Based Access Control (RBAC) Implementation

This document describes the permission-based access control system implemented using Better Auth's approach.

## Overview

The system uses Better Auth's `createAccessControl()` to define a permission-based RBAC system where:
- **Resources** represent entities (user, course, etc.)
- **Actions** represent what can be done on those entities
- **Roles** are assigned specific permissions for resources

## Role Hierarchy and Permissions

### SUPER_ADMIN
**Full system access** - Can manage all users including other SUPER_ADMINs and ADMINs

Permissions:
- ✅ User management: `create`, `view`, `edit`, `delete`, `assign_role`
- ✅ Admin management: `create`, `edit`, `delete`
- ✅ Super Admin management: `create`, `edit`, `delete`
- ✅ Course management: `create`, `view`, `edit`, `delete`
- ✅ University management: `create`, `view`, `edit`, `delete`
- ✅ Department management: `create`, `view`, `edit`, `delete`
- ✅ Audit logs: `view`

### ADMIN
**Administrative access** - Can manage COORDINATORs and STUDENTs (but NOT other ADMINs or SUPER_ADMINs)

Permissions:
- ✅ User management: `create`, `view`, `edit`, `delete`, `assign_role` (COORDINATOR and STUDENT only)
- ❌ Cannot manage ADMIN or SUPER_ADMIN users
- ✅ Course management: `create`, `view`, `edit`, `delete`
- ✅ University management: `create`, `view`, `edit`, `delete`
- ✅ Department management: `create`, `view`, `edit`, `delete`
- ✅ Audit logs: `view`

### COORDINATOR
**Department-level access** - Can manage STUDENTs only

Permissions:
- ✅ User management: `create`, `view`, `edit` (STUDENT only)
- ❌ Cannot manage COORDINATOR, ADMIN, or SUPER_ADMIN users
- ✅ Course viewing and editing: `view`, `edit`
- ✅ Department viewing: `view`
- ✅ University viewing: `view`

### STUDENT
**Basic access** - Can only view their own profile and courses

Permissions:
- ✅ User viewing: `view` (own profile only)
- ✅ Course viewing: `view`
- ❌ No management capabilities

## Key Rules

### User Management Hierarchy

```typescript
// Who can manage whom:
SUPER_ADMIN → Can manage: SUPER_ADMIN, ADMIN, COORDINATOR, STUDENT
ADMIN       → Can manage: COORDINATOR, STUDENT
COORDINATOR → Can manage: STUDENT
STUDENT     → Can manage: (none)
```

### Role Assignment Rules

```typescript
// Who can assign which roles:
SUPER_ADMIN → Can assign: SUPER_ADMIN, ADMIN, COORDINATOR, STUDENT
ADMIN       → Can assign: COORDINATOR, STUDENT
COORDINATOR → Can assign: STUDENT
STUDENT     → Can assign: (none)
```

### Important Constraints

1. **Self-modification prevention**: Users cannot modify their own role
2. **Hierarchy protection**: ADMIN cannot modify other ADMIN users
3. **Super Admin protection**: Only SUPER_ADMIN can manage other SUPER_ADMINs
4. **Role assignment limitation**: You can only assign roles lower than your own

## Implementation Details

### Access Control Module

Located at: `lib/access-control.ts`

Key functions:

```typescript
// Check if user has permission for an action on a resource
hasPermission(userRole: UserRole, resource: Resource, action: Action): boolean

// Check if actor can manage target user based on roles
canManageUserByRole(actorRole: UserRole, targetRole: UserRole): boolean

// Check if actor can assign a specific role
canAssignRole(actorRole: UserRole, roleToAssign: UserRole): boolean

// Get all roles that an actor can manage
getManageableRoles(actorRole: UserRole): UserRole[]

// Get all roles that an actor can assign
getAssignableRoles(actorRole: UserRole): UserRole[]

// Check if user can delete another user
canDeleteUser(actorRole: UserRole, targetRole: UserRole): boolean

// Check specific resource permissions
canViewAuditLogs(actorRole: UserRole): boolean
canManageCourses(actorRole: UserRole): boolean
canManageUniversities(actorRole: UserRole): boolean
canManageDepartments(actorRole: UserRole): boolean
```

### Usage in API Routes

#### User Creation Route (`/api/admin/users/create`)

```typescript
import { canAssignRole, getAssignableRoles } from "@/lib/access-control";

// Check if current user can assign the requested role
if (!canAssignRole(currentUser.role, role)) {
  const assignableRoles = getAssignableRoles(currentUser.role);
  return NextResponse.json({
    error: `${currentUser.role} cannot create users with ${role} role`,
    details: `You can only create users with these roles: ${assignableRoles.join(", ")}`
  }, { status: 403 });
}
```

#### User Update Route (`/api/admin/users/[id]`)

```typescript
import { canManageUserByRole, canAssignRole } from "@/lib/access-control";

// Check if current user can manage target user
if (!canManageUserByRole(currentUser.role, targetUser.role)) {
  return NextResponse.json({
    error: `${currentUser.role} cannot manage ${targetUser.role} users`
  }, { status: 403 });
}

// If changing role, check if current user can assign new role
if (newRole && !canAssignRole(currentUser.role, newRole)) {
  return NextResponse.json({
    error: `${currentUser.role} cannot assign ${newRole} role`
  }, { status: 403 });
}
```

## Permission Matrix

| Action | SUPER_ADMIN | ADMIN | COORDINATOR | STUDENT |
|--------|-------------|-------|-------------|---------|
| Create SUPER_ADMIN | ✅ | ❌ | ❌ | ❌ |
| Create ADMIN | ✅ | ❌ | ❌ | ❌ |
| Create COORDINATOR | ✅ | ✅ | ❌ | ❌ |
| Create STUDENT | ✅ | ✅ | ✅ | ❌ |
| Edit SUPER_ADMIN | ✅ | ❌ | ❌ | ❌ |
| Edit ADMIN | ✅ | ❌ | ❌ | ❌ |
| Edit COORDINATOR | ✅ | ✅ | ❌ | ❌ |
| Edit STUDENT | ✅ | ✅ | ✅ | ❌ |
| Delete users | ✅ | ✅ (not ADMIN/SUPER_ADMIN) | ❌ | ❌ |
| Manage courses | ✅ | ✅ | ✅ (edit only) | ❌ |
| Manage universities | ✅ | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ |

## Examples

### Example 1: ADMIN tries to create another ADMIN

```typescript
const actorRole = "ADMIN";
const roleToCreate = "ADMIN";

if (!canAssignRole(actorRole, roleToCreate)) {
  // This returns false - ADMIN cannot create ADMIN
  throw new Error("Permission denied");
}
```

### Example 2: SUPER_ADMIN creates an ADMIN

```typescript
const actorRole = "SUPER_ADMIN";
const roleToCreate = "ADMIN";

if (canAssignRole(actorRole, roleToCreate)) {
  // This returns true - SUPER_ADMIN can create ADMIN
  await createUser({ role: roleToCreate });
}
```

### Example 3: ADMIN tries to edit SUPER_ADMIN

```typescript
const actorRole = "ADMIN";
const targetRole = "SUPER_ADMIN";

if (!canManageUserByRole(actorRole, targetRole)) {
  // This returns false - ADMIN cannot manage SUPER_ADMIN
  throw new Error("Permission denied");
}
```

### Example 4: Get assignable roles for ADMIN

```typescript
const assignableRoles = getAssignableRoles("ADMIN");
// Returns: ["COORDINATOR", "STUDENT"]
```

## Testing the Permission System

Run these checks to verify the system:

```typescript
// SUPER_ADMIN can manage anyone
console.assert(canManageUserByRole("SUPER_ADMIN", "ADMIN") === true);
console.assert(canManageUserByRole("SUPER_ADMIN", "SUPER_ADMIN") === true);

// ADMIN cannot manage ADMIN or SUPER_ADMIN
console.assert(canManageUserByRole("ADMIN", "ADMIN") === false);
console.assert(canManageUserByRole("ADMIN", "SUPER_ADMIN") === false);

// ADMIN can manage COORDINATOR and STUDENT
console.assert(canManageUserByRole("ADMIN", "COORDINATOR") === true);
console.assert(canManageUserByRole("ADMIN", "STUDENT") === true);

// COORDINATOR can only manage STUDENT
console.assert(canManageUserByRole("COORDINATOR", "STUDENT") === true);
console.assert(canManageUserByRole("COORDINATOR", "COORDINATOR") === false);
```

## Future Enhancements

Potential additions to the permission system:

1. **Resource-level permissions**: Add department/university scoping (e.g., "ADMIN can only manage users in their assigned university")
2. **Custom permissions**: Allow creating custom permission sets beyond the predefined roles
3. **Permission delegation**: Allow temporary permission grants
4. **Role inheritance**: Create sub-roles that inherit parent permissions
5. **Audit trail for permission changes**: Track when users' permissions are modified

## References

- Better Auth Access Control: https://better-auth.com/docs/plugins/access
- Implementation: `/lib/access-control.ts`
- API Routes: `/app/api/admin/users/`
