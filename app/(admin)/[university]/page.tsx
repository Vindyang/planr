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
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{universityUpper} Administration</h1>
          <p className="text-muted-foreground">
            {universityNames[universityUpper] || universityUpper}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <IconBook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Course catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professors</CardTitle>
            <IconBuildingBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.professors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Faculty members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Academic units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage {universityUpper} resources</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Link href={`/admin/${university}/courses`}>
            <Button>
              <IconBook className="mr-2 h-4 w-4" />
              Manage Courses
            </Button>
          </Link>
          <Link href={`/admin/${university}/users`}>
            <Button variant="outline">
              <IconUsers className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Departments List */}
      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
          <CardDescription>Academic departments at {universityUpper}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.departments.map((dept) => (
              <Link
                key={dept.id}
                href={`/admin/${university}/${encodeURIComponent(dept.name)}`}
              >
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  {dept.name}
                </Badge>
              </Link>
            ))}
            {stats.departments.length === 0 && (
              <p className="text-sm text-muted-foreground">No departments found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Course Reviews</CardTitle>
          <CardDescription>Latest student feedback</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentReviews.length > 0 ? (
            <div className="space-y-3">
              {stats.recentReviews.map((review) => (
                <div key={review.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {review.course.code} - {review.course.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {review.isAnonymous ? "Anonymous" : review.student.user.name} •{" "}
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={review.rating >= 4 ? "default" : "secondary"}>
                        {review.rating}/5
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent reviews</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
