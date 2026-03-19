"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconSchool,
  IconUsers,
  IconBook,
  IconMessage,
  IconUserCircle,
  IconArrowUpRight,
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
      <div className="space-y-12 pb-12 animate-in fade-in duration-1000">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-none tracking-tight">
              Platform
              <br />
              <span className="italic text-muted-foreground">Administration</span>
            </h1>
            <p className="max-w-xl text-sm uppercase tracking-widest text-muted-foreground font-medium animate-pulse">
              Initializing dashboard environment...
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border opacity-50">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card p-6 md:p-8 h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-700">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-none tracking-tight">
            Platform
            <br />
            <span className="italic text-muted-foreground">Administration</span>
          </h1>
          <p className="max-w-xl text-sm uppercase tracking-widest text-foreground font-medium">
            System overview, user management, and platform analytics
          </p>
        </div>
      </header>

      {stats && (
        <>
          {/* Key Metrics - Brutalist Grid (using gap-px with bg-border background) */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-foreground">
                Global Statistics
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
              {/* Stat 1 */}
              <div className="bg-card p-6 md:p-8 flex flex-col justify-between h-full group transition-colors hover:bg-secondary/10">
                <div className="flex justify-between items-start mb-12">
                  <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                    Total Users
                  </span>
                  <IconUsers className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div>
                  <span className="text-4xl md:text-5xl font-serif italic text-foreground block">
                    {stats.users.total}
                  </span>
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-3 leading-relaxed">
                    {stats.users.students} Students
                    <br />
                    {stats.users.admins +
                      stats.users.coordinators +
                      stats.users.superAdmins}{" "}
                    Staff
                  </p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-card p-6 md:p-8 flex flex-col justify-between h-full group transition-colors hover:bg-secondary/10">
                <div className="flex justify-between items-start mb-12">
                  <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                    Total Courses
                  </span>
                  <IconBook className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div>
                  <span className="text-4xl md:text-5xl font-serif italic text-foreground block">
                    {stats.courses.total}
                  </span>
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-3 leading-relaxed">
                    Across {Object.keys(stats.courses.byUniversity).length}{" "}
                    Universities
                  </p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-card p-6 md:p-8 flex flex-col justify-between h-full group transition-colors hover:bg-secondary/10">
                <div className="flex justify-between items-start mb-12">
                  <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                    Active Students
                  </span>
                  <IconUserCircle className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div>
                  <span className="text-4xl md:text-5xl font-serif italic text-foreground block">
                    {stats.students}
                  </span>
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-3 leading-relaxed">
                    With Completed
                    <br />
                    Profiles
                  </p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="bg-card p-6 md:p-8 flex flex-col justify-between h-full group transition-colors hover:bg-secondary/10">
                <div className="flex justify-between items-start mb-12">
                  <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                    Total Reviews
                  </span>
                  <IconMessage className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div>
                  <span className="text-4xl md:text-5xl font-serif italic text-foreground block">
                    {stats.reviews.total}
                  </span>
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-3 leading-relaxed">
                    {stats.reviews.courseReviews} Course
                    <br />
                    {stats.reviews.professorReviews} Professor
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Combined Operations Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border">
            {/* Universities Directory */}
            <div className="lg:col-span-2 bg-card flex flex-col">
              <div className="p-6 md:p-8 border-b border-border flex justify-between items-center bg-card">
                <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-foreground">
                  Managed Institutions
                </h2>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {universities.length} Active
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border flex-grow">
                {universities.map((uni) => (
                  <Link
                    key={uni.code}
                    href={`/admin/${uni.code.toLowerCase()}`}
                    className="bg-card p-6 md:p-8 hover:bg-secondary/20 transition-all group block h-full flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground group-hover:text-foreground font-medium transition-colors">
                        {uni.code}
                      </span>
                      <IconSchool className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-2xl font-serif text-foreground leading-tight mb-3">
                        {uni.name}
                      </h3>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        {stats?.courses.byUniversity[uni.code] || 0} Courses
                        Available
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions Portal */}
            <div className="bg-card flex flex-col border-t md:border-t-0 border-border md:border-l">
              <div className="p-6 md:p-8 border-b border-border bg-card">
                <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-foreground">
                  Action Portal
                </h2>
              </div>
              <div className="flex flex-col divide-y divide-border h-full bg-card">
                <Link
                  href="/admin/users"
                  className="p-6 md:p-8 flex items-center justify-between hover:bg-secondary/20 transition-all group flex-grow"
                >
                  <div className="flex flex-col">
                    <span className="text-xl font-serif text-foreground group-hover:italic transition-all">
                      Manage Users
                    </span>
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-2">
                      Access control & directory
                    </span>
                  </div>
                  <IconArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
                <Link
                  href="/admin/courses"
                  className="p-6 md:p-8 flex items-center justify-between hover:bg-secondary/20 transition-all group flex-grow"
                >
                  <div className="flex flex-col">
                    <span className="text-xl font-serif text-foreground group-hover:italic transition-all">
                      Course Catalog
                    </span>
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-2">
                      Curriculum & requirements
                    </span>
                  </div>
                  <IconArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
                <Link
                  href="/admin/activity"
                  className="p-6 md:p-8 flex items-center justify-between hover:bg-secondary/20 transition-all group flex-grow"
                >
                  <div className="flex flex-col">
                    <span className="text-xl font-serif text-foreground group-hover:italic transition-all">
                      System Log
                    </span>
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-2">
                      Recent registrations and events
                    </span>
                  </div>
                  <IconArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
                <Link
                  href="/admin/profile"
                  className="p-6 md:p-8 flex items-center justify-between hover:bg-secondary/20 transition-all group flex-grow"
                >
                  <div className="flex flex-col">
                    <span className="text-xl font-serif text-foreground group-hover:italic transition-all">
                      My Profile
                    </span>
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-2">
                      Personal settings
                    </span>
                  </div>
                  <IconArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
