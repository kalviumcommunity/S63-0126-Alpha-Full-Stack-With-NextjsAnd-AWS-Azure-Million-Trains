import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
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

    // Fetch complete user data from database
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true }
    });

    if (!user) {
      return unauthorizedResponse("User not found");
    }

    // Return protected user data including role
    return successResponse(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt
      },
      "Profile retrieved successfully"
    );
  } catch (error) {
    console.error("Profile error:", error);
    return unauthorizedResponse("Failed to verify token");
  }
}
