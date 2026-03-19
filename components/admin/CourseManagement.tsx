"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { IconEdit, IconSearch, IconTrash, IconPlus, IconToggleLeft, IconToggleRight } from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";
import { Pagination } from "@/components/ui/pagination";

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  units: number;
  isActive: boolean;
  university: { id: string; code: string; name: string };
  department: { id: string; code: string; name: string };
  _count: {
    prerequisites: number;
    dependentCourses: number;
  };
}

interface University {
  id: string;
  code: string;
  name: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

interface CourseManagementProps {
  defaultUniversity?: string;
}

export function CourseManagement({ defaultUniversity }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [universityFilter, setUniversityFilter] = useState<string>(defaultUniversity || "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    units: 3,
    universityId: "",
    departmentId: "",
    isActive: true,
  });

  const fetchUniversities = async () => {
    try {
      const response = await fetch("/api/admin/universities");
      if (response.ok) {
        const data = await response.json();
        setUniversities(data.universities);
      }
    } catch (error) {
      console.error("Failed to fetch universities:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (universityFilter !== "all") params.set("university", universityFilter);
      if (statusFilter !== "all") params.set("isActive", statusFilter);
      params.set("page", currentPage.toString());
      params.set("pageSize", pageSize.toString());

      const response = await fetch(`/api/admin/courses?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
        setTotalItems(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (universityId: string) => {
    try {
      const response = await fetch(`/api/admin/departments?universityId=${universityId}`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [search, universityFilter, statusFilter]);

  useEffect(() => {
    fetchCourses();
  }, [search, universityFilter, statusFilter, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleAddCourse = () => {
    setFormData({
      code: "",
      title: "",
      description: "",
      units: 3,
      universityId: "",
      departmentId: "",
      isActive: true,
    });
    setDepartments([]);
    setIsAddDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setFormData({
      code: course.code,
      title: course.title,
      description: course.description || "",
      units: course.units,
      universityId: course.university.id,
      departmentId: course.department.id,
      isActive: course.isActive,
    });
    setEditingCourse(course);
    fetchDepartments(course.university.id);
  };

  const handleSaveCourse = async () => {
    if (!formData.code || !formData.title || !formData.universityId || !formData.departmentId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      const url = editingCourse
        ? `/api/admin/courses/${editingCourse.id}`
        : "/api/admin/courses";
      const method = editingCourse ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success(editingCourse ? "Course updated successfully" : "Course created successfully");
      setIsAddDialogOpen(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      toast.error("Failed to save course", {
        description: (error as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (course: Course) => {
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !course.isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success(`Course ${course.isActive ? "deactivated" : "activated"} successfully`);
      fetchCourses();
    } catch (error) {
      toast.error("Failed to update course status", {
        description: (error as Error).message,
      });
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Are you sure you want to deactivate ${course.code}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success("Course deactivated successfully");
      fetchCourses();
    } catch (error) {
      toast.error("Failed to delete course", {
        description: (error as Error).message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 pb-8 border-b border-border mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
              Course Catalog Management
            </h1>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
              {defaultUniversity
                ? `Manage courses for ${defaultUniversity.toUpperCase()}`
                : "Add, edit, or disable courses across all universities"}
            </p>
          </div>
          <Button onClick={handleAddCourse}>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {!defaultUniversity && (
          <Select value={universityFilter} onValueChange={setUniversityFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by university" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              {universities.map((uni) => (
                <SelectItem key={uni.id} value={uni.code}>
                  {uni.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active Only</SelectItem>
            <SelectItem value="false">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Table */}
      <div className="rounded-none border border-border bg-card overflow-hidden shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              {!defaultUniversity && <TableHead>University</TableHead>}
              <TableHead>Department</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prerequisites</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={defaultUniversity ? 7 : 8} className="text-center py-8">
                  Loading courses...
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={defaultUniversity ? 7 : 8} className="text-center py-8 text-muted-foreground">
                  No courses found
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium font-mono">{course.code}</TableCell>
                  <TableCell>{course.title}</TableCell>
                  {!defaultUniversity && (
                    <TableCell>
                      <span className="text-sm">{course.university.code}</span>
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="text-sm">{course.department.name}</span>
                  </TableCell>
                  <TableCell>{course.units}</TableCell>
                  <TableCell>
                    <Badge variant={course.isActive ? "default" : "secondary"}>
                      {course.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {course._count.prerequisites} required
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(course)}
                        title={course.isActive ? "Deactivate" : "Activate"}
                      >
                        {course.isActive ? (
                          <IconToggleRight className="h-4 w-4" />
                        ) : (
                          <IconToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCourse(course)}
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      {course.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCourse(course)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!loading && courses.length > 0 && (
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

      {/* Add/Edit Course Dialog */}
      <Dialog
        open={isAddDialogOpen || !!editingCourse}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingCourse(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
            <DialogDescription>
              {editingCourse ? "Update course information" : "Create a new course in the catalog"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., IS210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="units">Units *</Label>
                <Input
                  id="units"
                  type="number"
                  min="0"
                  max="20"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Information Systems and Innovation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Course description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university">University *</Label>
                <Select
                  value={formData.universityId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, universityId: value, departmentId: "" });
                    fetchDepartments(value);
                  }}
                >
                  <SelectTrigger>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                  disabled={!formData.universityId || departments.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingCourse(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCourse} disabled={saving}>
              {saving ? "Saving..." : editingCourse ? "Save Changes" : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
