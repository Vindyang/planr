"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconCalendarEvent, IconBook, IconMessageCircle, IconArrowRight } from "@tabler/icons-react"

import { markWelcomeAsSeen } from "@/lib/user/actions"

const features = [
  {
    icon: IconCalendarEvent,
    title: "Plan Your Semesters",
    desc: "Build your degree plan term by term, with prerequisite checking built in.",
  },
  {
    icon: IconBook,
    title: "Explore Courses",
    desc: "Browse your university's course catalog and see what you're eligible to take.",
  },
  {
    icon: IconMessageCircle,
    title: "Read Reviews",
    desc: "See ratings and workload estimates from students who've taken the course.",
  },
]

export function WelcomeModal({ isFirstLogin = false }: { isFirstLogin?: boolean }) {
  const [open, setOpen] = useState(isFirstLogin)

  useEffect(() => {
    if (isFirstLogin) {
      setOpen(true)
    }
  }, [isFirstLogin])

  const handleDismiss = async () => {
    setOpen(false)
    try {
      await markWelcomeAsSeen()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss() }}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg p-0 overflow-hidden border border-[#DAD6CF] bg-white rounded-none shadow-xl gap-0"
      >
        {/* Header */}
        <div className="bg-[#0A0A0A] px-8 py-10 text-white">
          <p className="text-xs uppercase tracking-[0.15em] font-medium text-white/50 mb-3">
            Welcome to
          </p>
          <DialogTitle className="text-4xl font-normal uppercase leading-none text-white">
            Planr<span className="font-serif italic">.</span>
          </DialogTitle>
          <p className="mt-3 text-sm text-white/60 leading-relaxed">
            Your degree planning companion. Here&apos;s what you can do.
          </p>
        </div>

        {/* Features */}
        <div className="p-8 space-y-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-4 p-4 border border-[#DAD6CF] bg-[#F4F1ED]"
            >
              <div className="w-8 h-8 shrink-0 flex items-center justify-center border border-[#DAD6CF] bg-white">
                <Icon size={16} stroke={1.5} className="text-[#0A0A0A]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0A0A0A] mb-0.5">{title}</p>
                <p className="text-xs text-[#666460] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-8 pb-8">
          <button
            onClick={handleDismiss}
            className="w-full h-11 bg-[#0A0A0A] text-white text-xs uppercase tracking-[0.1em] font-medium hover:bg-[#0A0A0A]/90 transition-colors flex items-center justify-center gap-2"
          >
            <span>Start Exploring</span>
            <IconArrowRight size={16} stroke={1.5} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
