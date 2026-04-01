"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { StarRating } from "@/components/reviews/StarRating"
import { ProfessorReviewCard } from "@/components/reviews/ProfessorReviewCard"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IconExternalLink, IconSearch, IconUser, IconChevronRight } from "@tabler/icons-react"
import type { ProfessorReviewData } from "@/lib/types"

interface ProfessorDirectoryItem {
  id: string
  name: string
  designation: string | null
  profileType: string
  email: string | null
  phone: string | null
  photoUrl: string | null
  profileUrl: string | null
  departmentCode: string
  reviewSummary: {
    totalReviews: number
    averageRating: number
    averageDifficulty: number
    averageWorkload: number
  }
  recentReviews: ProfessorReviewData[]
}

interface ProfessorDirectoryResponse {
  source: "database" | "unsupported_university"
  professors: ProfessorDirectoryItem[]
}

export function ProfessorsClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [source, setSource] = useState<ProfessorDirectoryResponse["source"]>("database")
  const [professors, setProfessors] = useState<ProfessorDirectoryItem[]>([])

  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        const response = await fetch("/api/professors/scis")
        if (!response.ok) {
          throw new Error("Failed to fetch professor directory")
        }

        const data: ProfessorDirectoryResponse = await response.json()
        setProfessors(data.professors)
        setSource(data.source)
      } catch {
        setProfessors([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchDirectory()
  }, [])

  const filteredProfessors = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return professors
    }

    return professors.filter((professor) => {
      const designation = professor.designation?.toLowerCase() ?? ""
      return (
        professor.name.toLowerCase().includes(query) ||
        designation.includes(query) ||
        professor.profileType.toLowerCase().includes(query)
      )
    })
  }, [professors, search])

  return (
    <div className="flex flex-col gap-8 bg-background min-h-screen -m-6 p-8 md:-m-8 md:p-10">
      <header className="flex flex-col gap-6 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
            Professors
          </h1>
          <p className="text-sm text-muted-foreground">
            Search School of Computing and Information Systems faculty and browse their reviews.
          </p>
        </div>
        <div className="flex flex-col gap-4 lg:items-end lg:text-right w-full lg:w-auto">
          <div className="hidden lg:block">
            <span className="block text-xs uppercase tracking-wider font-medium text-muted-foreground">
              SCIS Directory
            </span>
            <span className="font-serif text-lg italic text-muted-foreground">
              {filteredProfessors.length} {filteredProfessors.length === 1 ? "professor" : "professors"}
            </span>
          </div>
          <div className="relative w-full lg:w-[320px]">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search directory..."
              className="pl-10 w-full"
            />
          </div>
          <div className="block lg:hidden">
            <span className="font-serif text-sm italic text-muted-foreground">
              {filteredProfessors.length} {filteredProfessors.length === 1 ? "professor" : "professors"} found
            </span>
          </div>
        </div>
      </header>

      {source === "unsupported_university" && (
        <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
          This directory is available for SMU students only.
        </div>
      )}

      {isLoading ? (
        <div className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading SCIS professors...
        </div>
      ) : filteredProfessors.length === 0 ? (
        <div className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No professors found for your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProfessors.map((professor) => (
            <Dialog key={professor.id}>
              <DialogTrigger asChild>
                <article className="group cursor-pointer flex flex-col justify-between border border-border bg-card p-6 min-h-[200px] transition-colors hover:bg-muted/50">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {professor.profileType}
                      </span>
                      <span className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {professor.departmentCode}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-serif italic text-foreground group-hover:underline underline-offset-2">
                        {professor.name}
                      </h2>
                      {professor.designation && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {professor.designation}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-border pt-4 flex items-center justify-between">
                    {professor.reviewSummary.totalReviews > 0 ? (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-serif italic">
                          {professor.reviewSummary.averageRating.toFixed(1)}
                        </span>
                        <div>
                          <StarRating
                            value={Math.round(professor.reviewSummary.averageRating)}
                            readonly
                            size={12}
                          />
                          <p className="text-[10px] text-muted-foreground pt-0.5">
                            {professor.reviewSummary.totalReviews}{" "}
                            {professor.reviewSummary.totalReviews === 1 ? "review" : "reviews"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No reviews yet</p>
                    )}
                    
                    <IconChevronRight size={18} className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </article>
              </DialogTrigger>

              <DialogContent className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader className="pb-6 border-b border-border text-left">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {professor.profileType}
                    </span>
                    <span className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {professor.departmentCode}
                    </span>
                  </div>
                  <DialogTitle className="text-2xl font-serif italic">{professor.name}</DialogTitle>
                  <DialogDescription>{professor.designation}</DialogDescription>
                  
                  <div className="flex flex-col gap-2 pt-4 text-xs text-muted-foreground">
                    {professor.email && <span>{professor.email}</span>}
                    {professor.phone && <span>{professor.phone}</span>}
                    {professor.profileUrl && (
                      <a
                        href={professor.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 underline-offset-2 hover:underline w-fit"
                      >
                        SMU profile <IconExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </DialogHeader>

                <div className="py-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm uppercase tracking-wider font-medium text-foreground">
                      Review Summary
                    </h3>
                    <div className="border border-border p-4">
                      {professor.reviewSummary.totalReviews > 0 ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-4xl font-serif italic">
                              {professor.reviewSummary.averageRating.toFixed(1)}
                            </span>
                            <div>
                              <StarRating
                                value={Math.round(professor.reviewSummary.averageRating)}
                                readonly
                                size={16}
                              />
                              <p className="text-sm text-muted-foreground pt-1">
                                Based on {professor.reviewSummary.totalReviews}{" "}
                                {professor.reviewSummary.totalReviews === 1 ? "review" : "reviews"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-6 pt-4 border-t border-border">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Difficulty</p>
                              <p className="font-serif italic text-lg">{professor.reviewSummary.averageDifficulty.toFixed(1)}/5</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Workload</p>
                              <p className="font-serif italic text-lg">{professor.reviewSummary.averageWorkload.toFixed(1)}/5</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No rating data available.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm uppercase tracking-wider font-medium text-foreground">
                      Recent Reviews
                    </h3>
                    {professor.recentReviews.length > 0 ? (
                      <div className="grid gap-4">
                        {professor.recentReviews.map((review) => (
                          <ProfessorReviewCard key={review.id} review={{ ...review, isOwn: false }} />
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                        <IconUser size={24} className="opacity-50" />
                        <p>No student reviews submitted yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  )
}

