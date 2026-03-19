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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 pb-8 border-b border-border mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
              {departmentDecoded} Department
            </h1>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mt-2">
              {universityUpper} • Department Administration
            </p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card border border-border shadow-none rounded-none p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Courses</CardTitle>
            <IconBook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-serif italic text-foreground">{stats.coursesCount}</div>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
              Active courses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-none rounded-none p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Professors</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-serif italic text-foreground">{stats.professorsCount}</div>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
              Teaching faculty
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-none rounded-none p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Reviews</CardTitle>
            <IconStar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-serif italic text-foreground">{stats.reviewsCount}</div>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
              Student feedback
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 pt-4">
        {/* Quick Actions */}
        <Card className="bg-card border border-border shadow-none rounded-none p-6 h-fit">
          <CardHeader className="p-0 mb-6 border-b border-border pb-4">
            <CardTitle className="text-2xl font-serif italic text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground mt-2">Manage {departmentDecoded} department resources</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex flex-wrap gap-4 pt-2">
            <Link href={`/admin/${university}/${department}/courses`}>
              <Button variant="outline" className="rounded-none border-border font-serif italic text-sm px-6 h-10 w-full sm:w-auto hover:bg-accent">
                <IconBook className="mr-2 h-4 w-4" />
                Manage Courses
              </Button>
            </Link>
            <Link href={`/admin/${university}/${department}/professors`}>
              <Button variant="outline" className="rounded-none border-border font-serif italic text-sm px-6 h-10 w-full sm:w-auto hover:bg-accent">
                <IconUser className="mr-2 h-4 w-4" />
                Manage Professors
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Courses List */}
        <Card className="bg-card border border-border shadow-none rounded-none p-6 h-fit">
          <CardHeader className="p-0 mb-6 border-b border-border pb-4">
            <CardTitle className="text-2xl font-serif italic text-foreground">Department Courses</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground mt-2">{stats.coursesCount} active courses</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {stats.courses.length > 0 ? (
              <div className="space-y-4 pt-2">
                {stats.courses.slice(0, 10).map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 gap-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-serif text-foreground">
                        {course.code} - {course.title}
                      </p>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
                        {course.units} units • {course._count.courseReviews} reviews
                      </p>
                    </div>
                    <span className="inline-block px-2 py-0.5 text-[0.65rem] uppercase tracking-wider font-medium border border-border bg-secondary text-secondary-foreground">
                      {course.termsOffered.join(", ")}
                    </span>
                  </div>
                ))}
                {stats.courses.length > 10 && (
                  <Link href={`/admin/${university}/${department}/courses`}>
                    <Button variant="link" className="text-xs uppercase tracking-wider font-medium mt-2 p-0 text-muted-foreground hover:text-foreground">
                      View all {stats.courses.length} courses →
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground pt-2">No courses found for this department</p>
            )}
          </CardContent>
        </Card>

        {/* Professors List */}
        <Card className="bg-card border border-border shadow-none rounded-none p-6 h-fit">
          <CardHeader className="p-0 mb-6 border-b border-border pb-4">
            <CardTitle className="text-2xl font-serif italic text-foreground">Department Professors</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground mt-2">{stats.professorsCount} faculty members</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {stats.professors.length > 0 ? (
              <div className="space-y-4 pt-2">
                {stats.professors.slice(0, 5).map((prof) => (
                  <div
                    key={prof.id}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-serif text-foreground">{prof.name}</p>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
                        {prof.department.name} • {prof._count.reviews} reviews
                      </p>
                    </div>
                  </div>
                ))}
                {stats.professors.length > 5 && (
                  <Link href={`/admin/${university}/${department}/professors`}>
                    <Button variant="link" className="text-xs uppercase tracking-wider font-medium mt-2 p-0 text-muted-foreground hover:text-foreground">
                      View all {stats.professors.length} professors →
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground pt-2">No professors found for this department</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
