import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconBook, IconUser, IconStar } from "@tabler/icons-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getDepartmentStats(university: string, department: string) {
  const universityUpper = university.toUpperCase();
  const departmentDecoded = decodeURIComponent(department);

  // Look up university by code to get ID
  const universityRecord = await prisma.university.findUnique({
    where: { code: universityUpper },
  });

  if (!universityRecord) {
    throw new Error(`University ${universityUpper} not found`);
  }

  // Look up department by name and university
  const departmentRecord = await prisma.department.findFirst({
    where: {
      universityId: universityRecord.id,
      name: departmentDecoded,
    },
  });

  // Get courses for this department
  const courses = await prisma.course.findMany({
    where: {
      universityId: universityRecord.id,
      departmentId: departmentRecord?.id,
      isActive: true,
    },
    include: {
      _count: {
        select: {
          courseReviews: true,
        },
      },
    },
  });

  // Get professors teaching these courses
  const courseIds = courses.map((c) => c.id);
  const professors = await prisma.professor.findMany({
    where: {
      universityId: universityRecord.id,
      departmentId: departmentRecord?.id,
      courseInstructors: {
        some: {
          courseId: {
            in: courseIds,
          },
        },
      },
    },
    include: {
      department: {
        select: {
          name: true,
          code: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });

  // Get review count for department courses
  const reviewsCount = await prisma.courseReview.count({
    where: {
      courseId: {
        in: courseIds,
      },
    },
  });

  return {
    courses,
    professors,
    coursesCount: courses.length,
    professorsCount: professors.length,
    reviewsCount,
  };
}

export default async function DepartmentDashboardPage({
  params,
}: {
  params: Promise<{ university: string; department: string }>;
}) {
  const { university, department } = await params;
  const universityUpper = university.toUpperCase();
  const departmentDecoded = decodeURIComponent(department);
  const stats = await getDepartmentStats(university, department);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {departmentDecoded} Department
          </h1>
          <p className="text-muted-foreground">
            {universityUpper} • Department Administration
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <IconBook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coursesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professors</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.professorsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Teaching faculty
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <IconStar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Student feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage {departmentDecoded} department resources</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Link href={`/admin/${university}/${department}/courses`}>
            <Button>
              <IconBook className="mr-2 h-4 w-4" />
              Manage Courses
            </Button>
          </Link>
          <Link href={`/admin/${university}/${department}/professors`}>
            <Button variant="outline">
              <IconUser className="mr-2 h-4 w-4" />
              Manage Professors
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Courses List */}
      <Card>
        <CardHeader>
          <CardTitle>Department Courses</CardTitle>
          <CardDescription>{stats.coursesCount} active courses</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.courses.length > 0 ? (
            <div className="space-y-2">
              {stats.courses.slice(0, 10).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {course.code} - {course.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {course.units} units • {course._count.courseReviews} reviews
                    </p>
                  </div>
                  <Badge variant="outline">{course.termsOffered.join(", ")}</Badge>
                </div>
              ))}
              {stats.courses.length > 10 && (
                <Link href={`/admin/${university}/${department}/courses`}>
                  <Button variant="link" className="text-xs">
                    View all {stats.courses.length} courses →
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No courses found for this department</p>
          )}
        </CardContent>
      </Card>

      {/* Professors List */}
      <Card>
        <CardHeader>
          <CardTitle>Department Professors</CardTitle>
          <CardDescription>{stats.professorsCount} faculty members</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.professors.length > 0 ? (
            <div className="space-y-2">
              {stats.professors.slice(0, 5).map((prof) => (
                <div
                  key={prof.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{prof.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {prof.department.name} • {prof._count.reviews} reviews
                    </p>
                  </div>
                </div>
              ))}
              {stats.professors.length > 5 && (
                <Link href={`/admin/${university}/${department}/professors`}>
                  <Button variant="link" className="text-xs">
                    View all {stats.professors.length} professors →
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No professors found for this department</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
