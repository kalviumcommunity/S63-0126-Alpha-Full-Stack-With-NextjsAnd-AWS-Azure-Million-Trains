import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { createdResponse, internalErrorResponse } from "../../../lib/api-response";
import { ERROR_CODES } from "../../../lib/error-codes";
import { contactSchema } from "../../../lib/validation-schemas";
import { parseAndValidateBody } from "../../../lib/validation-helpers";

/**
 * POST /api/contact
 * Submit a contact/support request with Zod validation
 * 
 * Request body validated against contactSchema:
 * - category: string (required)
 * - fullName: string (required, 2-100 chars)
 * - email: string (required, valid email)
 * - hasTicket: boolean (required)
 * - referenceCode: string (required if hasTicket is true)
 * - message: string (required, 10-1000 chars)
 * - attachmentUrl: string (optional, valid URL)
 * 
 * Returns: { success: true, message: "Request submitted", data: { id, createdAt, ... } }
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Validate request body with Zod schema
    const validatedData = await parseAndValidateBody(request, contactSchema);

    // Create contact request in database
    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.contactRequest.create({
        data: {
          category: validatedData.category,
          hasTicket: validatedData.hasTicket,
          referenceCode: validatedData.hasTicket ? validatedData.referenceCode : null,
          message: validatedData.message,
          attachmentUrl: validatedData.attachmentUrl,
          fullName: validatedData.fullName,
          email: validatedData.email
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

