import { NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "../../../../lib/jwt-utils";
import { unauthorizedResponse, successResponse } from "../../../../lib/api-response";

export const runtime = "nodejs";

/**
 * GET /api/auth/profile
 * Protected route that requires valid JWT token
 * 
 * Headers: Authorization: Bearer <jwt_token>
 * Success (200): { success: true, data: { id, email, fullName }, timestamp }
 * Error (401): { success: false, error: { code: "E401" }, timestamp }
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = extractTokenFromHeader(authHeader || "");

    if (!token) {
      return unauthorizedResponse("Missing or invalid authorization header");
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return unauthorizedResponse("Invalid or expired token");
    }

    // Return protected user data
    return successResponse(
      {
        id: payload.id,
        email: payload.email,
        fullName: payload.fullName
      },
      "Profile retrieved successfully"
    );
  } catch (error) {
    console.error("Profile error:", error);
    return unauthorizedResponse("Failed to verify token");
  }
}
