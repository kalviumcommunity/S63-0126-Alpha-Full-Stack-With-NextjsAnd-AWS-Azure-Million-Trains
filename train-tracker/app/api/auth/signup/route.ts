import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";

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

    await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        password: hashedPassword
      }
    });

    return NextResponse.json({ message: "Signup successful." }, { status: 201 });
  } catch (error) {
    console.error("Signup error", error);
    return NextResponse.json({ error: "Failed to sign up." }, { status: 500 });
  }
}
