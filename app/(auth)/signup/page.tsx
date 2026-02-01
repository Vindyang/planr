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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F1ED] p-4 text-[#0A0A0A] font-sans">
      <div 
        className="w-full max-w-lg bg-white p-8 border border-[#DAD6CF]" 
      >
        <div className="mb-10 text-center">
            <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 bg-black rounded-t-full mb-1" />
                <h1 className="text-3xl font-serif font-medium italic tracking-tight text-[#0A0A0A]">
                    Planr.
                </h1>
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#666460]">
            Start Your Journey
            </p>
        </div>

        <div className="mb-8 border-b border-[#DAD6CF] pb-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0A0A0A]">
            Registration
            </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#666460]">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 rounded-none border-[#DAD6CF] bg-transparent focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black placeholder:text-[#666460]/50"
                placeholder="Ex. Peter Lim"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#666460]">University Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@smu.edu.sg"
                className="h-11 rounded-none border-[#DAD6CF] bg-transparent focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black placeholder:text-[#666460]/50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#666460]">University</Label>
                <div className="relative">
                  <select
                    id="university"
                    className="flex h-11 w-full items-center justify-between rounded-none border border-[#DAD6CF] bg-transparent px-3 py-2 text-sm shadow-none focus:outline-none focus:ring-1 focus:ring-black focus:border-black disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-[#0A0A0A]"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  >
                    <option value="SMU">SMU</option>
                    <option value="NUS">NUS</option>
                    <option value="NTU">NTU</option>
                    <option value="SUTD">SUTD</option>
                    <option value="SUSS">SUSS</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#666460]">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="major" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#666460]">Major</Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="Ex. Computer Science"
                  className="h-11 rounded-none border-[#DAD6CF] bg-transparent focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black placeholder:text-[#666460]/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#666460]">Current Year</Label>
                <div className="relative">
                  <select
                    id="year"
                    className="flex h-11 w-full items-center justify-between rounded-none border border-[#DAD6CF] bg-transparent px-3 py-2 text-sm shadow-none focus:outline-none focus:ring-1 focus:ring-black focus:border-black disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-[#0A0A0A]"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#666460]">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enrollmentYear" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#666460]">Matriculation</Label>
                <Input
                  id="enrollmentYear"
                  type="number"
                  value={formData.enrollmentYear}
                  onChange={(e) => setFormData({ ...formData, enrollmentYear: parseInt(e.target.value) })}
                  min={2020}
                  max={2030}
                  className="h-11 rounded-none border-[#DAD6CF] bg-transparent focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black placeholder:text-[#666460]/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#666460]">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={8}
                placeholder="Min 8 characters"
                className="h-11 rounded-none border-[#DAD6CF] bg-transparent focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black placeholder:text-[#666460]/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#666460]">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className="h-11 rounded-none border-[#DAD6CF] bg-transparent focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black placeholder:text-[#666460]/50"
                required
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {error && (
              <div className="bg-red-50 p-3 text-xs text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full rounded-none bg-black text-white hover:bg-black/80 h-12 text-xs font-bold uppercase tracking-[0.15em] transition-all" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
            
            <div className="text-center text-xs text-[#666460] mt-6">
                <span className="italic font-serif">Already have an account?</span>{" "}
                <Link href="/login" className="underline hover:text-[#0A0A0A] transition-colors decoration-[#DAD6CF] underline-offset-4">
                    Sign in
                </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
