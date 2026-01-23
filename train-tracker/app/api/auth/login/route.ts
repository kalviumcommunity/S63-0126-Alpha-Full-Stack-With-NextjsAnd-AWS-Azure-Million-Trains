import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email, password } = await request.json();

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password.trim()
    ) {
      return NextResponse.json(
        { error: "email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatches = await compare(password, user.password);

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    return NextResponse.json({ message: "Login successful." });
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ error: "Failed to log in." }, { status: 500 });
  }
}
