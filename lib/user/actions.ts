"use server"

import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import type { ChecklistKey } from "@/components/tutorial/checklistTracking"

export async function markWelcomeAsSeen() {
  const session = await requireSession()
  
  await prisma.user.update({
    where: { id: session.user.id },
    data: { isFirstLogin: false },
  })
}

export async function updateOnboardingStatus(key: ChecklistKey | "DISMISSED", value: boolean) {
  const session = await requireSession()
  
  // We need to fetch the user first to merge the JSON object
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStatus: true },
  })
  
  if (!user) throw new Error("User not found")
    
  const currentStatus = (user.onboardingStatus as Record<string, boolean>) || {}
  
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingStatus: {
        ...currentStatus,
        [key]: value,
      },
      // Since they are engaging with the checklist, also mark Welcome as seen just in case
      isFirstLogin: false,
    },
  })
}
