import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { validationErrorResponse, createdResponse, errorResponse, internalErrorResponse } from "../../../../lib/api-response";

export const runtime = "nodejs";

/**
 * POST /api/auth/signup
 * Create a new user account
 * Body: { fullName: string, email: string, password: string }
 * Returns: { success: true, message: "Account created", data: { id, email, fullName } }
 */
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
      return errorResponse("An account with that email already exists", 409);
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
    console.error("Signup error:", error);
    return internalErrorResponse("Failed to sign up. Please try again.");
  }
}
