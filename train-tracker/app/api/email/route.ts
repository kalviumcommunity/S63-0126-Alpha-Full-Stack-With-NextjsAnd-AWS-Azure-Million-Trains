import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { sesUtils } from "../../../lib/ses";
import { handleAuthError, handleValidationError, handleDatabaseError } from "../../../lib/error-handler";
import { logger } from "../../../lib/logger";
import { welcomeTemplate, passwordResetTemplate, securityAlertTemplate } from "../../../lib/email-templates";

export const runtime = "nodejs";

type TemplateName = "welcome" | "password_reset" | "security_alert";

const templateMap: Record<TemplateName, (data: Record<string, string>) => string> = {
  welcome: (data) => welcomeTemplate(data.userName || "there"),
  password_reset: (data) => passwordResetTemplate(data.resetUrl || ""),
  security_alert: (data) => securityAlertTemplate(data.details || "")
};

/**
 * POST /api/email
 * Send a transactional email via AWS SES
 * 
 * Request body:
 * {
 *   "to": "user@example.com",
 *   "subject": "Welcome to Million Trains",
 *   "html": "<h2>Hello</h2>",
 *   "text": "Hello",
 *   "template": "welcome",
 *   "templateData": { "userName": "Asha" },
 *   "metadata": { "event": "signup" }
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Record<string, any> | null = null;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return handleAuthError("Authentication required", {
        endpoint: request.nextUrl.pathname
      });
    }

    body = await request.json();
    const { to, subject, html, text, template, templateData = {}, metadata = {} } = body;

    if (!to || !subject || (!html && !template)) {
      return handleValidationError(
        "Missing required fields",
        { requiredFields: ["to", "subject", "html or template"] },
        { endpoint: request.nextUrl.pathname, method: request.method, userId }
      );
    }

    let resolvedHtml = html as string | undefined;
    let templateName: TemplateName | null = null;

    if (!resolvedHtml && template) {
      if (!Object.keys(templateMap).includes(template)) {
        return handleValidationError(
          "Invalid template",
          { allowedTemplates: Object.keys(templateMap) },
          { endpoint: request.nextUrl.pathname, method: request.method, userId }
        );
      }
      templateName = template as TemplateName;
      resolvedHtml = templateMap[templateName](templateData);
    }

    if (!resolvedHtml) {
      return handleValidationError(
        "Email content is required",
        { hint: "Provide html or template" },
        { endpoint: request.nextUrl.pathname, method: request.method, userId }
      );
    }

    logger.info("Sending transactional email", {
      userId,
      to,
      subject,
      template: templateName
    });

    const messageId = await sesUtils.sendEmail({
      to,
      subject,
      html: resolvedHtml,
      text
    });

    // Store email log
    await prisma.emailLog.create({
      data: {
        provider: "AWS_SES",
        to,
        subject,
        templateName: templateName || null,
        status: "sent",
        messageId,
        metadata,
        sentBy: userId
      }
    });

    logger.info("Email sent successfully", {
      userId,
      to,
      messageId
    });

    return NextResponse.json(
      {
        success: true,
        messageId,
        provider: "AWS_SES"
      },
      { status: 200 }
    );
  } catch (error) {
    const userId = request.headers.get("x-user-id");
    logger.error("Email send failed", {
      userId,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    // Best effort logging for failed sends
    try {
      await prisma.emailLog.create({
        data: {
          provider: "AWS_SES",
          to: body?.to || "unknown",
          subject: body?.subject || "unknown",
          templateName: body?.template || null,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          sentBy: userId || "unknown"
        }
      });
    } catch (logError) {
      logger.warn("Failed to log email error", {
        message: logError instanceof Error ? logError.message : "Unknown error"
      });
    }

    return handleDatabaseError(error, {
      context: "POST /api/email",
      endpoint: request.nextUrl.pathname,
      method: request.method,
      userId: userId || undefined
    });
  }
}
