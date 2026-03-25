
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconAward, IconBook, IconSchool, IconCalendar, IconCheck, IconTarget } from "@tabler/icons-react";

type StatCardsProps = {
  gpa: number
  unitsEarned: number
  year: number
  major: string
  nextSemesterCourses: number
  nextTermLabel: string
  totalCoursesTaken: number
  remainingUnits: number
}

export function StatCards({
  gpa,
  unitsEarned,
  year,
  major,
  nextSemesterCourses,
  nextTermLabel,
  totalCoursesTaken,
  remainingUnits,
}: StatCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* GPA */}
      <Card className="bg-card border border-border shadow-none rounded-none p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
          <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">GPA</CardTitle>
          <IconAward className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-2xl font-serif italic text-foreground">{gpa.toFixed(2)}</div>
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">Cumulative</p>
        </CardContent>
      </Card>

      {/* Units Earned */}
      <Card className="bg-card border border-border shadow-none rounded-none p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
          <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Units Earned</CardTitle>
          <IconBook className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-2xl font-serif italic text-foreground">{unitsEarned}</div>
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">Units completed</p>
        </CardContent>
      </Card>

      {/* Year */}
      <Card className="bg-card border border-border shadow-none rounded-none p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
          <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Year</CardTitle>
          <IconSchool className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-2xl font-serif italic text-foreground">Year {year}</div>
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">{major}</p>
        </CardContent>
      </Card>

      {/* Next Semester Courses */}
      <Card className="bg-card border border-border shadow-none rounded-none p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
          <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Upcoming Term</CardTitle>
          <IconCalendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-2xl font-serif italic text-foreground">{nextSemesterCourses}</div>
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">
            {nextTermLabel} planned
          </p>
        </CardContent>
      </Card>

      {/* Total Courses Taken */}
      <Card className="bg-card border border-border shadow-none rounded-none p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
          <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Courses Taken</CardTitle>
          <IconCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-2xl font-serif italic text-foreground">{totalCoursesTaken}</div>
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">Total completed</p>
        </CardContent>
      </Card>

      {/* Remaining Units */}
      <Card className="bg-card border border-border shadow-none rounded-none p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
          <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Units Remaining</CardTitle>
          <IconTarget className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-2xl font-serif italic text-foreground">{remainingUnits}</div>
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-1">To graduation</p>
        </CardContent>
      </Card>
    </div>
  );
}
