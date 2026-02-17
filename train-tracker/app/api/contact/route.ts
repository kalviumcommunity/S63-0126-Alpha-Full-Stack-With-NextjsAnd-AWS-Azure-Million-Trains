import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

type ContactPayload = {
  category?: string;
  hasTicket?: boolean;
  referenceCode?: string | null;
  message?: string;
  attachmentUrl?: string | null;
  fullName?: string;
  email?: string;
};

function isValidEmail(value: string): boolean {
  return /.+@.+\..+/.test(value);
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: ContactPayload = await request.json();

    if (!body.category || typeof body.category !== "string") {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    if (typeof body.hasTicket !== "boolean") {
      return NextResponse.json({ error: "hasTicket must be a boolean" }, { status: 400 });
    }

    if (body.hasTicket && !body.referenceCode) {
      return NextResponse.json(
        { error: "referenceCode is required when hasTicket is true" },
        { status: 400 }
      );
    }

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    if (!body.fullName || typeof body.fullName !== "string") {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }

    if (!body.email || typeof body.email !== "string" || !isValidEmail(body.email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.contactRequest.create({
        data: {
          category: body.category.trim(),
          hasTicket: body.hasTicket,
          referenceCode: body.hasTicket ? body.referenceCode?.trim() ?? null : null,
          message: body.message.trim(),
          attachmentUrl: body.attachmentUrl?.trim() ?? null,
          fullName: body.fullName.trim(),
          email: body.email.trim().toLowerCase()
        }
      });

      await tx.auditEvent.create({
        data: {
          eventType: "contact_request_created",
          entityType: "ContactRequest",
          entityId: created.id,
          meta: {
            category: created.category,
            hasTicket: created.hasTicket,
            email: created.email
          }
        }
      });

      return created;
    });

    return NextResponse.json({ id: record.id, message: "Request received" }, { status: 201 });
  } catch (error) {
    console.error("Contact submit error", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
