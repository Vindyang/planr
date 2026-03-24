"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { AIPreferencesForm } from "./ai-preferences-form"
import { AIRoadmapView } from "./ai-roadmap-view"
import type { UserPreferences, GenerateRecommendationResponse } from "@/lib/ai/types"

interface AIRecommendationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ModalStep = "preferences" | "roadmap"

export function AIRecommendationModal({
  open,
  onOpenChange,
}: AIRecommendationModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<ModalStep>("preferences")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [recommendation, setRecommendation] =
    useState<GenerateRecommendationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePreferencesSubmit = async (preferences: UserPreferences) => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate recommendations")
      }

      const data: GenerateRecommendationResponse = await response.json()
      setRecommendation(data)
      setStep("roadmap")
    } catch (err) {
      console.error("Error generating recommendations:", err)
      setError(err instanceof Error ? err.message : "Failed to generate recommendations")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApply = async () => {
    if (!recommendation) return

    setIsApplying(true)
    setError(null)

    try {
      const response = await fetch("/api/recommendations/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmap: recommendation.roadmap }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to apply recommendations")
      }

      // Success! Close modal and refresh the planner page
      onOpenChange(false)
      router.refresh()

      // Reset state for next time
      setTimeout(() => {
        setStep("preferences")
        setRecommendation(null)
        setError(null)
      }, 300)
    } catch (err) {
      console.error("Error applying recommendations:", err)
      setError(err instanceof Error ? err.message : "Failed to apply recommendations")
    } finally {
      setIsApplying(false)
    }
  }

  const handleBack = () => {
    setStep("preferences")
    setError(null)
  }

  const handleClose = () => {
    if (!isGenerating && !isApplying) {
      onOpenChange(false)
      // Reset state after closing animation
      setTimeout(() => {
        setStep("preferences")
        setRecommendation(null)
        setError(null)
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl md:max-w-6xl lg:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "preferences"
              ? "AI Course Recommendation"
              : "Your Personalized Roadmap"}
          </DialogTitle>
          <DialogDescription>
            {step === "preferences"
              ? "Tell us your preferences and we'll create an optimal course plan for you"
              : "Review your AI-generated semester plan and apply it to your planner"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Error Display */}
          {error && (
            <div className="mb-4 border-2 border-gray-900 bg-gray-100 p-4 rounded-none shadow-none">
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
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 uppercase tracking-wide text-sm">Error</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          {step === "preferences" && (
            <AIPreferencesForm
              onSubmit={handlePreferencesSubmit}
              isLoading={isGenerating}
            />
          )}

          {step === "roadmap" && recommendation && (
            <AIRoadmapView
              roadmap={recommendation.roadmap}
              validation={recommendation.validation}
              onApply={handleApply}
              onBack={handleBack}
              isApplying={isApplying}
            />
          )}

          {/* Metadata (only show in roadmap step) */}
          {step === "roadmap" && recommendation && (
            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-gray-500">
                Generated using {recommendation.metadata.model} in{" "}
                {recommendation.metadata.processingTime.toFixed(2)}s
                {recommendation.metadata.usedFallback && " (fallback mode)"}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
