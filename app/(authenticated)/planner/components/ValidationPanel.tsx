"use client"

import { useEffect, useState } from "react"
import { IconAlertTriangle, IconX, IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { Violation, ValidationResult } from "@/lib/planner/types"

interface ValidationPanelProps {
  onValidate?: () => void
}

export function ValidationPanel({ onValidate }: ValidationPanelProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [error, setError] = useState("")

  const fetchValidation = async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/planner/validate", { method: "POST" })
      if (!res.ok) throw new Error("Failed to validate plan")
      const data = await res.json()
      setValidation(data)
      onValidate?.()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchValidation()
  }, [])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4">
        <p className="text-red-700 text-sm">Error: {error}</p>
      </div>
    )
  }

  if (isLoading && !validation) {
    return (
      <div className="bg-card border border-border p-4">
        <p className="text-muted-foreground text-sm">Validating plan...</p>
      </div>
    )
  }

  if (!validation) return null

  const errors = validation.violations.filter((v: Violation) => v.severity === "error")
  const warnings = validation.violations.filter((v: Violation) => v.severity === "warning")
  const hasIssues = errors.length > 0 || warnings.length > 0

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {validation.isValid ? (
            <IconCheck className="h-5 w-5 text-green-600" />
          ) : (
            <IconAlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <div className="text-left">
            <h3 className="text-xs uppercase tracking-wider font-medium text-foreground">
              Plan Validation
            </h3>
            <p className="text-sm text-muted-foreground">
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
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              fetchValidation()
            }}
            className="text-xs uppercase tracking-wider px-3 py-1 border border-border hover:border-foreground transition-colors"
          >
            {isLoading ? "Validating..." : "Refresh"}
          </button>
          {isExpanded ? (
            <IconChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <IconChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Violations List */}
      {isExpanded && hasIssues && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-medium text-red-700">
                Errors ({errors.length})
              </h4>
              <div className="space-y-2">
                {errors.map((violation: Violation, idx: number) => (
                  <ViolationItem key={idx} violation={violation} />
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-medium text-amber-700">
                Warnings ({warnings.length})
              </h4>
              <div className="space-y-2">
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
        <div className="border-t border-border p-4">
          <h4 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-3">
            Plan Statistics
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Units</p>
              <p className="text-2xl font-serif italic">{validation.statistics.totalUnits}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Courses</p>
              <p className="text-2xl font-serif italic">{validation.statistics.totalCourses}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ViolationItem({ violation }: { violation: Violation }) {
  const bgColor =
    violation.severity === "error"
      ? "bg-red-50 border-red-200"
      : "bg-amber-50 border-amber-200"

  const textColor =
    violation.severity === "error" ? "text-red-700" : "text-amber-700"

  return (
    <div className={`border p-3 ${bgColor}`}>
      <div className="flex items-start gap-2">
        {violation.severity === "error" ? (
          <IconX className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
        ) : (
          <IconAlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${textColor}`}>
              {violation.courseCode || violation.semesterLabel}
            </p>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {violation.type.replace(/_/g, " ")}
            </span>
          </div>
          <p className={`text-sm ${textColor}`}>{violation.message}</p>
          {violation.suggestion && (
            <p className="text-xs text-muted-foreground italic">
              💡 {violation.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
