import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token
    const { pathname } = request.nextUrl

    if (token && (pathname === "/sign-in" || pathname === "/sign-up")) {
      const target = token.role === "NGO" ? "/ngo/inbox" : "/donor/requests"
      return NextResponse.redirect(new URL(target, request.url))
    }

    if (pathname.startsWith("/donor") && token?.role !== "DONOR") {
      return NextResponse.redirect(new URL("/ngo/inbox", request.url))
    }

    if (pathname.startsWith("/ngo") && token?.role !== "NGO") {
      return NextResponse.redirect(new URL("/donor/requests", request.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl

        if (
          pathname.startsWith("/donor") ||
          pathname.startsWith("/ngo") ||
          pathname.startsWith("/track") ||
          pathname.startsWith("/notifications")
        ) {
          return Boolean(token)
        }

        return true
      },
    },
  },
)

export const config = {
  matcher: [
    "/donor/:path*",
    "/ngo/:path*",
    "/track/:path*",
    "/notifications",
    "/sign-in",
    "/sign-up",
  ],
}
