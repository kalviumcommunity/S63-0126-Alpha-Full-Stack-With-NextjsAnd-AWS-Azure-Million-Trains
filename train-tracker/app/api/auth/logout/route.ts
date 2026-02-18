import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../lib/auth-cookie";
import { successResponse } from "../../../../lib/api-response";

export const runtime = "nodejs";

/**
 * POST /api/auth/logout
 * Clears the session cookie and logs out the user
 * Returns: { success: true, message: "Logged out successfully" }
 */
export async function POST(): Promise<NextResponse> {
  const response = successResponse(null, "Logged out successfully");
  clearSessionCookie(response);
  return response;
}

