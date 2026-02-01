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
      router.refresh();
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground font-sans">
      <div 
        className="w-full max-w-md bg-card p-8 border border-border" 
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
            Academic Journey
            </p>
        </div>

        <div className="mb-8 border-b border-border pb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest">
            Login
            </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@smu.edu.sg"
                className="h-11 rounded-none border-border bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-none border-border bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            {error && (
              <div className="bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <Button
                type="submit"
                className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-xs font-bold uppercase tracking-widest"
                disabled={isLoading}
            >
                {isLoading ? "Authenticating..." : "Sign In"}
            </Button>
            
            <div className="text-center text-xs text-muted-foreground mt-4">
                <span className="italic font-serif">New to Planr?</span>{" "}
                <Link
                    href="/signup"
                    className="underline hover:text-foreground transition-colors"
                >
                    Create an account
                </Link>
            </div>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-border text-center">
             <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Test Account
             </div>
             <div className="mt-2 text-xs text-muted-foreground font-mono bg-accent/20 p-2 inline-block">
                student@smu.edu.sg / password123
             </div>
        </div>
      </div>
    </div>
  );
}
