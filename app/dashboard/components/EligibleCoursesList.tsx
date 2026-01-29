
import { Course } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EligibleCoursesList({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
      return (
          <div className="text-center p-8 text-muted-foreground">
              No new eligible courses found.
          </div>
      )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card key={course.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
                 <CardTitle className="text-lg">{course.code}</CardTitle>
                 {course.tags?.map(tag => (
                     <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                 ))}
            </div>
            <CardDescription className="line-clamp-2">{course.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {course.description}
            </p>
             <div className="text-xs text-muted-foreground">
                Units: {course.units}
             </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
