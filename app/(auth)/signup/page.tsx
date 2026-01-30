"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Particles } from "@/components/ui/particles"
import { signUp } from "@/lib/auth-client"
import { prisma } from "@/lib/prisma"

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
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Particles
        className="absolute inset-0"
        quantity={100}
        ease={80}
        color="#000000"
        refresh
      />
      <Card className="relative z-10 w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Planr</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">University Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="student@smu.edu.sg"
              required
            />
          </div>

          <div>
            <Label htmlFor="university">University</Label>
            <select
              id="university"
              className="w-full rounded-md border px-3 py-2"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
            >
              <option value="SMU">Singapore Management University</option>
              <option value="NUS">National University of Singapore</option>
              <option value="NTU">Nanyang Technological University</option>
              <option value="SUTD">Singapore University of Technology and Design</option>
              <option value="SUSS">Singapore University of Social Sciences</option>
            </select>
          </div>

          <div>
            <Label htmlFor="major">Major</Label>
            <Input
              id="major"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              placeholder="Computer Science"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Current Year</Label>
              <select
                id="year"
                className="w-full rounded-md border px-3 py-2"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
            </div>

            <div>
              <Label htmlFor="enrollmentYear">Enrollment Year</Label>
              <Input
                id="enrollmentYear"
                type="number"
                value={formData.enrollmentYear}
                onChange={(e) => setFormData({ ...formData, enrollmentYear: parseInt(e.target.value) })}
                min={2020}
                max={2030}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              minLength={8}
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
