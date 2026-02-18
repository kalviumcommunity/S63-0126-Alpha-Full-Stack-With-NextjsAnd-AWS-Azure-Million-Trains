import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { s3Utils, S3_CONFIG } from "../../../lib/s3";
import { validateFileUpload, sanitizeFileName } from "../../../lib/file-validation";
import { handleValidationError, handleDatabaseError } from "../../../lib/error-handler";
import { logger } from "../../../lib/logger";

export const runtime = "nodejs";

/**
 * POST /api/upload
 * Generate a pre-signed URL for file upload to AWS S3
 * 
 * Request body:
 * {
 *   "fileName": "profile.jpg",
 *   "fileSize": 1024,
 *   "mimeType": "image/jpeg"
 * }
 * 
 * Success (200): 
 * {
 *   "success": true,
 *   "uploadUrl": "https://bucket.s3.amazonaws.com/avatars/user-123/profile-1707987654321.jpg?...",
 *   "fileKey": "avatars/user-123/profile-1707987654321.jpg"
 * }
 * 
 * Error (400): Validation failed
 * {
 *   "success": false,
 *   "error": {
 *     "code": "E400",
 *     "message": "Invalid request. Please check your input.",
 *     "details": {
 *       "errors": [
 *         { "field": "fileSize", "message": "File size must not exceed..." }
 *       ]
 *     }
 *   }
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user from middleware
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      logger.warn("Upload attempted without authentication");
      return handleValidationError("Authentication required", {
        endpoint: request.nextUrl.pathname
      });
    }

    // Parse request body
    const body = await request.json();
    const { fileName, fileSize, mimeType, folderType = "uploads" } = body;

    logger.debug("Upload request received", {
      userId,
      fileName,
      fileSize,
      mimeType,
      folderType
    });

    // Validate file
    const validation = validateFileUpload(fileName, fileSize, mimeType);
    if (!validation.isValid) {
      logger.warn("File validation failed", {
        userId,
        fileName,
        errors: validation.errors
      });
      return handleValidationError(
        "File validation failed",
        { errors: validation.errors },
        {
          endpoint: request.nextUrl.pathname,
          method: request.method,
          userId
        }
      );
    }

    // Sanitize and generate unique file name
    const sanitized = sanitizeFileName(fileName);
    const fileKey = s3Utils.generateFilePath(userId, sanitized, folderType);

    logger.info("Generating pre-signed upload URL", {
      userId,
      fileName,
      fileKey,
      fileSize,
      mimeType
    });

    // Generate pre-signed upload URL
    const uploadUrl = await s3Utils.getUploadUrl(
      fileKey,
      mimeType,
      S3_CONFIG.UPLOAD_URL_EXPIRY
    );

    logger.info("Pre-signed URL generated successfully", {
      userId,
      fileKey,
      urlExpiresIn: S3_CONFIG.UPLOAD_URL_EXPIRY
    });

    return NextResponse.json(
      {
        success: true,
        uploadUrl,
        fileKey,
        expiresIn: S3_CONFIG.UPLOAD_URL_EXPIRY,
        message: "Pre-signed URL generated. Upload the file within 60 seconds."
      },
      { status: 200 }
    );
  } catch (error) {
    const userId = request.headers.get("x-user-id");
    logger.error("Upload URL generation failed", {
      userId,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    return handleDatabaseError(error, {
      context: "POST /api/upload",
      endpoint: request.nextUrl.pathname,
      method: request.method,
      userId: userId || undefined
    });
  }
}
