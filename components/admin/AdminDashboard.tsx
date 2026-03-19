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
      <div className="space-y-6">
        <header className="flex flex-col gap-4 pb-8 border-b border-border mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
                Platform Administration
              </h1>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mt-2">
                Loading dashboard...
              </p>
            </div>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 pb-8 border-b border-border mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
              Platform Administration
            </h1>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mt-2">
              Overview of system-wide statistics and quick actions
            </p>
          </div>
        </div>
      </header>

      {/* Statistics Grid */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border border-border shadow-none rounded-none p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
              <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Total Users</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-serif italic text-foreground">{stats.users.total}</div>
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
                {stats.users.students} students, {stats.users.admins + stats.users.coordinators + stats.users.superAdmins} staff
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-none rounded-none p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
              <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Total Courses</CardTitle>
              <IconBook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-serif italic text-foreground">{stats.courses.total}</div>
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
                Across {Object.keys(stats.courses.byUniversity).length} universities
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-none rounded-none p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
              <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Active Students</CardTitle>
              <IconUserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-serif italic text-foreground">{stats.students}</div>
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
                With student profiles
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-none rounded-none p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
              <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Total Reviews</CardTitle>
              <IconMessage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-serif italic text-foreground">{stats.reviews.total}</div>
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
                {stats.reviews.courseReviews} course, {stats.reviews.professorReviews} prof
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* University Selection */}
      <div className="pt-2">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Manage Universities</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {universities.map((uni) => (
            <Link key={uni.code} href={`/admin/${uni.code.toLowerCase()}`}>
              <Card className="bg-card border border-border shadow-none rounded-none p-6 hover:bg-accent transition-colors cursor-pointer outline-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
                  <CardTitle className="text-xs uppercase tracking-wider font-medium text-foreground">{uni.code}</CardTitle>
                  <IconSchool className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-base font-serif italic text-foreground leading-tight">{uni.name}</div>
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-2">
                    {stats?.courses.byUniversity[uni.code] || 0} courses
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Recent Registrations */}
        {stats && stats.recentRegistrations.length > 0 && (
          <Card className="bg-card border border-border shadow-none rounded-none p-6 h-fit">
            <CardHeader className="p-0 mb-6 border-b border-border pb-4">
              <CardTitle className="text-2xl font-serif italic text-foreground">Recent Registrations</CardTitle>
              <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground mt-2">Last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4 pt-2">
                {stats.recentRegistrations.map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-serif text-foreground">{user.name || "Unnamed User"}</p>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">{user.email}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="inline-block px-2 py-0.5 text-[0.65rem] uppercase tracking-wider font-medium border border-border bg-secondary text-secondary-foreground mb-1">
                        {user.role.replace("_", " ")}
                      </span>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
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
        <Card className="bg-card border border-border shadow-none rounded-none p-6 h-fit">
          <CardHeader className="p-0 mb-6 border-b border-border pb-4">
            <CardTitle className="text-2xl font-serif italic text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground mt-2">Platform-wide administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex flex-wrap gap-4 pt-2">
            <Link href="/admin/users">
              <Button variant="outline" className="rounded-none border-border font-serif italic text-sm px-6 h-10 w-full sm:w-auto hover:bg-accent">
                <IconUsers className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/courses">
              <Button variant="outline" className="rounded-none border-border font-serif italic text-sm px-6 h-10 w-full sm:w-auto hover:bg-accent">
                <IconBook className="mr-2 h-4 w-4" />
                Manage Courses
              </Button>
            </Link>
            <Link href="/admin/profile">
              <Button variant="outline" className="rounded-none border-border font-serif italic text-sm px-6 h-10 w-full sm:w-auto hover:bg-accent">
                <IconUserCircle className="mr-2 h-4 w-4" />
                My Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
