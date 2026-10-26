import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import { getRoleHomePath } from "@/lib/auth/roles";

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token;
    const { pathname } = request.nextUrl;

    if (token && (pathname === "/sign-in" || pathname === "/sign-up")) {
      const target = getRoleHomePath(
        token.role as "DONOR" | "NGO" | "VOLUNTEER" | undefined,
      ) ?? "/home";
      return NextResponse.redirect(new URL(target, request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;

        if (
          pathname.startsWith("/donor") ||
          pathname.startsWith("/ngo") ||
          pathname.startsWith("/volunteer") ||
          pathname.startsWith("/track") ||
          pathname.startsWith("/notifications")
        ) {
          return Boolean(token);
        }

        return true;
      },
    },
  },
);

export const config = {
  matcher: [
    "/donor/:path*",
    "/ngo/:path*",
    "/volunteer/:path*",
    "/track/:path*",
    "/notifications",
    "/sign-in",
    "/sign-up",
  ],
};
