import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { generateToken } from "../../../../lib/jwt-utils";
import { unauthorizedResponse, successResponse, internalErrorResponse } from "../../../../lib/api-response";
import { ERROR_CODES } from "../../../../lib/error-codes";
import { loginSchema } from "../../../../lib/validation-schemas";
import { parseAndValidateBody } from "../../../../lib/validation-helpers";

export const runtime = "nodejs";
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
 * 
 * Request: { email: string, password: string }
 * Success (200): { success: true, data: { id, email }, timestamp }
 * Error (401): { success: false, error: { code: "E401"|"E011" }, timestamp }
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Validate request body with Zod schema
    const validatedData = await parseAndValidateBody(request, loginSchema);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true, email: true, password: true, fullName: true, role: true }
    });

    if (!user) {
      return unauthorizedResponse("Invalid email or password");
    }

    // Verify password
    const passwordMatches = await compare(validatedData.password, user.password);

    if (!passwordMatches) {
      return unauthorizedResponse("Invalid email or password");
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
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
}

