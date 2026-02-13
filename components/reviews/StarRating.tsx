"use client"

import { useState } from "react"
import { IconStar, IconStarFilled } from "@tabler/icons-react"

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
  readonly?: boolean
}

export function StarRating({ value, onChange, size = 16, readonly = false }: StarRatingProps) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hover || value) >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`${readonly ? "cursor-default" : "cursor-pointer"} transition-colors`}
          >
            {filled ? (
              <IconStarFilled size={size} className="text-amber-400" />
            ) : (
              <IconStar size={size} className="text-muted-foreground/40" />
            )}
          </button>
        )
      })}
    </div>
  )
}
