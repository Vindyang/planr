export type MajorTrackOption = {
  value: string
  label: string
}

const INFORMATION_SYSTEMS_TRACKS: MajorTrackOption[] = [
  { value: "Business Analytics", label: "Business Analytics" },
  { value: "Product Development", label: "Product Development" },
  { value: "Financial Technology", label: "Financial Technology" },
  {
    value: "Smart-City Management & Technology",
    label: "Smart-City Management & Technology",
  },
]

const COMPUTER_SCIENCE_TRACKS: MajorTrackOption[] = [
  {
    value: "Frontier Artificial Intelligence",
    label: "Frontier Artificial Intelligence",
  },
  { value: "Cybersecurity", label: "Cybersecurity" },
  { value: "Software Systems", label: "Software Systems" },
  {
    value: "Frontier Artificial Intelligence and Cybersecurity",
    label: "Frontier Artificial Intelligence and Cybersecurity",
  },
  {
    value: "Frontier Artificial Intelligence and Software Systems",
    label: "Frontier Artificial Intelligence and Software Systems",
  },
  {
    value: "Cybersecurity and Software Systems",
    label: "Cybersecurity and Software Systems",
  },
]

const TECHNOLOGY_FOR_BUSINESS_SOLUTIONS_TRACKS: MajorTrackOption[] = [
  { value: "Business Analytics", label: "Business Analytics" },
  { value: "Financial Technology", label: "Financial Technology" },
  { value: "Product Development", label: "Product Development" },
  {
    value: "Smart-City Management and Technology",
    label: "Smart-City Management and Technology",
  },
]

function normalizeMajorName(majorName: string): string {
  return majorName.trim().toLowerCase()
}

export function getMajorTrackOptions(majorName?: string | null): MajorTrackOption[] {
  if (!majorName) return []

  const normalizedMajorName = normalizeMajorName(majorName)

  if (normalizedMajorName.includes("information systems")) {
    return INFORMATION_SYSTEMS_TRACKS
  }

  if (normalizedMajorName.includes("computer science")) {
    return COMPUTER_SCIENCE_TRACKS
  }

  if (
    normalizedMajorName.includes("software engineering") ||
    normalizedMajorName.includes("computing & law") ||
    normalizedMajorName.includes("computing and law")
  ) {
    return TECHNOLOGY_FOR_BUSINESS_SOLUTIONS_TRACKS
  }

  return []
}
