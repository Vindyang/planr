"use client"

import { useState } from "react"
import { IconAlertTriangle, IconX, IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { Violation, ValidationResult } from "@/lib/planner/types"

interface ValidationPanelProps {
  initialValidation: ValidationResult
  onValidate?: () => void
}

export function ValidationPanel({ initialValidation, onValidate }: ValidationPanelProps) {
  const [validation, setValidation] = useState<ValidationResult>(initialValidation)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const fetchValidation = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/planner/validate", { method: "POST" })
      if (!res.ok) throw new Error("Failed to validate plan")
      const data = await res.json()
      setValidation(data)
      onValidate?.()
    } catch (err) {
      console.error("Validation error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const errors = validation.violations.filter((v: Violation) => v.severity === "error")
  const warnings = validation.violations.filter((v: Violation) => v.severity === "warning")
  const hasIssues = errors.length > 0 || warnings.length > 0

  return (
    <div className="bg-background border border-border">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {validation.isValid ? (
            <IconCheck className="h-4 w-4 text-green-600" />
          ) : (
            <IconAlertTriangle className="h-4 w-4 text-amber-600" />
          )}
          <div className="text-left">
            <h3 className="text-[10px] uppercase tracking-widest font-semibold text-foreground">
              Plan Validation
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {validation.isValid ? (
                "No conflicts detected"
              ) : (
                <>
                  {errors.length > 0 && `${errors.length} error${errors.length > 1 ? "s" : ""}`}
                  {errors.length > 0 && warnings.length > 0 && ", "}
                  {warnings.length > 0 && `${warnings.length} warning${warnings.length > 1 ? "s" : ""}`}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              fetchValidation()
            }}
            className="text-[10px] uppercase tracking-widest font-medium px-3 py-1.5 border border-border hover:border-foreground/50 hover:bg-muted/50 transition-all rounded-sm"
          >
            {isLoading ? "Validating..." : "Refresh"}
          </button>
          {isExpanded ? (
            <IconChevronUp className="h-4 w-4 text-muted-foreground/50" />
          ) : (
            <IconChevronDown className="h-4 w-4 text-muted-foreground/50" />
          )}
        </div>
      </div>

      {/* Violations List */}
      {isExpanded && hasIssues && (
        <div className="border-t border-border p-6 space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-widest font-semibold text-red-600">
                Errors ({errors.length})
              </h4>
              <div className="space-y-3">
                {errors.map((violation: Violation, idx: number) => (
                  <ViolationItem key={idx} violation={violation} />
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-widest font-semibold text-amber-600">
                Warnings ({warnings.length})
              </h4>
              <div className="space-y-3">
                {warnings.map((violation: Violation, idx: number) => (
                  <ViolationItem key={idx} violation={violation} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {isExpanded && (
        <div className="border-t border-border p-6">
          <h4 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">
            Plan Statistics
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Total Units</p>
              <p className="text-xl font-serif italic text-foreground">{validation.statistics.totalUnits}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Total Courses</p>
              <p className="text-xl font-serif italic text-foreground">{validation.statistics.totalCourses}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ViolationItem({ violation }: { violation: Violation }) {
  const borderColor =
    violation.severity === "error"
      ? "border-red-200 bg-red-50/30"
      : "border-amber-200 bg-amber-50/30"

  const textColor =
    violation.severity === "error" ? "text-red-700" : "text-amber-700"

  return (
    <div className={`border p-3 rounded-sm ${borderColor}`}>
      <div className="flex items-start gap-3">
        {violation.severity === "error" ? (
          <IconX className="h-3.5 w-3.5 text-red-600 flex-shrink-0 mt-1" />
        ) : (
          <IconAlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-1" />
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-semibold ${textColor}`}>
              {violation.courseCode || violation.semesterLabel}
            </p>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {violation.type.replace(/_/g, " ")}
            </span>
          </div>
          <p className={`text-xs ${textColor}`}>{violation.message}</p>
          {violation.suggestion && (
            <p className="text-xs text-muted-foreground/80 italic pt-1">
              💡 {violation.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
