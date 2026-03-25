# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Planr is a multi-tenant course planning application for university students. Students can plan their semesters, track completed courses, check course eligibility based on prerequisites, and read/write reviews.

**Tech Stack**: Next.js 16 (App Router), React 19, Prisma ORM, PostgreSQL, Better Auth, Tailwind CSS v4, TypeScript

## Common Commands

### Development
```bash
# Start development server (default port 3000)
npm run dev
# or
bun dev
```

### Building
```bash
# Build for production (includes prisma generate)
npm run build
```

### Linting
```bash
npm run lint
```

### Database Operations
```bash
# Generate Prisma client (run after schema changes)
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name <migration_name>

# Apply migrations in production
npx prisma migrate deploy

# Seed database with initial data
bun run prisma/seed-new.ts

# Open Prisma Studio to view/edit data
npx prisma studio
```

## Architecture Overview

### Multi-Tenant Design
The application supports multiple universities and departments with isolated data:
- **University** → Department → Course hierarchy
- Students belong to a university and major (department)
- Each university has its own course catalog and prerequisites
- Admins/coordinators are scoped to specific universities/departments

### Authentication & Authorization
- **Better Auth** handles authentication with email/password
- **Role-based access control** (RBAC) with 4 roles:
  - `STUDENT`: Can view courses, create plans, write reviews
  - `COORDINATOR`: Can manage students and courses for assigned department
  - `ADMIN`: Can manage users, courses, and departments for assigned university
  - `SUPER_ADMIN`: Full system access, can manage other admins
- Access control logic in [lib/access-control.ts](lib/access-control.ts)
- Session management via `getSession()` and `requireSession()` in [lib/auth.ts](lib/auth.ts)

### Core Modules

#### 1. Course Eligibility System ([lib/eligibility/](lib/eligibility/))
Determines if a student can take a course based on:
- **Prerequisites**: Hard (must complete), soft (recommended), corequisite (must take together)
- **Completed courses**: Tracks student's academic history
- **Prerequisite graph**: Builds dependency chains for complex requirements
- Grade validation and passing thresholds

Key files:
- [lib/eligibility/checker.ts](lib/eligibility/checker.ts): Core eligibility logic
- [lib/eligibility/prerequisite-graph.ts](lib/eligibility/prerequisite-graph.ts): Dependency resolution
- [lib/eligibility/service.ts](lib/eligibility/service.ts): High-level API

#### 2. Semester Planner ([lib/planner/](lib/planner/))
Students create semester plans and add courses with validation:
- **Server actions** in [lib/planner/actions.ts](lib/planner/actions.ts) handle CRUD operations
- **Validation system** checks:
  - Prerequisites met before planned semester
  - No duplicate courses across semesters
  - Corequisites in same semester
  - Course offered in target term
  - Unit overload limits

Key files:
- [lib/planner/actions.ts](lib/planner/actions.ts): Server actions for plan management
- [lib/planner/validation/](lib/planner/validation/): Validators for different constraints
- [lib/planner/types.ts](lib/planner/types.ts): Type definitions

#### 3. Access Control System ([lib/access-control.ts](lib/access-control.ts))
Hierarchical permission model:
- Resource-action pairs (e.g., `user:edit`, `course:create`)
- Role hierarchy enforcement (ADMIN cannot manage other ADMINs)
- Helper functions: `hasPermission()`, `canManageUserByRole()`, `canAssignRole()`

### Directory Structure

```
app/
├── (auth)/           # Login/signup pages (route group)
├── (student)/        # Student-facing pages (dashboard, planner, courses, reviews)
├── admin/            # Admin dashboard and management
└── api/              # API routes
    ├── admin/        # Admin endpoints
    ├── planner/      # Planner CRUD and validation
    ├── student/      # Student profile and courses
    └── reviews/      # Course/professor reviews

lib/
├── access-control.ts # RBAC permission logic
├── auth.ts           # Better Auth config and session helpers
├── auth-utils.ts     # Role checking utilities
├── eligibility/      # Course eligibility checking
├── planner/          # Semester planning logic and validation
└── types.ts          # Shared TypeScript types

components/
├── admin/            # Admin-specific components
├── layout/           # Navigation, sidebars
├── reviews/          # Review display/forms
└── ui/               # Reusable UI components (shadcn)

prisma/
├── schema.prisma     # Database schema (comprehensive multi-tenant model)
├── seed.ts           # Database seeder
└── migrations/       # Migration history
```

### Database Schema Highlights

The Prisma schema ([prisma/schema.prisma](prisma/schema.prisma)) includes:
- **Multi-tenant entities**: `university`, `department`
- **User management**: `user`, `student`, `professor` with role-based assignments
- **Course catalog**: `course`, `prerequisite`, `courseInstructor`
- **Student progress**: `completedCourse`, `semesterPlan`, `plannedCourse`
- **Reviews**: `courseReview`, `professorReview`
- **Admin features**: `announcement`, `auditLog`
- **Authentication**: `session`, `account`, `verification`

**Important**: Prerequisite types are `HARD`, `SOFT`, or `COREQUISITE`

## Development Guidelines

### When Working with User Roles
- Always check permissions using functions from [lib/access-control.ts](lib/access-control.ts)
- Use `requireSession()` to enforce authentication
- Extract role from session: `session.user.role`
- Respect role hierarchy: SUPER_ADMIN > ADMIN > COORDINATOR > STUDENT

### When Working with Course Planning
- Use server actions from [lib/planner/actions.ts](lib/planner/actions.ts)
- Validate plans with `validatePlan()` before allowing enrollment
- Check eligibility via [lib/eligibility/service.ts](lib/eligibility/service.ts)
- Handle prerequisite validation carefully - distinguish hard vs. soft prerequisites

### When Working with Database
- Use the singleton `prisma` client from [lib/prisma.ts](lib/prisma.ts)
- Always include university/department filters for multi-tenant queries
- Use `revalidatePath()` after mutations to update Next.js cache
- Leverage Prisma relations for eager loading (avoid N+1 queries)

### Path Aliases
- Use `@/*` to import from project root (configured in tsconfig.json)
- Example: `import { prisma } from "@/lib/prisma"`

### Styling
- Tailwind CSS v4 with PostCSS
- UI components from shadcn/ui (in [components/ui/](components/ui/))
- Use `cn()` utility from [lib/utils.ts](lib/utils.ts) for conditional classes

## Key Concepts

### Prerequisite Validation Flow
1. Student adds course to semester plan
2. System fetches all prerequisites for that course
3. Checks completed courses and courses in prior semesters
4. For hard prerequisites: Must be completed before this semester
5. For corequisites: Must be in same semester
6. For soft prerequisites: Warning only, doesn't block

### Multi-Tenant Data Isolation
- All queries must filter by `universityId` (and `departmentId` where applicable)
- Students can only see courses from their university
- Admins can only manage data in their assigned university/department
- SUPER_ADMIN has cross-university access

### Authentication Flow
- Better Auth handles session management
- Sessions stored in database with expiry
- `getSession()` is cached via React `cache()` for performance
- All API routes should call `requireSession()` for protection
