import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { createdResponse, errorResponse, internalErrorResponse } from "../../../../lib/api-response";
import { ERROR_CODES } from "../../../../lib/error-codes";
import { signupSchema } from "../../../../lib/validation-schemas";
import { parseAndValidateBody } from "../../../../lib/validation-helpers";

export const runtime = "nodejs";

/**
 * POST /api/auth/signup
 * Create a new user account with Zod validation
 * 
 * Request: { fullName: string, email: string, password: string }
 * Success (201): { success: true, data: { id, email, fullName }, timestamp }
 * Error (400): { success: false, error: { code: "E001" }, validationErrors, timestamp }
 * Error (409): { success: false, error: { code: "E409" }, timestamp }
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Validate request body with Zod schema
    const validatedData = await parseAndValidateBody(request, signupSchema);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return errorResponse(
        "An account with that email already exists",
        409,
        ERROR_CODES.RESOURCE_EXISTS
      );
    }

    // Hash password and create user
    const hashedPassword = await hash(validatedData.password, 10);

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: validatedData.fullName,
          email: validatedData.email,
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
    
    // If error is already a NextResponse (validation error), return it
    if (error instanceof NextResponse) {
      return error;
    }
    
    return internalErrorResponse("Failed to sign up. Please try again.");
  }
}
