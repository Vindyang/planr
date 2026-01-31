
import { Student } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconAward, IconBook, IconSchool } from "@tabler/icons-react";

export function StatCards({ student }: { student: Student }) {
    const totalCredits = student.completedCourses.length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">GPA</CardTitle>
          <IconAward className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{student.gpa.toFixed(2)}</div>
           <p className="text-xs text-muted-foreground">Cumulative</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credits Earned</CardTitle>
          <IconBook className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCredits}</div>
           <p className="text-xs text-muted-foreground">Units completed</p>
        </CardContent>
      </Card>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Year</CardTitle>
          <IconSchool className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Year {student.year}</div>
           <p className="text-xs text-muted-foreground">{student.major}</p>
        </CardContent>
      </Card>
    </div>
  );
}
