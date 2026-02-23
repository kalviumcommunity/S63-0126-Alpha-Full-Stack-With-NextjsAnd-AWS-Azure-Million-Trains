import { NextResponse } from "next/server";
import { clearAuthCookies, getAuthCookies } from "../../../../lib/token-storage";
import { blacklistToken } from "../../../../lib/token-blacklist";
import { decodeTokenWithoutVerification } from "../../../../lib/jwt-utils";
import { successResponse } from "../../../../lib/api-response";

export const runtime = "nodejs";

/**
 * POST /api/auth/logout
 * Clears auth cookies and blacklists tokens to prevent reuse
 * 
 * Returns: { success: true, message: "Logged out successfully" }
 */
export async function POST(): Promise<NextResponse> {
  try {
    // Get tokens before clearing
    const { accessToken, refreshToken } = await getAuthCookies();
    
    // Blacklist tokens to prevent reuse (even if cookie is stolen)
    if (accessToken) {
      const decoded = decodeTokenWithoutVerification(accessToken);
      if (decoded?.exp) {
        blacklistToken(accessToken, decoded.exp);
      }
    }
    
    if (refreshToken) {
      const decoded = decodeTokenWithoutVerification(refreshToken);
      if (decoded?.exp) {
        blacklistToken(refreshToken, decoded.exp);
      }
    }
    
    // Clear all auth cookies
    await clearAuthCookies();
    
    return successResponse(
      null, 
      "Logged out successfully. Please login again to continue."
    );
    
  } catch (error) {
    console.error("Logout error:", error);
    // Still try to clear cookies even if blacklisting fails
    try {
      await clearAuthCookies();
    } catch (clearError) {
      console.error("Failed to clear cookies:", clearError);
    }
    
    return successResponse(null, "Logged out successfully.");
  }
}

