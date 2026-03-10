"use client"

import { useState } from "react"
import { IconAlertTriangle, IconX, IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { Violation, ValidationResult } from "@/lib/planner/types"
import { cn } from "@/lib/utils"

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
    <div className="bg-white border border-[#DAD6CF] shadow-sm">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 px-6 hover:bg-[#F9F8F6] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {validation.isValid ? (
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#0A0A0A] text-white">
                <IconCheck className="h-3 w-3" stroke={3} />
            </div>
          ) : (
             <div className="w-5 h-5 rounded-full flex items-center justify-center border border-[#DAD6CF] bg-white text-[#0A0A0A]">
                <IconAlertTriangle className="h-3 w-3" stroke={2} />
             </div>
          )}
          <div className="text-left">
            <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#0A0A0A]">
              Plan Validation
            </h3>
            <p className="text-xs text-[#666460] mt-0.5">
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
            className="text-[10px] uppercase tracking-widest font-medium px-3 py-1.5 border border-[#DAD6CF] hover:border-[#0A0A0A] hover:bg-[#F9F8F6] text-[#0A0A0A] transition-all rounded-sm"
          >
            {isLoading ? "Validating..." : "Refresh"}
          </button>
          {isExpanded ? (
            <IconChevronUp className="h-4 w-4 text-[#666460]" stroke={1.5} />
          ) : (
            <IconChevronDown className="h-4 w-4 text-[#666460]" stroke={1.5} />
          )}
        </div>
      </div>

      {/* Violations List */}
      {isExpanded && hasIssues && (
        <div className="border-t border-[#DAD6CF] p-6 space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#0A0A0A] flex items-center gap-1.5">
                <IconX className="w-3.5 h-3.5" stroke={3} />
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
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#666460] flex items-center gap-1.5">
                <IconAlertTriangle className="w-3.5 h-3.5" stroke={2} />
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
        <div className="border-t border-[#DAD6CF] p-6 bg-[#F9F8F6]">
          <h4 className="text-[10px] uppercase tracking-widest font-semibold text-[#666460] mb-4">
            Plan Statistics
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[#666460] mb-1">Total Units</p>
              <p className="text-xl font-serif italic text-[#0A0A0A]">{validation.statistics.totalUnits}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[#666460] mb-1">Total Courses</p>
              <p className="text-xl font-serif italic text-[#0A0A0A]">{validation.statistics.totalCourses}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ViolationItem({ violation }: { violation: Violation }) {
  const isError = violation.severity === "error"

  return (
    <div className="bg-white border border-[#DAD6CF] p-4 flex flex-col gap-2 relative shadow-sm">
        {/* Top Header Row with Badge */}
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <span className={cn(
                    "text-[9px] uppercase tracking-[0.15em] font-bold px-1.5 py-0.5 rounded-sm",
                    isError ? "bg-[#0A0A0A] text-white" : "bg-[#F4F1ED] text-[#0A0A0A]"
                )}>
                    {isError ? "Error" : "Warning"}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#666460]">
                  {violation.type.replace(/_/g, " ")}
                </span>
            </div>
            
            {isError ? (
                <IconX className="h-3.5 w-3.5 text-[#0A0A0A]" stroke={2.5} />
            ) : (
                <IconAlertTriangle className="h-3.5 w-3.5 text-[#666460]" stroke={2} />
            )}
        </div>

        {/* Content Body */}
        <div className="space-y-1 mt-1">
            <p className="text-sm font-semibold text-[#0A0A0A]">
              {violation.courseCode || violation.semesterLabel}
            </p>
            <p className="text-sm text-[#666460] leading-relaxed">
                {violation.message}
            </p>
        </div>

        {/* Bottom Recommendation */}
        {violation.suggestion && (
            <div className="mt-2 pt-2 border-t border-[#DAD6CF] border-dashed">
                <p className="text-[11px] text-[#0A0A0A] font-serif italic flex items-center gap-1.5">
                  <span className="not-italic">↳</span> {violation.suggestion}
                </p>
            </div>
        )}
    </div>
  )
}
