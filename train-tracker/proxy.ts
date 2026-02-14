import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "./lib/auth-constants";

const PUBLIC_PAGES = new Set([
  "/",
  "/about",
  "/contact",
  "/dashboard",
  "/faq",
  "/login",
  "/routes",
  "/signup"
]);
const AUTH_API_PREFIX = "/api/auth";

function isPublicPath(pathname: string): boolean {
  return Array.from(PUBLIC_PAGES).some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest"
  ) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const publicPath = isPublicPath(pathname);
  const isAuthApiRoute = pathname.startsWith(AUTH_API_PREFIX);
  const isApiRoute = pathname.startsWith("/api");

  if (!hasSession) {
    if (publicPath || isAuthApiRoute) {
      return NextResponse.next();
    }

    if (isApiRoute) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    const nextParam = `${pathname}${request.nextUrl.search}`;
    if (pathname !== "/login" && nextParam !== "/") {
      loginUrl.searchParams.set("next", nextParam);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && publicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)"
  ]
};
