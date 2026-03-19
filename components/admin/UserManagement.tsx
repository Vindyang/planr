"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { IconEdit, IconSearch, IconPlus, IconTrash } from "@tabler/icons-react";
import { UserRole } from "@prisma/client";
import { Pagination } from "@/components/ui/pagination";
import { getAssignableRoles, canManageUserByRole, canDeleteUser } from "@/lib/access-control";
import { useSession } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image: string | null;
  createdAt: string;
  assignedUniversityId: string | null;
  assignedDepartmentId: string | null;
  assignedUniversity: { code: string; name: string } | null;
  assignedDepartment: { code: string; name: string } | null;
  student: {
    id: string;
    studentId: string | null;
    universityId: string;
    majorId: string;
    secondMajorId: string | null;
    minorId: string | null;
    year: number;
    enrollmentYear: number;
    expectedGraduationYear: number;
    university: { code: string; name: string };
    major: { code: string; name: string } | null;
  } | null;
}

const ROLE_COLORS: Record<UserRole, string> = {
  STUDENT: "bg-blue-100 text-blue-800",
  COORDINATOR: "bg-green-100 text-green-800",
  ADMIN: "bg-purple-100 text-purple-800",
  SUPER_ADMIN: "bg-red-100 text-red-800",
};

interface UserManagementProps {
  defaultUniversity?: string;
}

