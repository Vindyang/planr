"use client"

import { useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  userPreferencesSchema,
  type UserPreferences,
  WORKLOAD_CONFIG,
} from "@/lib/ai/types"
import { getMajorTrackOptions } from "@/lib/ai/major-tracks"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface AIPreferencesFormProps {
  onSubmit: (preferences: UserPreferences) => void
  majorName?: string | null
  isLoading?: boolean
}

export function AIPreferencesForm({
  onSubmit,
  majorName,
  isLoading = false,
}: AIPreferencesFormProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  // Default to next semester based on SMU calendar
  // Term 1 (Aug-Jan): months 7-0, Term 2 (Jan-Apr): months 0-3, Term 3 (May-Aug): months 4-7
  const defaultTerm =
    currentMonth >= 0 && currentMonth < 4 ? "Term 2" :
    currentMonth >= 4 && currentMonth < 7 ? "Term 3" : "Term 1"
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserPreferences>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      workloadLevel: "Balanced",
      startSemester: {
        term: defaultTerm,
        year: currentYear,
      },
      targetGraduation: {
        term: defaultTerm,
        year: currentYear + 4,
      },
      majorTrack: "",
      includeSummerTerm: false,
      preferredCourses: [],
      avoidCourses: [],
    },
  })

  const majorTrackOptions = getMajorTrackOptions(majorName)
  const workloadLevel = watch("workloadLevel")
  const workloadInfo = WORKLOAD_CONFIG[workloadLevel]

  // Track whether user has manually edited the graduation year
  const gradYearManuallyEdited = useRef(false)
  const startYear = watch("startSemester.year")

  // Auto-calculate graduation year = startYear + 4 (unless user manually edited)
  useEffect(() => {
    if (!gradYearManuallyEdited.current && startYear) {
      setValue("targetGraduation.year", startYear + 4)
    }
  }, [startYear, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Workload Level */}
      <div className="space-y-3">
        <Label htmlFor="workloadLevel" className="text-sm font-medium">
          Workload Preference
        </Label>
        <select
          id="workloadLevel"
          {...register("workloadLevel")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          disabled={isLoading}
        >
          <option value="Easy">Easy ({WORKLOAD_CONFIG.Easy.min}-{WORKLOAD_CONFIG.Easy.max} CU/semester)</option>
          <option value="Balanced">Balanced ({WORKLOAD_CONFIG.Balanced.min}-{WORKLOAD_CONFIG.Balanced.max} CU/semester)</option>
          <option value="Challenging">Challenging ({WORKLOAD_CONFIG.Challenging.min}-{WORKLOAD_CONFIG.Challenging.max} CU/semester)</option>
        </select>
        {workloadInfo && (
          <p className="text-xs text-gray-500">{workloadInfo.description}</p>
        )}
        {errors.workloadLevel && (
          <p className="text-xs text-red-500">{errors.workloadLevel.message}</p>
        )}
      </div>

      {/* Start Semester */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Start Planning From</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="startTerm" className="text-xs text-gray-600">
              Term
            </Label>
            <select
              id="startTerm"
              {...register("startSemester.term")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              disabled={isLoading}
            >
              <option value="Term 1">Term 1 (Aug-Jan)</option>
              <option value="Term 2">Term 2 (Jan-Apr)</option>
              <option value="Term 3">Term 3 (May-Aug)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="startYear" className="text-xs text-gray-600">
              Year
            </Label>
            <Input
              id="startYear"
              type="number"
              max={currentYear + 10}
              {...register("startSemester.year", { valueAsNumber: true })}
              className="w-full"
              disabled={isLoading}
            />
          </div>
        </div>
        {errors.startSemester && (
          <p className="text-xs text-red-500">
            {errors.startSemester.term?.message ||
              errors.startSemester.year?.message}
          </p>
        )}
        <p className="text-xs text-gray-500">
          The semester you want to start planning from (typically current or next term)
        </p>
      </div>

      {/* Target Graduation */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Target Graduation</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="endTerm" className="text-xs text-gray-600">
              Term
            </Label>
            <select
              id="endTerm"
              {...register("targetGraduation.term")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              disabled={isLoading}
            >
              <option value="Term 1">Term 1 (Aug-Jan)</option>
              <option value="Term 2">Term 2 (Jan-Apr)</option>
              <option value="Term 3">Term 3 (May-Aug)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="endYear" className="text-xs text-gray-600">
              Year
            </Label>
            <Input
              id="endYear"
              type="number"
              min={currentYear}
              max={currentYear + 10}
              {...register("targetGraduation.year", { valueAsNumber: true })}
              onChange={(e) => {
                gradYearManuallyEdited.current = true
                setValue("targetGraduation.year", Number(e.target.value))
              }}
              className="w-full"
              disabled={isLoading}
            />
          </div>
        </div>
        {errors.targetGraduation && (
          <p className="text-xs text-red-500">
            {errors.targetGraduation.term?.message ||
              errors.targetGraduation.year?.message}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Your desired graduation term (typically 4 years from enrollment)
        </p>
      </div>

      {/* Major Track (Optional) */}
      <div className="space-y-3">
        <Label htmlFor="majorTrack" className="text-sm font-medium">
          Major Track <span className="text-gray-400">(Optional)</span>
        </Label>
        <select
          id="majorTrack"
          {...register("majorTrack")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          disabled={isLoading}
        >
          <option value="">
            {majorTrackOptions.length > 0
              ? "Select a major track..."
              : "No major track options available"}
          </option>
          {majorTrackOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          Track options are based on your major and the SCIS Undergraduate Brochure 2026.
        </p>
      </div>

      {/* Include Summer Term Checkbox */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 border border-gray-300 rounded-md bg-gray-50">
          <input
            type="checkbox"
            id="includeSummerTerm"
            {...register("includeSummerTerm")}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            disabled={isLoading}
          />
          <div className="flex-1">
            <Label htmlFor="includeSummerTerm" className="text-sm font-medium cursor-pointer">
              Include Summer Term (Term 3)
            </Label>
            <p className="text-xs text-gray-600 mt-1">
              Term 3 is a special summer term (May-Aug) with limited course offerings.
              Only check this if you plan to take classes during the summer break.
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-gray-200 bg-gray-50 p-4 rounded-none shadow-none">
        <div className="flex gap-3">
          <div className="text-gray-800">
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
            <p className="font-medium text-gray-900">AI-Powered Planning</p>
            <p className="mt-1 text-gray-600">
              Our AI will analyze your completed courses, prerequisites, and preferences
              to create an optimal semester-by-semester plan to graduation.
            </p>
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? (
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
              Generating...
            </span>
          ) : (
            "Generate Roadmap"
          )}
        </Button>
      </div>
    </form>
  )
}
