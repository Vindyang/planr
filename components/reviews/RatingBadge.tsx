"use client"

interface RatingBadgeProps {
  label: string
  value: number
}

export function RatingBadge({ label, value }: RatingBadgeProps) {
  const color =
    value <= 2
      ? "text-green-700 bg-green-50 border-green-200"
      : value <= 3
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200"

  return (
    <span className={`text-[0.65rem] uppercase tracking-wider px-2 py-0.5 border ${color}`}>
      {label}: {value}/5
    </span>
  )
}
