import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

interface JWTPayload {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTES = [
  /^\/api\/admin/,
  /^\/api\/users\/profile/,
  /^\/api\/users\/settings/
];

/**
 * Routes that require admin role
 */
const ADMIN_ROUTES = [
  /^\/api\/admin/
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some(route => route.test(pathname));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Extract token from Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "E401" },
        message: "Missing authorization header"
      },
      { status: 401 }
    );
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return NextResponse.json(
      {
        success: false,
        error: { code: "E401" },
        message: "Invalid authorization header format. Use: Bearer <token>"
      },
      { status: 401 }
    );
  }

  const token = parts[1];

  // Verify JWT token
  let decoded: JWTPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    const message = error instanceof jwt.TokenExpiredError
      ? "Token has expired"
      : "Invalid or malformed token";

    return NextResponse.json(
      {
        success: false,
        error: { code: "E401" },
        message
      },
      { status: 401 }
    );
  }

  // Check role for admin routes
  const isAdminRoute = ADMIN_ROUTES.some(route => route.test(pathname));
  if (isAdminRoute && decoded.role !== "admin") {
    return NextResponse.json(
      {
        success: false,
        error: { code: "E403" },
        message: "Forbidden. Admin access required."
      },
      { status: 403 }
    );
  }

  // Attach user info to headers for access in route handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", decoded.id);
  requestHeaders.set("x-user-email", decoded.email);
  requestHeaders.set("x-user-role", decoded.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)"
  ]
};
