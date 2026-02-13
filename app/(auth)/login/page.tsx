"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError("Invalid email or password");
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F1ED] p-4 text-[#0A0A0A] font-sans">
      <div 
        className="w-full max-w-md bg-white p-8 border border-[#DAD6CF]" 
      >
        <div className="mb-10 text-center">
             <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 bg-black rounded-t-full mb-1" />
                <h1 className="text-3xl font-serif font-medium italic tracking-tight text-[#0A0A0A]">
                    Planr.
                </h1>
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#666460]">
                Academic Journey
            </p>
        </div>

        <div className="mb-8 border-b border-[#DAD6CF] pb-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0A0A0A]">
            Login
            </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#666460]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@smu.edu.sg"
                className="h-11 rounded-none border-[#DAD6CF] bg-transparent focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black placeholder:text-[#666460]/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#666460]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-none border-[#DAD6CF] bg-transparent focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black placeholder:text-[#666460]/50"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 p-3 text-xs text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <Button
                type="submit"
                className="w-full rounded-none bg-black text-white hover:bg-black/80 h-12 text-xs font-bold uppercase tracking-[0.15em] transition-all"
                disabled={isLoading}
            >
                {isLoading ? "Authenticating..." : "Sign In"}
            </Button>
            
            <div className="text-center text-xs text-[#666460] mt-6">
                <span className="italic font-serif">New to Planr?</span>{" "}
                <Link
                    href="/signup"
                    className="underline hover:text-[#0A0A0A] transition-colors decoration-[#DAD6CF] underline-offset-4"
                >
                    Create an account
                </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
