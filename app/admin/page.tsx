import { getSession } from "@/lib/auth";
import { getUserWithAssignments } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconSchool } from "@tabler/icons-react";
import { UserRole } from "@prisma/client";

export default async function AdminRootPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await getUserWithAssignments(session.user.id);
  if (!user) {
    redirect("/login");
  }

  // ADMIN users → redirect to their assigned university
  if (user.role === UserRole.ADMIN && user.assignedUniversity?.code) {
    redirect(`/admin/${user.assignedUniversity.code.toLowerCase()}`);
  }

  // COORDINATOR users → redirect to their assigned department
  if (
    user.role === UserRole.COORDINATOR &&
    user.assignedUniversity?.code &&
    user.assignedDepartment?.name
  ) {
    redirect(
      `/admin/${user.assignedUniversity.code.toLowerCase()}/${encodeURIComponent(
        user.assignedDepartment.name
      )}`
    );
  }

  // SUPER_ADMIN → show university selection
  const universities = [
    { code: "SMU", name: "Singapore Management University" },
    { code: "NUS", name: "National University of Singapore" },
    { code: "NTU", name: "Nanyang Technological University" },
    { code: "SUTD", name: "Singapore University of Technology and Design" },
    { code: "SUSS", name: "Singapore University of Social Sciences" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Administration</h1>
          <p className="text-muted-foreground">
            Select a university to manage
          </p>
        </div>
      </div>

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
                  Click to manage this university
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Platform-wide administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline">
            <IconSchool className="mr-2 h-4 w-4" />
            Manage Universities
          </Button>
          <Button variant="outline">View All Users</Button>
          <Button variant="outline">System Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
