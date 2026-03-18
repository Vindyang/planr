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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { IconEdit, IconSearch, IconPlus } from "@tabler/icons-react";
import { UserRole } from "@prisma/client";
import { Pagination } from "@/components/ui/pagination";
import { getAssignableRoles } from "@/lib/access-control";
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
  student: { id: string; university: { code: string; name: string } } | null;
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
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Get current user role and assignable roles from session
  const currentUserRole = (session?.user?.role as UserRole) || null;
  const assignableRoles = currentUserRole ? getAssignableRoles(currentUserRole) : [];

  // Create user dialog state
  const [isCreating, setIsCreating] = useState(false);
  const [universities, setUniversities] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "" as UserRole | "",
    assignedUniversityId: "",
    assignedDepartmentId: "",
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser || !newRole) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success("User role updated successfully");
      setEditingUser(null);
      setNewRole(null);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user role", {
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

    try {
      setSaving(true);
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          assignedUniversityId: newUser.assignedUniversityId || undefined,
          assignedDepartmentId: newUser.assignedDepartmentId || undefined,
        }),
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
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>University/Assignment</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(user)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                  </TableCell>
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

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {editingUser?.name || editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-role" className="text-sm font-medium mb-2 block">
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
