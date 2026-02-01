
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
    <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
      {courses.map((course) => (
        <div 
            key={course.id} 
            className="bg-card border border-border p-6 flex flex-col transition-all duration-200 hover:border-foreground hover:-translate-y-0.5 hover:shadow-md h-full"
        >
          <div className="flex justify-between mb-3">
            <span className="uppercase text-xs tracking-wider font-medium text-muted-foreground">{course.code}</span>
            <div className="flex gap-1">
                {course.tags?.slice(0, 2).map(tag => (
                   <span key={tag} className="text-[0.6rem] uppercase border border-border px-1.5 py-0.5 rounded-none">{tag}</span>
                ))}
            </div>
          </div>
          
          <h3 className="text-lg font-medium leading-tight mb-2 text-foreground font-serif">{course.title}</h3>
          
          <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-grow">
              {course.description}
          </p>
          
          <div className="mt-auto flex justify-between items-center border-t border-muted pt-4">
            <span className="bg-green-100 text-green-800 text-xs uppercase tracking-wider px-2 py-1">
              Available
            </span>
            <span className="uppercase text-[0.65rem] tracking-wider font-medium">{course.units} CU</span>
          </div>
        </div>
      ))}
    </div>
  );
}
