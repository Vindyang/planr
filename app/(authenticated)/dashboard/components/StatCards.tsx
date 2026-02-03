
import { Student } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconAward, IconBook, IconSchool } from "@tabler/icons-react";

export function StatCards({ student, totalUnits }: { student: Student; totalUnits: number }) {

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card border border-border shadow-none rounded-none p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
          <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">GPA</CardTitle>
          <IconAward className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-2xl font-serif italic text-foreground">{student.gpa.toFixed(2)}</div>
           <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">Cumulative</p>
        </CardContent>
      </Card>
      <Card className="bg-card border border-border shadow-none rounded-none p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
          <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Units Earned</CardTitle>
          <IconBook className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-2xl font-serif italic text-foreground">{totalUnits}</div>
           <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">Units earned</p>
        </CardContent>
      </Card>
        <Card className="bg-card border border-border shadow-none rounded-none p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
          <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Year</CardTitle>
          <IconSchool className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-2xl font-serif italic text-foreground">Year {student.year}</div>
           <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">{student.major}</p>
        </CardContent>
      </Card>
    </div>
  );
}
