"use client"

import { useEffect } from "react"

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/'
      if (e.key === "/" && !isInputFocused()) {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
        searchInput?.focus()
      }

      // Close modals on 'Escape' - handled natively by radix-ui
      // This is just a placeholder for future shortcuts
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
}

function isInputFocused() {
  const activeElement = document.activeElement
  return (
    activeElement?.tagName === "INPUT" ||
    activeElement?.tagName === "TEXTAREA" ||
    activeElement?.hasAttribute("contenteditable")
  )
}
