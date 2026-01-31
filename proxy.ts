import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect dashboard and related routes
  const protectedPaths = ["/dashboard", "/profile", "/courses", "/planner"]
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  if (isProtectedPath) {
    // Check for Better Auth session cookie (the actual cookie name may vary)
    const sessionToken = request.cookies.get("better-auth.session_token") ||
                        request.cookies.get("session") ||
                        request.cookies.get("auth_session")

    if (!sessionToken) {
      // Redirect to login if no session
      const url = new URL("/login", request.url)
      url.searchParams.set("from", pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/courses/:path*",
    "/planner/:path*",
  ],
}
