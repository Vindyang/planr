"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { IconAlertTriangle } from "@tabler/icons-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Planner error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <IconAlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        We encountered an error while loading the planner. Please try again.
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  )
}
