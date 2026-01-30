import type { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./auth-constants";

function encodeSessionPayload(userId: string): string {
  return Buffer.from(
    JSON.stringify({ userId, issuedAt: Date.now() })
  ).toString("base64url");
}

export function setSessionCookie(
  response: NextResponse,
  userId: string
): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: encodeSessionPayload(userId),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0
  });
}
