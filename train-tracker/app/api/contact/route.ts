import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { validationErrorResponse, createdResponse, internalErrorResponse } from "../../../lib/api-response";
import { ERROR_CODES } from "../../../lib/error-codes";

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

/**
 * POST /api/contact
 * Submit a contact/support request
 * Body: {
 *   category: string (e.g., 'general', 'technical', 'billing'),
 *   hasTicket: boolean,
 *   referenceCode?: string (required if hasTicket is true),
 *   message: string,
 *   fullName: string,
 *   email: string,
 *   attachmentUrl?: string
 * }
 * Returns: { success: true, message: "Request submitted", data: { id, createdAt, ... } }
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: ContactPayload = await request.json();
    const errors: Record<string, string> = {};

    if (!body.category || typeof body.category !== "string") {
      errors.category = "Category is required";
    }

    if (typeof body.hasTicket !== "boolean") {
      errors.hasTicket = "hasTicket must be a boolean value";
    }

    if (body.hasTicket && !body.referenceCode) {
      errors.referenceCode = "Reference code is required when hasTicket is true";
    }

    if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
      errors.message = "Message is required";
    }

    if (!body.fullName || typeof body.fullName !== "string" || body.fullName.trim().length === 0) {
      errors.fullName = "Full name is required";
    }

    if (!body.email || typeof body.email !== "string" || !isValidEmail(body.email)) {
      errors.email = "Valid email address is required";
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
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

    return createdResponse(record, "Contact request submitted successfully");
  } catch (error) {
    console.error("Contact request error:", error);
    return internalErrorResponse("Failed to submit contact request. Please try again.");
  }
}

