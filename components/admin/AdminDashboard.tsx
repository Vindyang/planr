"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  IconSchool,
  IconUsers,
  IconBook,
  IconMessage,
  IconUserCircle,
  IconChartBar,
} from "@tabler/icons-react";

interface AdminStats {
  users: {
    total: number;
    students: number;
    coordinators: number;
    admins: number;
    superAdmins: number;
  };
  courses: {
    total: number;
    byUniversity: Record<string, number>;
  };
  students: number;
  reviews: {
    courseReviews: number;
    professorReviews: number;
    total: number;
  };
  recentRegistrations: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
  }>;
}

const universities = [
  { code: "SMU", name: "Singapore Management University" },
  { code: "NUS", name: "National University of Singapore" },
  { code: "NTU", name: "Nanyang Technological University" },
  { code: "SUTD", name: "Singapore University of Technology and Design" },
  { code: "SUSS", name: "Singapore University of Social Sciences" },
];

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Administration</h1>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Administration</h1>
          <p className="text-muted-foreground">
            Overview of system-wide statistics and quick actions
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.users.students} students, {stats.users.admins + stats.users.coordinators + stats.users.superAdmins} staff
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <IconBook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.courses.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {Object.keys(stats.courses.byUniversity).length} universities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <IconUserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.students}</div>
              <p className="text-xs text-muted-foreground mt-1">
                With student profiles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <IconMessage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reviews.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.reviews.courseReviews} course, {stats.reviews.professorReviews} professor
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* University Selection */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Manage Universities</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {universities.map((uni) => (
            <Link key={uni.code} href={`/admin/${uni.code.toLowerCase()}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{uni.code}</CardTitle>
                  <IconSchool className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{uni.name}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats?.courses.byUniversity[uni.code] || 0} courses
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Registrations */}
      {stats && stats.recentRegistrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentRegistrations.map((user) => (
                <div key={user.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{user.name || "Unnamed User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {user.role}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Platform-wide administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/admin/users">
            <Button variant="outline">
              <IconUsers className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </Link>
          <Link href="/admin/courses">
            <Button variant="outline">
              <IconBook className="mr-2 h-4 w-4" />
              Manage Courses
            </Button>
          </Link>
          <Link href="/admin/profile">
            <Button variant="outline">
              <IconUserCircle className="mr-2 h-4 w-4" />
              My Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
