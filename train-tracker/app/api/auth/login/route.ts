import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { generateTokenPair } from "../../../../lib/jwt-utils";
import { setRefreshTokenCookie, setAccessTokenCookie } from "../../../../lib/token-storage";
import { unauthorizedResponse, successResponse, internalErrorResponse } from "../../../../lib/api-response";
import { ERROR_CODES } from "../../../../lib/error-codes";
import { loginSchema } from "../../../../lib/validation-schemas";
import { parseAndValidateBody } from "../../../../lib/validation-helpers";
import { withCORS, createOPTIONSHandler, STRICT_CORS_CONFIG } from "../../../../lib/cors-middleware";

export const runtime = "nodejs";

/**
 * OPTIONS /api/auth/login
 * Handle CORS preflight - strict config for auth endpoints
 */
export const OPTIONS = createOPTIONSHandler(STRICT_CORS_CONFIG);

function mapPrismaError(error: unknown): { status: number; error: string } {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 503,
      error:
        "Database connection failed. Ensure Supabase is reachable and DATABASE_URL is correct."
    };
  }

  return { status: 500, error: "Failed to log in." };
}

/**
 * POST /api/auth/login
 * Authenticate user with email and password (Zod validated)
 * Issues access token + refresh token
 * 
 * Request: { email: string, password: string }
 * Success (200): { 
 *   success: true, 
 *   data: { 
 *     id, 
 *     email, 
 *     fullName, 
 *     role, 
 *     accessToken 
 *   }, 
 *   message, 
 *   timestamp 
 * }
 * Refresh token stored in HTTP-only cookie
 * Error (401): { success: false, error: { code: "E401"|"E011" }, timestamp }
 */
export const POST = withCORS(async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Validate request body with Zod schema
    const validatedData = await parseAndValidateBody(request, loginSchema);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true, email: true, password: true, fullName: true, role: true }
    });token pair (access + refresh)
    const { accessToken, refreshToken } = generateTokenPair({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    });

    // Store refresh token in HTTP-only cookie (secure)
    await setRefreshTokenCookie(refreshToken);
    
    // Optionally store access token in cookie too
    // Or return it for client-side memory storage
    await setAccessTokenCookie(accessToken);

    // Return access token and user data (refresh token is in cookie)
    const response = successResponse(
      { 
        id: user.id, 
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        accessToken // Client can store in memory or SWR.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    });

    // Return token and user data
    const response = successResponse(
      { 
        id: user.id, 
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        token 
      },
      "Login successful"
    );
    
    return response;
  } catch (error) {
    console.error("Login error:", error);
    
    // If error is already a NextResponse (validation error), return it
    if (error instanceof NextResponse) {
      return error;
    }
    
    const mapped = mapPrismaError(error);
    return internalErrorResponse(mapped.error);
  }
}, STRICT_CORS_CONFIG);

