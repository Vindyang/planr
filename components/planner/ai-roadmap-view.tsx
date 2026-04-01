"use client"

import type { AIRoadmap, AISemester, AICourse } from "@/lib/ai/types"
import type { ValidationResult } from "@/lib/planner/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AIRoadmapViewProps {
  roadmap: AIRoadmap
  validation: ValidationResult
  onApply: () => void
  onBack: () => void
  isApplying?: boolean
}

interface CourseViolation {
  severity: "error" | "warning"
  message: string
}

export function AIRoadmapView({
  roadmap,
  validation,
  onApply,
  onBack,
  isApplying = false,
}: AIRoadmapViewProps) {
  const hasErrors = validation.violations.some((v) => v.severity === "error")

  // Only show warning banner for non-unit-count warnings (hide minor unit overload warnings)
  const hasSignificantWarnings = validation.violations.some(
    (v) => v.severity === "warning" && v.type !== "OVERLOAD"
  )

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Validation Status */}
      {/* Validation Status */}
      {!validation.isValid && (
        <Card className="border-2 border-gray-900 bg-gray-100 p-4 rounded-none shadow-none">
          <div className="flex gap-3">
            <div className="text-gray-900">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 uppercase tracking-widest text-sm">Validation Issues</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-800">
                {validation.violations.map((violation, idx) => (
                  <li key={idx}>
                    [{violation.severity.toUpperCase()}] {violation.courseCode} -{" "}
                    {violation.message}
                  </li>
                ))}
              </ul>
              {hasErrors && (
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  You cannot apply this plan until all errors are resolved.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {hasSignificantWarnings && !hasErrors && (
        <Card className="border border-gray-300 bg-gray-50 p-4 rounded-none shadow-none">
          <div className="flex gap-3">
            <div className="text-gray-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold text-gray-900">Warnings</p>
              <p className="mt-1 text-gray-700">
                This plan has warnings. Hover over the warning badges on the courses below to review them.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics Summary */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900">Plan Summary</h3>
        <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Total Semesters</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {roadmap.totalSemesters}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total CU</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {roadmap.totalUnits}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Avg CU/Semester</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {validation.statistics.averageUnitsPerSemester.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <Badge
              className="mt-1"
              variant={roadmap.meetsRequirements ? "default" : "outline"}
            >
              {roadmap.meetsRequirements ? "Valid Plan" : "Validation Error"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Semester Roadmap */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Semester Roadmap</h3>
        <div className="space-y-4">
          {roadmap.semesters.map((semester, idx) => (
            <SemesterCard
              key={idx}
              semester={semester}
              semesterNumber={idx + 1}
              validation={validation}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-3 border-t pt-4">
        <Button variant="outline" onClick={onBack} disabled={isApplying}>
          Back to Preferences
        </Button>
        <Button
          onClick={() => onApply()}
          disabled={hasErrors || isApplying}
          className="min-w-[150px]"
        >
          {isApplying ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Applying...
            </span>
          ) : (
            "Apply to Planner"
          )}
        </Button>
      </div>
      </div>
    </TooltipProvider>
  )
}

function SemesterCard({
  semester,
  semesterNumber,
  validation,
}: {
  semester: AISemester
  semesterNumber: number
  validation: ValidationResult
}) {
  // Build a map of course code to violations
  const courseViolations = new Map<string, CourseViolation[]>()
  validation.violations.forEach((v) => {
    const existing = courseViolations.get(v.courseCode) || []
    existing.push({ severity: v.severity, message: v.message })
    courseViolations.set(v.courseCode, existing)
  })

  return (
    <Card className="overflow-hidden">
      {/* Semester Header */}
      <div className="border-b bg-gray-50 px-4 py-3">    
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-gray-900">
              Semester {semesterNumber}: {semester.term} {semester.year}
            </h4>
            <p className="mt-1 text-sm text-gray-600">{semester.reasoning}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total CU</p>
            <p className="text-lg font-bold text-gray-900">{semester.totalUnits}</p>
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="divide-y">
        {semester.courses.map((course, idx) => (
          <CourseRow
            key={idx}
            course={course}
            violations={courseViolations.get(course.code) || []}
          />
        ))}
      </div>
    </Card>
  )
}

function CourseRow({
  course,
  violations,
}: {
  course: AICourse
  violations: Array<{ severity: "error" | "warning"; message: string }>
}) {
  const hasError = violations.some((v) => v.severity === "error")
  const hasWarning = violations.some((v) => v.severity === "warning")

  return (
    <div className="px-4 py-3 hover:bg-gray-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900">
              {course.code}: {course.title}
            </p>
            <Badge variant="outline" className="text-xs">
              {course.units} CU
            </Badge>
            {hasError && (
              <Tooltip>
                <TooltipTrigger>
                  <svg
                    className="h-4 w-4 text-gray-900 cursor-help"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-gray-100 border-2 border-gray-900 text-gray-900 shadow-none rounded-none">
                  <div className="space-y-1">
                    {violations.filter(v => v.severity === "error").map((v, idx) => (
                      <p key={idx} className="text-xs font-semibold">
                        • {v.message}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            {hasWarning && !hasError && (
              <Tooltip>
                <TooltipTrigger>
                  <svg
                    className="h-4 w-4 text-gray-600 cursor-help"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-gray-900 text-white shadow-none rounded-none border-gray-900">
                  <div className="space-y-1">
                    {violations.filter(v => v.severity === "warning").map((v, idx) => (
                      <p key={idx} className="text-xs font-medium">
                        • {v.message}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">{course.reasoning}</p>
        </div>
      </div>
    </div>
  )
}
