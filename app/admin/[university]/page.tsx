import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconUsers, IconBook, IconBuildingBank, IconChartBar } from "@tabler/icons-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getUniversityStats(university: string) {
  const universityUpper = university.toUpperCase();

  // Look up university by code to get ID
  const universityRecord = await prisma.university.findUnique({
    where: { code: universityUpper },
    include: {
      departments: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  if (!universityRecord) {
    throw new Error(`University ${universityUpper} not found`);
  }

  // Get students count for this university
  const studentsCount = await prisma.student.count({
    where: { universityId: universityRecord.id },
  });

  // Get active courses count for this university
  const coursesCount = await prisma.course.count({
    where: {
      universityId: universityRecord.id,
      isActive: true,
    },
  });

  // Get professors count
  const professorsCount = await prisma.professor.count({
    where: { universityId: universityRecord.id },
  });

  // Get unique departments from database
  const departments = universityRecord.departments;

  // Get recent reviews for this university
  const recentReviews = await prisma.courseReview.findMany({
    where: {
      course: {
        universityId: universityRecord.id,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      course: {
        select: {
          code: true,
          title: true,
        },
      },
      student: {
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    students: studentsCount,
    courses: coursesCount,
    professors: professorsCount,
    departments: departments,
    recentReviews,
  };
}

export default async function UniversityDashboardPage({
  params,
}: {
  params: Promise<{ university: string }>;
}) {
  const { university } = await params;
  const universityUpper = university.toUpperCase();
  const stats = await getUniversityStats(university);

  const universityNames: Record<string, string> = {
    SMU: "Singapore Management University",
    NUS: "National University of Singapore",
    NTU: "Nanyang Technological University",
    SUTD: "Singapore University of Technology and Design",
    SUSS: "Singapore University of Social Sciences",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 pb-8 border-b border-border mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
              {universityUpper} Administration
            </h1>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mt-2">
              {universityNames[universityUpper] || universityUpper}
            </p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border border-border shadow-none rounded-none p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Students</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-serif italic text-foreground">{stats.students}</div>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-none rounded-none p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Active Courses</CardTitle>
            <IconBook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-serif italic text-foreground">{stats.courses}</div>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
              Course catalog
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-none rounded-none p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Professors</CardTitle>
            <IconBuildingBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-serif italic text-foreground">{stats.professors}</div>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
              Faculty members
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-none rounded-none p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Departments</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-serif italic text-foreground">{stats.departments.length}</div>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
              Academic units
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 pt-4">
        {/* Quick Actions */}
        <Card className="bg-card border border-border shadow-none rounded-none p-6 h-fit">
          <CardHeader className="p-0 mb-6 border-b border-border pb-4">
            <CardTitle className="text-2xl font-serif italic text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground mt-2">Manage {universityUpper} resources</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex flex-wrap gap-4 pt-2">
            <Link href={`/admin/${university}/courses`}>
              <Button variant="outline" className="rounded-none border-border font-serif italic text-sm px-6 h-10 w-full sm:w-auto hover:bg-accent">
                <IconBook className="mr-2 h-4 w-4" />
                Manage Courses
              </Button>
            </Link>
            <Link href={`/admin/${university}/users`}>
              <Button variant="outline" className="rounded-none border-border font-serif italic text-sm px-6 h-10 w-full sm:w-auto hover:bg-accent">
                <IconUsers className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Departments List */}
        <Card className="bg-card border border-border shadow-none rounded-none p-6 h-fit">
          <CardHeader className="p-0 mb-6 border-b border-border pb-4">
            <CardTitle className="text-2xl font-serif italic text-foreground">Departments</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground mt-2">Academic departments at {universityUpper}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-wrap gap-2 pt-2">
              {stats.departments.map((dept) => (
                <Link
                  key={dept.id}
                  href={`/admin/${university}/${encodeURIComponent(dept.name)}`}
                >
                  <Badge variant="outline" className="rounded-none border-border bg-secondary text-secondary-foreground font-medium text-[0.65rem] uppercase tracking-wider px-3 py-1 cursor-pointer hover:bg-muted">
                    {dept.name}
                  </Badge>
                </Link>
              ))}
              {stats.departments.length === 0 && (
                <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">No departments found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card className="bg-card border border-border shadow-none rounded-none p-6 h-fit">
          <CardHeader className="p-0 mb-6 border-b border-border pb-4">
            <CardTitle className="text-2xl font-serif italic text-foreground">Recent Course Reviews</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground mt-2">Latest student feedback</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentReviews.length > 0 ? (
              <div className="space-y-4 pt-2">
                {stats.recentReviews.map((review) => (
                  <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-serif text-foreground">
                          {review.course.code} - {review.course.title}
                        </p>
                        <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
                          {review.isAnonymous ? "Anonymous" : review.student.user.name} •{" "}
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 text-[0.65rem] uppercase tracking-wider font-medium border border-border bg-foreground text-background">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground pt-2">No recent reviews</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
