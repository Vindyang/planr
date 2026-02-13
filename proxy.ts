import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

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

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedPath && !sessionToken) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from auth routes to dashboard,
  // but validate the session first to prevent infinite redirect loops
  // when the cookie exists but the session is expired/invalid in DB
  if (isAuthPath && sessionToken) {
    const session = await auth.api.getSession({ headers: request.headers })
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    // Session cookie is stale/expired — clear it and let user access login
    const response = NextResponse.next()
    response.cookies.delete("better-auth.session_token")
    response.cookies.delete("__Secure-better-auth.session_token")
    return response
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
