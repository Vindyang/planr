"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp } from "@/lib/auth-client"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "SMU",
    major: "",
    year: 1,
    enrollmentYear: new Date().getFullYear(),
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      // Sign up with Better Auth
      const result = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      })

      if (result.error) {
        setError(result.error.message || "Failed to create account")
        return
      }

      // Create student profile
      if (result.data?.user) {
        await fetch("/api/student/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: result.data.user.id,
            university: formData.university,
            major: formData.major,
            year: formData.year,
            enrollmentYear: formData.enrollmentYear,
          }),
        })
      }

      router.push("/login?registered=true")
    } catch (error) {
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground font-sans">
      <div 
        className="w-full max-w-lg bg-card p-8 border border-border" 
        style={{
            boxShadow: "4px 4px 0px rgba(0,0,0,0.05)"
        }}
      >
        <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-6 w-6 rounded-t-[50%] bg-foreground"></div>
            <h1 className="text-3xl font-serif font-medium italic tracking-tight">
            Planr.
            </h1>
            <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
            Start Your Journey
            </p>
        </div>

        <div className="mb-8 border-b border-border pb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest">
            Registration
            </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 rounded-none border-border bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Ex. Rachel Lim"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">University Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@smu.edu.sg"
                className="h-11 rounded-none border-border bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="university" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">University</Label>
                <div className="relative">
                  <select
                    id="university"
                    className="flex h-11 w-full items-center justify-between rounded-none border border-border bg-transparent px-3 py-2 text-sm shadow-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  >
                    <option value="SMU">SMU</option>
                    <option value="NUS">NUS</option>
                    <option value="NTU">NTU</option>
                    <option value="SUTD">SUTD</option>
                    <option value="SUSS">SUSS</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="major" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Major</Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="Ex. Computer Science"
                  className="h-11 rounded-none border-border bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="year" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Current Year</Label>
                <div className="relative">
                  <select
                    id="year"
                    className="flex h-11 w-full items-center justify-between rounded-none border border-border bg-transparent px-3 py-2 text-sm shadow-none focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="enrollmentYear" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Matriculation</Label>
                <Input
                  id="enrollmentYear"
                  type="number"
                  value={formData.enrollmentYear}
                  onChange={(e) => setFormData({ ...formData, enrollmentYear: parseInt(e.target.value) })}
                  min={2020}
                  max={2030}
                  className="h-11 rounded-none border-border bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={8}
                placeholder="Min 8 characters"
                className="h-11 rounded-none border-border bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className="h-11 rounded-none border-border bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {error && (
              <div className="bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-xs font-bold uppercase tracking-widest" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
            
            <div className="text-center text-xs text-muted-foreground mt-4">
                <span className="italic font-serif">Already have an account?</span>{" "}
                <Link href="/login" className="underline hover:text-foreground transition-colors">
                    Sign in
                </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
