import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";

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

  return { status: 500, error: "Failed to sign up." };
}
 main

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { fullName, email, password } = await request.json();

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !fullName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      return NextResponse.json(
        { error: "fullName, email, and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          password: hashedPassword
        }
      });

      await tx.auditEvent.create({
        data: {
          eventType: "user_signup",
          entityType: "User",
          entityId: createdUser.id,
          meta: {
            email: createdUser.email
          }
        }
      });
    });

    return NextResponse.json({ message: "Signup successful." }, { status: 201 });
  } catch (error) {
    console.error("Signup error", error);
    const mapped = mapPrismaError(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
