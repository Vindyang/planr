import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedPaths = ["/dashboard", "/student", "/courses", "/planner"]
const authPaths = ["/login", "/signup"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedPath = protectedPaths.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  )

  const isAuthPath = authPaths.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  )

  // Check for Better Auth session cookie
  const sessionToken = request.cookies.get("better-auth.session_token")?.value

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedPath && !sessionToken) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthPath && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/student/:path*",
    "/courses/:path*",
    "/planner/:path*",
    "/login",
    "/signup",
  ],
}