export function UserManagement({ defaultUniversity }: UserManagementProps = {}) {
  // Get current user session using Better Auth hook
  const { data: session } = useSession();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [universityFilter, setUniversityFilter] = useState<string>(defaultUniversity || "all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole | null>(null);
  const [editAssignedUniversityId, setEditAssignedUniversityId] = useState<string>("");
  const [editAssignedDepartmentId, setEditAssignedDepartmentId] = useState<string>("");
  const [editStudentData, setEditStudentData] = useState({
    majorId: "",
    year: 1,
    enrollmentYear: new Date().getFullYear(),
    expectedGraduationYear: new Date().getFullYear() + 4,
  });
  const [editDepartments, setEditDepartments] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Get current user role and assignable roles from session
  const currentUserRole = ((session?.user as any)?.role as UserRole) || null;
  const currentUserUniversityId = ((session?.user as any)?.assignedUniversityId as string) || null;
  const assignableRoles = currentUserRole ? getAssignableRoles(currentUserRole) : [];

  // Create user dialog state
  const [isCreating, setIsCreating] = useState(false);
  const [universities, setUniversities] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "" as UserRole | "",
    assignedUniversityId: "",
    assignedDepartmentId: "",
    // Student-specific fields
    studentId: "",
    majorId: "",
    year: new Date().getFullYear() - 2000 + 1, // Default to year 1
    enrollmentYear: new Date().getFullYear(),
    expectedGraduationYear: new Date().getFullYear() + 4,
  });

  const fetchUniversities = async () => {
    try {
      const response = await fetch("/api/admin/universities");
      if (response.ok) {
        const data = await response.json();
        setUniversities(data.universities || []);
      }
    } catch (error) {
      console.error("Failed to fetch universities:", error);
    }
  };

  const fetchDepartments = async (universityId: string) => {
    try {
      const response = await fetch(`/api/admin/universities/${universityId}/departments`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setDepartments([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (universityFilter !== "all") params.set("university", universityFilter);
      params.set("page", currentPage.toString());
      params.set("pageSize", pageSize.toString());

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalItems(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch universities on mount
    fetchUniversities();
  }, []);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [search, roleFilter, universityFilter]);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, universityFilter, currentPage, pageSize]);

  // Auto-set university for coordinators creating students
  useEffect(() => {
    if (currentUserRole === "COORDINATOR" && newUser.role === "STUDENT" && currentUserUniversityId) {
      setNewUser((prev) => ({ ...prev, assignedUniversityId: currentUserUniversityId }));
    }
  }, [currentUserRole, newUser.role, currentUserUniversityId]);

  // Fetch departments when university is selected for student creation
  useEffect(() => {
    if (newUser.role === "STUDENT" && newUser.assignedUniversityId) {
      fetchDepartments(newUser.assignedUniversityId);
    }
  }, [newUser.role, newUser.assignedUniversityId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleEditRole = async (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
    setEditAssignedUniversityId(user.assignedUniversityId || "");
    setEditAssignedDepartmentId(user.assignedDepartmentId || "");

    // If editing a student, populate student data
    if (user.role === "STUDENT" && user.student) {
      console.log("Editing student:", user.student);
      setEditStudentData({
        majorId: user.student.majorId || "",
        year: user.student.year || 1,
        enrollmentYear: user.student.enrollmentYear || new Date().getFullYear(),
        expectedGraduationYear: user.student.expectedGraduationYear || new Date().getFullYear() + 4,
      });

      // Fetch departments for the student's university
      if (user.student.universityId) {
        console.log("Fetching departments for university:", user.student.universityId);
        try {
          const url = `/api/admin/universities/${user.student.universityId}/departments`;
          console.log("Fetching from:", url);
          const response = await fetch(url);
          console.log("Response status:", response.status);
          if (response.ok) {
            const data = await response.json();
            console.log("Departments data:", data);
            setEditDepartments(data.departments || []);
          } else {
            console.error("Failed to fetch departments, status:", response.status);
          }
        } catch (error) {
          console.error("Failed to fetch departments for editing:", error);
        }
      } else {
        console.warn("No universityId found for student");
      }
    }
  };

  const handleSaveRole = async () => {
    if (!editingUser || !newRole) return;

    try {
      setSaving(true);
      const payload: any = { role: newRole };

      // If editing a COORDINATOR and user is ADMIN, allow updating university/department
      if ((editingUser.role === "COORDINATOR" || newRole === "COORDINATOR") && currentUserRole === "ADMIN") {
        payload.assignedUniversityId = editAssignedUniversityId || null;
        payload.assignedDepartmentId = editAssignedDepartmentId || null;
      }

      // If editing a STUDENT, include student-specific data
      if (editingUser.role === "STUDENT") {
        payload.majorId = editStudentData.majorId;
        payload.year = editStudentData.year;
        payload.enrollmentYear = editStudentData.enrollmentYear;
        payload.expectedGraduationYear = editStudentData.expectedGraduationYear;
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success("User updated successfully");
      setEditingUser(null);
      setNewRole(null);
      setEditAssignedUniversityId("");
      setEditAssignedDepartmentId("");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user", {
        description: (error as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate student-specific requirements
    if (newUser.role === "STUDENT") {
      if (!newUser.majorId) {
        toast.error("Major is required for students");
        return;
      }
      if (!newUser.year || !newUser.enrollmentYear || !newUser.expectedGraduationYear) {
        toast.error("Year, enrollment year, and expected graduation year are required for students");
        return;
      }
    }

    try {
      setSaving(true);
      const payload: any = {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        assignedUniversityId: newUser.assignedUniversityId || undefined,
        assignedDepartmentId: newUser.assignedDepartmentId || undefined,
      };

      // Add student-specific fields if creating a student
      if (newUser.role === "STUDENT") {
        payload.studentId = newUser.studentId || undefined;
        payload.majorId = newUser.majorId;
        payload.year = newUser.year;
        payload.enrollmentYear = newUser.enrollmentYear;
        payload.expectedGraduationYear = newUser.expectedGraduationYear;
      }

      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details);
      }

      toast.success("User created successfully");
      setIsCreating(false);
      setNewUser({
        email: "",
        name: "",
        role: "",
        assignedUniversityId: "",
        assignedDepartmentId: "",
        studentId: "",
        majorId: "",
        year: new Date().getFullYear() - 2000 + 1,
        enrollmentYear: new Date().getFullYear(),
        expectedGraduationYear: new Date().getFullYear() + 4,
      });
      fetchUsers();
    } catch (error) {
      toast.error("Failed to create user", {
        description: (error as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user", {
        description: (error as Error).message,
      });
    } finally {
      setSaving(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 pb-8 border-b border-border mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
              User Management
            </h1>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mt-2">
              View and manage students, coordinators, and administrators in the system.
            </p>
          </div>
          {assignableRoles.length > 0 && (
            <Button onClick={() => setIsCreating(true)}>
              <IconPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="STUDENT">Student</SelectItem>
            <SelectItem value="COORDINATOR">Coordinator</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        {!defaultUniversity && (
          <Select value={universityFilter} onValueChange={setUniversityFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by university" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              <SelectItem value="SMU">SMU</SelectItem>
              <SelectItem value="NUS">NUS</SelectItem>
              <SelectItem value="NTU">NTU</SelectItem>
              <SelectItem value="SUTD">SUTD</SelectItem>
              <SelectItem value="SUSS">SUSS</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* User Table */}
      <div className="rounded-none border border-border bg-card overflow-hidden shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>University/Assignment</TableHead>
              <TableHead>Registered</TableHead>
              {currentUserRole !== "COORDINATOR" && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={currentUserRole !== "COORDINATOR" ? 6 : 5} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={currentUserRole !== "COORDINATOR" ? 6 : 5} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name || "Unnamed User"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[user.role]} variant="outline">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.student?.university && (
                      <span className="text-sm">
                        {user.student.university.code} - {user.student.university.name}
                      </span>
                    )}
                    {user.assignedUniversity && (
                      <div className="text-sm">
                        <div>{user.assignedUniversity.code} - {user.assignedUniversity.name}</div>
                        {user.assignedDepartment && (
                          <div className="text-xs text-muted-foreground">
                            Dept: {user.assignedDepartment.name}
                          </div>
                        )}
                      </div>
                    )}
                    {!user.student && !user.assignedUniversity && (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  {currentUserRole !== "COORDINATOR" && (
                    <TableCell className="text-right">
                      {(() => {
                        // Check if current user can manage this user
                        const canEdit = currentUserRole && canManageUserByRole(currentUserRole, user.role);
                        const canDelete = currentUserRole && canDeleteUser(currentUserRole, user.role);

                        // If no actions available, show nothing
                        if (!canEdit && !canDelete) {
                          return <span className="text-xs text-muted-foreground">No actions</span>;
                        }

                        return (
                          <div className="flex justify-end items-center gap-1">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRole(user)}
                                title="Edit User Role"
                              >
                                <IconEdit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteUser(user)}
                                title="Delete User"
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!loading && users.length > 0 && (
          <div className="border-t border-border py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      {/* Delete User Alert Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && !saving && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for{" "}
              <span className="font-semibold text-foreground">
                {userToDelete?.name || userToDelete?.email}
              </span>{" "}
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteUser();
              }}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {editingUser?.name || editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-sm font-medium">
                Select New Role
              </Label>
              <Select
                value={newRole || undefined}
                onValueChange={(value) => setNewRole(value as UserRole)}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {/* IMPORTANT: Use assignableRoles for permission-based filtering */}
                  {assignableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Show university/department editing for ADMIN editing COORDINATOR */}
            {currentUserRole === "ADMIN" && (editingUser?.role === "COORDINATOR" || newRole === "COORDINATOR") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-university">Assigned University (Optional)</Label>
                  <Select
                    value={editAssignedUniversityId || "none"}
                    onValueChange={(value) => {
                      setEditAssignedUniversityId(value === "none" ? "" : value);
                      if (value === "none") {
                        setEditAssignedDepartmentId("");
                      }
                    }}
                  >
                    <SelectTrigger id="edit-university">
                      <SelectValue placeholder="Select university (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.code} - {uni.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editAssignedUniversityId && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Assigned Department (Optional)</Label>
                    <Input
                      id="edit-department"
                      type="text"
                      placeholder="Department ID"
                      value={editAssignedDepartmentId}
                      onChange={(e) => setEditAssignedDepartmentId(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}
            {/* Show student editing fields for ADMIN, SUPER_ADMIN, and COORDINATOR editing STUDENT */}
            {editingUser?.role === "STUDENT" && editingUser.student && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-major">Major *</Label>
                  <Select
                    value={editStudentData.majorId || undefined}
                    onValueChange={(value) => setEditStudentData({ ...editStudentData, majorId: value })}
                  >
                    <SelectTrigger id="edit-major">
                      <SelectValue placeholder="Select major" />
                    </SelectTrigger>
                    <SelectContent>
                      {editDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.code} - {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editingUser.student.major && (
                    <p className="text-xs text-muted-foreground">
                      Current: {editingUser.student.major.code} - {editingUser.student.major.name}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-year">Year *</Label>
                    <Select
                      value={editStudentData.year.toString()}
                      onValueChange={(value) => setEditStudentData({ ...editStudentData, year: parseInt(value) })}
                    >
                      <SelectTrigger id="edit-year">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            Year {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-enrollment-year">Enrolled *</Label>
                    <Input
                      id="edit-enrollment-year"
                      type="number"
                      min="2000"
                      max="2100"
                      value={editStudentData.enrollmentYear}
                      onChange={(e) => setEditStudentData({ ...editStudentData, enrollmentYear: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-graduation-year">Graduates *</Label>
                    <Input
                      id="edit-graduation-year"
                      type="number"
                      min="2000"
                      max="2100"
                      value={editStudentData.expectedGraduationYear}
                      onChange={(e) => setEditStudentData({ ...editStudentData, expectedGraduationYear: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={saving || !newRole}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreating} onOpenChange={(open) => !open && setIsCreating(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system with specified role and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={newUser.role || undefined}
                onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {/* IMPORTANT: Use assignableRoles for permission-based filtering */}
                  {assignableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(newUser.role === "ADMIN" || newUser.role === "COORDINATOR") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="university">Assigned University (Optional)</Label>
                  <Select
                    value={newUser.assignedUniversityId || undefined}
                    onValueChange={(value) => setNewUser({ ...newUser, assignedUniversityId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="university">
                      <SelectValue placeholder="Select university (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.code} - {uni.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newUser.assignedUniversityId && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Assigned Department (Optional)</Label>
                    <Input
                      id="department"
                      type="text"
                      placeholder="Department ID"
                      value={newUser.assignedDepartmentId}
                      onChange={(e) => setNewUser({ ...newUser, assignedDepartmentId: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}
            {newUser.role === "STUDENT" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="student-university">University *</Label>
                  <Select
                    value={newUser.assignedUniversityId || undefined}
                    onValueChange={(value) => setNewUser({ ...newUser, assignedUniversityId: value, majorId: "" })}
                    disabled={currentUserRole === "COORDINATOR"}
                  >
                    <SelectTrigger id="student-university">
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.code} - {uni.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentUserRole === "COORDINATOR" && (
                    <p className="text-xs text-muted-foreground">
                      University is automatically set to your assigned university
                    </p>
                  )}
                </div>
                {newUser.assignedUniversityId && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="major">Major *</Label>
                      <Select
                        value={newUser.majorId || undefined}
                        onValueChange={(value) => setNewUser({ ...newUser, majorId: value })}
                      >
                        <SelectTrigger id="major">
                          <SelectValue placeholder="Select major" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.code} - {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-id">Student ID (Optional)</Label>
                      <Input
                        id="student-id"
                        type="text"
                        placeholder="e.g., 01234567"
                        value={newUser.studentId}
                        onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="year">Year *</Label>
                        <Select
                          value={newUser.year.toString()}
                          onValueChange={(value) => setNewUser({ ...newUser, year: parseInt(value) })}
                        >
                          <SelectTrigger id="year">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map((y) => (
                              <SelectItem key={y} value={y.toString()}>
                                Year {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="enrollment-year">Enrolled *</Label>
                        <Input
                          id="enrollment-year"
                          type="number"
                          min="2000"
                          max="2100"
                          value={newUser.enrollmentYear}
                          onChange={(e) => setNewUser({ ...newUser, enrollmentYear: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="graduation-year">Graduates *</Label>
                        <Input
                          id="graduation-year"
                          type="number"
                          min="2000"
                          max="2100"
                          value={newUser.expectedGraduationYear}
                          onChange={(e) => setNewUser({ ...newUser, expectedGraduationYear: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setNewUser({
                  email: "",
                  name: "",
                  role: "",
                  assignedUniversityId: "",
                  assignedDepartmentId: "",
                  studentId: "",
                  majorId: "",
                  year: new Date().getFullYear() - 2000 + 1,
                  enrollmentYear: new Date().getFullYear(),
                  expectedGraduationYear: new Date().getFullYear() + 4,
                });
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={saving || !newUser.email || !newUser.name || !newUser.role}
            >
              {saving ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
