import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { validationErrorResponse, createdResponse, errorResponse, internalErrorResponse } from "../../../../lib/api-response";
import { ERROR_CODES } from "../../../../lib/error-codes";

 Transaction
export const runtime = "nodejs";

 API
/**
 * POST /api/auth/signup
 * Create a new user account
 * Body: { fullName: string, email: string, password: string }
 * Returns: { success: true, message: "Account created", data: { id, email, fullName } }
 */

function mapPrismaError(error: unknown): { status: number; error: string } {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 503,
      error:
        "Database connection failed. Ensure Supabase is reachable and DATABASE_URL is correct."
    };
  }

  return { status: 500, error: "Failed to sign up." };
}
 main

 main
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { fullName, email, password } = await request.json();

    const errors: Record<string, string> = {};

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Valid email format is required";
    }

    if (!password || typeof password !== "string" || !password.trim()) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return errorResponse(
        "An account with that email already exists",
        409,
        ERROR_CODES.RESOURCE_EXISTS
      );
    }

    const hashedPassword = await hash(password, 10);

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          password: hashedPassword
        },
        select: { id: true, email: true, fullName: true }
      });

      await tx.auditEvent.create({
        data: {
          eventType: "user_signup",
          entityType: "User",
          entityId: user.id,
          meta: {
            email: user.email
          }
        }
      });

      return user;
    });

    return createdResponse(createdUser, "Account created successfully");
  } catch (error) {
 API
    console.error("Signup error:", error);
    return internalErrorResponse("Failed to sign up. Please try again.");

    console.error("Signup error", error);
    const mapped = mapPrismaError(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
 main
  }
}
