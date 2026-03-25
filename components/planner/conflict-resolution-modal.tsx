"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Conflict {
  term: string
  year: number
  existingCourseCount: number
  aiCourseCount: number
  existingCourses: Array<{ code: string; title: string }>
  aiCourses: Array<{ code: string; title: string }>
}

interface ConflictResolutionModalProps {
  open: boolean
  conflicts: Conflict[]
  onResolve: (selectedSemesters: Array<{ term: string; year: number }>) => void
  onCancel: () => void
  isApplying: boolean
}

type SemesterDecision = "replace" | "skip" | null

export function ConflictResolutionModal({
  open,
  conflicts,
  onResolve,
  onCancel,
  isApplying,
}: ConflictResolutionModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [decisions, setDecisions] = useState<Map<string, SemesterDecision>>(
    new Map()
  )

  const totalSteps = conflicts.length
  const currentConflict = conflicts[currentStep]
  const isLastStep = currentStep === totalSteps - 1
  const currentKey = currentConflict
    ? `${currentConflict.term}-${currentConflict.year}`
    : ""
  const currentDecision = decisions.get(currentKey)

  const handleDecision = (decision: SemesterDecision) => {
    const newDecisions = new Map(decisions)
    newDecisions.set(currentKey, decision)
    setDecisions(newDecisions)
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = () => {
    // Collect all semesters marked for replacement
    const semestersToReplace = Array.from(decisions.entries())
      .filter(([_, decision]) => decision === "replace")
      .map(([key, _]) => {
        const [term, year] = key.split("-")
        return { term, year: parseInt(year) }
      })

    onResolve(semestersToReplace)
  }

  const handleClose = () => {
    if (!isApplying) {
      setCurrentStep(0)
      setDecisions(new Map())
      onCancel()
    }
  }

  if (!currentConflict) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resolve Conflicts</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {totalSteps}: Decide what to do with existing courses
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm text-gray-600">
                {currentStep + 1} / {totalSteps}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / totalSteps) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Current Conflict */}
          <div className="border-2 border-gray-900 bg-gray-50 p-6 rounded-none">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {currentConflict.term} {currentConflict.year}
            </h3>

            {/* Existing Courses */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Your current plan ({currentConflict.existingCourseCount} course
                {currentConflict.existingCourseCount !== 1 ? "s" : ""}):
              </p>
              <div className="bg-white border border-gray-300 p-3 space-y-1">
                {currentConflict.existingCourses.map((course, idx) => (
                  <div key={idx} className="text-sm text-gray-800">
                    <span className="font-medium">{course.code}</span>: {course.title}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommended Courses */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                AI recommendations ({currentConflict.aiCourseCount} course
                {currentConflict.aiCourseCount !== 1 ? "s" : ""}):
              </p>
              <div className="bg-white border border-gray-300 p-3 space-y-1">
                {currentConflict.aiCourses.map((course, idx) => (
                  <div key={idx} className="text-sm text-gray-800">
                    <span className="font-medium">{course.code}</span>: {course.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Options */}
            <div className="space-y-3">
              <button
                onClick={() => handleDecision("replace")}
                className={`w-full p-4 border-2 text-left transition-colors ${
                  currentDecision === "replace"
                    ? "border-gray-900 bg-white"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-4 w-4 rounded-full border-2 border-gray-900 flex items-center justify-center flex-shrink-0">
                    {currentDecision === "replace" && (
                      <div className="h-2 w-2 rounded-full bg-gray-900" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Replace with AI recommendations
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Use the AI-recommended courses shown above
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleDecision("skip")}
                className={`w-full p-4 border-2 text-left transition-colors ${
                  currentDecision === "skip"
                    ? "border-gray-900 bg-white"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-4 w-4 rounded-full border-2 border-gray-900 flex items-center justify-center flex-shrink-0">
                    {currentDecision === "skip" && (
                      <div className="h-2 w-2 rounded-full bg-gray-900" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Keep existing courses
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Keep your current plan and skip AI recommendations for this semester
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between gap-3">
            <div>
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isApplying}
                  className="border-2 border-gray-900"
                >
                  Back
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isApplying}
                className="border-2 border-gray-900"
              >
                Cancel
              </Button>

              {!isLastStep ? (
                <Button
                  onClick={handleNext}
                  disabled={!currentDecision || isApplying}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={!currentDecision || isApplying}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  {isApplying ? "Applying..." : "Apply Changes"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
