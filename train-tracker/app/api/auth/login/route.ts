import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { setSessionCookie } from "../../../../lib/auth-cookie";
import { validationErrorResponse, unauthorizedResponse, successResponse, internalErrorResponse } from "../../../../lib/api-response";

 Transaction
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
 main

/**
 * POST /api/auth/login
 * Login with email and password
 * Body: { email: string, password: string }
 * Returns: { success: true, message: "Login successful", data: { id, email } }
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email, password } = await request.json();

    const errors: Record<string, string> = {};

    if (!email || typeof email !== "string" || !email.trim()) {
      errors.email = "Email is required";
    }

    if (!password || typeof password !== "string" || !password.trim()) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, password: true }
    });

    if (!user) {
      return unauthorizedResponse("Invalid email or password");
    }

    const passwordMatches = await compare(password, user.password);

    if (!passwordMatches) {
      return unauthorizedResponse("Invalid email or password");
    }

    const response = successResponse(
      { id: user.id, email: user.email },
      "Login successful"
    );
    setSessionCookie(response, user.id);
    return response;
  } catch (error) {
 API
    console.error("Login error:", error);
    return internalErrorResponse("Failed to login. Please try again.");

    console.error("Login error", error);
    const mapped = mapPrismaError(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
 main
  }
}

