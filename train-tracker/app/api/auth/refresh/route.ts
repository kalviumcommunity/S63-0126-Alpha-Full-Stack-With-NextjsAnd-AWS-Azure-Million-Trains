/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * 
 * Uses HTTP-only cookie to retrieve refresh token securely
 * Issues new access token if refresh token is valid
 * 
 * Request: Refresh token in HTTP-only cookie
 * Success (200): { success: true, data: { accessToken, user }, message }
 * Error (401): { success: false, error: { code: "E401", message }, timestamp }
 */

import { NextResponse } from "next/server";
import { 
  verifyRefreshToken, 
  generateAccessToken,
  JWTPayload 
} from "@/lib/jwt-utils";
import { 
  getRefreshTokenCookie,
  setAccessTokenCookie 
} from "@/lib/token-storage";
import { isTokenBlacklisted } from "@/lib/token-blacklist";
import { 
  successResponse, 
  unauthorizedResponse 
} from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Get refresh token from HTTP-only cookie
    const refreshToken = await getRefreshTokenCookie();
    
    if (!refreshToken) {
      return unauthorizedResponse("No refresh token provided. Please login again.");
    }
    
    // Check if token is blacklisted (user logged out)
    if (isTokenBlacklisted(refreshToken)) {
      return unauthorizedResponse("Token has been revoked. Please login again.");
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return unauthorizedResponse("Invalid or expired refresh token. Please login again.");
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      fullName: decoded.fullName,
      role: decoded.role
    });
    
    // Optionally set the new access token in cookie
    // Or return it for client to store in memory
    await setAccessTokenCookie(accessToken);
    
    return successResponse(
      {
        accessToken,
        user: {
          id: decoded.id,
          email: decoded.email,
          fullName: decoded.fullName,
          role: decoded.role
        }
      },
      "Access token refreshed successfully"
    );
    
  } catch (error) {
    console.error("Token refresh error:", error);
    return unauthorizedResponse("Failed to refresh token. Please login again.");
  }
}
