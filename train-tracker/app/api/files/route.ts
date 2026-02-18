import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { successResponse } from "../../../lib/api-response";
import { handleAuthError, handleValidationError, handleDatabaseError } from "../../../lib/error-handler";
import { logger } from "../../../lib/logger";
import { s3Utils } from "../../../lib/s3";
import { cacheUtils, cacheKeys } from "../../../lib/redis";

export const runtime = "nodejs";

/**
 * GET /api/files
 * List all files uploaded by the authenticated user
 * 
 * Query Parameters:
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 * - category: string (optional, filter by category)
 * 
 * Success (200): 
 * {
 *   "success": true,
 *   "data": {
 *     "files": [...],
 *     "pagination": { "total": 50, "limit": 20, "offset": 0, "hasMore": true }
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      logger.warn("Files list accessed without authentication");
      return handleAuthError("Authentication required", {
        endpoint: request.nextUrl.pathname
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const category = searchParams.get("category");

    logger.debug("Fetching user files", { userId, limit, offset, category });

    // Try cache first
    const cacheKey = `files:user:${userId}:limit:${limit}:offset:${offset}`;
    const cached = await cacheUtils.get(cacheKey);
    if (cached) {
      logger.info("Files list retrieved from cache", { userId });
      return successResponse(cached, "Files retrieved successfully");
    }

    // Build where clause
    const where: any = { uploadedBy: userId };
    if (category) {
      where.categories = { has: category };
    }

    // Fetch files
    const files = await prisma.file.findMany({
      where,
      select: {
        id: true,
        originalName: true,
        fileSize: true,
        mimeType: true,
        s3Key: true,
        categories: true,
        tags: true,
        isPublic: true,
        uploadedAt: true
      },
      take: limit,
      skip: offset,
      orderBy: { uploadedAt: "desc" }
    });

    const total = await prisma.file.count({ where });

    const response = {
      files,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };

    // Cache for 5 minutes
    await cacheUtils.set(cacheKey, response, 300);

    logger.info("User files retrieved", {
      userId,
      count: files.length,
      total
    });

    return successResponse(response, "Files retrieved successfully");
  } catch (error) {
    const userId = request.headers.get("x-user-id");
    logger.error("Files list error", {
      userId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return handleDatabaseError(error, {
      context: "GET /api/files",
      endpoint: request.nextUrl.pathname,
      method: request.method,
      userId: userId || undefined
    });
  }
}

/**
 * POST /api/files
 * Store file metadata after successful S3 upload
 * 
 * Request body:
 * {
 *   "originalName": "profile.jpg",
 *   "fileKey": "avatars/user-123/profile-1707987654321.jpg",
 *   "fileSize": 1024,
 *   "mimeType": "image/jpeg",
 *   "categories": ["avatar"],
 *   "isPublic": true
 * }
 * 
 * Success (201):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "file-123",
 *     "originalName": "profile.jpg",
 *     "s3Key": "avatars/user-123/profile-1707987654321.jpg",
 *     "s3Url": "https://bucket.s3.amazonaws.com/...",
 *     "fileSize": 1024,
 *     "uploadedAt": "2024-02-18T10:00:00Z"
 *   }
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      logger.warn("File storage attempted without authentication");
      return handleAuthError("Authentication required", {
        endpoint: request.nextUrl.pathname
      });
    }

    const body = await request.json();
    const {
      originalName,
      fileKey,
      fileSize,
      mimeType,
      categories = [],
      tags = [],
      isPublic = false,
      checksum
    } = body;

    // Validate required fields
    if (!originalName || !fileKey || !fileSize || !mimeType) {
      logger.warn("File metadata validation failed", { userId, body });
      return handleValidationError(
        "Missing required fields",
        {
          requiredFields: ["originalName", "fileKey", "fileSize", "mimeType"]
        },
        { endpoint: request.nextUrl.pathname, userId }
      );
    }

    logger.debug("Storing file metadata", {
      userId,
      originalName,
      fileKey,
      fileSize
    });

    // Generate download URL if public or for later use
    const downloadUrl = isPublic
      ? s3Utils.getPublicUrl(fileKey)
      : null;

    // Create file record
    const file = await prisma.file.create({
      data: {
        originalName,
        s3Key: fileKey,
        s3Url: s3Utils.getPublicUrl(fileKey),
        fileSize,
        mimeType,
        categories,
        tags,
        uploadedBy: userId,
        isPublic,
        downloadUrl,
        checksum
      },
      select: {
        id: true,
        originalName: true,
        s3Key: true,
        s3Url: true,
        fileSize: true,
        mimeType: true,
        categories: true,
        isPublic: true,
        uploadedAt: true
      }
    });

    // Invalidate user's files cache
    await cacheUtils.invalidatePattern(`files:user:${userId}:*`);

    logger.info("File metadata stored", {
      userId,
      fileId: file.id,
      originalName,
      fileKey,
      fileSize
    });

    return NextResponse.json(
      {
        success: true,
        data: file,
        message: "File metadata stored successfully"
      },
      { status: 201 }
    );
  } catch (error) {
    const userId = request.headers.get("x-user-id");
    logger.error("File storage error", {
      userId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return handleDatabaseError(error, {
      context: "POST /api/files",
      endpoint: request.nextUrl.pathname,
      method: request.method,
      userId: userId || undefined
    });
  }
}

/**
 * DELETE /api/files/[fileId]
 * Delete a file and remove from S3
 * 
 * Note: Implemented as a separate route file
 */
