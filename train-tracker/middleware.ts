import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Middleware for handling route protection and authentication
 * This runs before every request to check authentication status
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes - accessible to everyone
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/about",
    "/contact",
    "/faq",
    "/routes",
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
  
  // Allow public routes and API routes (handled separately)
  if (isPublicRoute || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Protected routes require authentication
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/users")) {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      // Redirect to login with return URL
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify JWT token
      jwt.verify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      // Invalid token - redirect to login
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
