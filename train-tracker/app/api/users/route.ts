import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { successResponse } from "../../../lib/api-response";
import { handleAuthError, handleDatabaseError } from "../../../lib/error-handler";
import { logger } from "../../../lib/logger";

export const runtime = "nodejs";

/**
 * GET /api/users
 * List all users (authenticated users only)
 * 
 * Headers: Authorization: Bearer <jwt_token>
 * Success (200): { success: true, data: { users: [...] }, timestamp }
 * Error (401): { success: false, error: { code: "E401" }, message: "Authentication required", timestamp }
 * 
 * Query Parameters:
 * - limit: number (default: 10)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Middleware already validated token
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      logger.warn("Users list accessed without authentication");
      return handleAuthError("Authentication required", {
        endpoint: request.nextUrl.pathname,
        method: request.method
      });
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    logger.debug("Fetching users list", { userId, limit, offset });

    // Fetch users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" }
    });

    const total = await prisma.user.count();

    logger.info("Users list retrieved", {
      userId,
      count: users.length,
      total,
      limit,
      offset
    });

    return successResponse(
      {
        users,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      "Users retrieved successfully"
    );
  } catch (error) {
    const userId = request.headers.get("x-user-id");
    logger.error("Users list error", {
      userId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return handleDatabaseError(error, {
      context: "GET /api/users",
      endpoint: request.nextUrl.pathname,
      method: request.method,
      userId: userId || undefined
    });
  }
}
