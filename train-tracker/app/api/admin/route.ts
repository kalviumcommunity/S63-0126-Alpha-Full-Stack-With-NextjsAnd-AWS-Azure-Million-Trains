import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { successResponse } from "../../../lib/api-response";
import { handleError, handlePermissionError, handleDatabaseError } from "../../../lib/error-handler";
import { logger } from "../../../lib/logger";
import { invalidateUserCache } from "../../../lib/cache-invalidation";

export const runtime = "nodejs";

/**
 * GET /api/admin
 * Admin-only endpoint that requires valid JWT with admin role
 * 
 * Headers: Authorization: Bearer <admin_jwt_token>
 * Success (200): { success: true, data: { adminStats }, timestamp }
 * Error (403): { success: false, error: { code: "E403" }, message: "Admin access required", timestamp }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Middleware already validated token and role
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || userRole !== "admin") {
      logger.warn("Unauthorized admin access attempt", { userId, userRole });
      return handlePermissionError("Admin access required", {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        userId
      });
    }

    // Fetch admin statistics
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: "admin" } });
    const totalContactRequests = await prisma.contactRequest.count();
    const totalAuditEvents = await prisma.auditEvent.count();

    logger.info("Admin dashboard accessed", { userId, timestamp: new Date().toISOString() });

    return successResponse(
      {
        stats: {
          totalUsers,
          adminUsers,
          regularUsers: totalUsers - adminUsers,
          totalContactRequests,
          totalAuditEvents
        },
        timestamp: new Date().toISOString()
      },
      "Admin dashboard data retrieved successfully"
    );
  } catch (error) {
    logger.error("Admin GET route error", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null
    });
    return handleDatabaseError(error, {
      context: "GET /api/admin",
      endpoint: request.nextUrl.pathname,
      method: request.method
    });
  }
}

/**
 * POST /api/admin/promote-user
 * Promote a user to admin role (admin only)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");

    if (userRole !== "admin") {
      logger.warn("Unauthorized admin action attempt", { userId, action: "promote-user" });
      return handlePermissionError("Admin access required", {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        userId
      });
    }

    const body = await request.json();
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return handleError(
        new Error("userId is required"),
        {
          context: "POST /api/admin/promote-user - Missing userId",
          endpoint: request.nextUrl.pathname,
          method: request.method,
          userId
        }
      );
    }

    // Promote user to admin
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: "admin" },
      select: { id: true, email: true, fullName: true, role: true }
    });

    // Invalidate user caches after role change
    await invalidateUserCache.specificUser(targetUserId);
    await invalidateUserCache.allUsersList();
    await invalidateUserCache.userStats();

    logger.info("User promoted to admin", {
      adminId: userId,
      promotedUserId: targetUserId,
      userEmail: updatedUser.email,
      timestamp: new Date().toISOString()
    });

    return successResponse(
      updatedUser,
      "User promoted to admin successfully"
    );
  } catch (error) {
    const userId = request.headers.get("x-user-id");
    logger.error("Promote user error", {
      message: error instanceof Error ? error.message : "Unknown error",
      adminId: userId
    });
    return handleDatabaseError(error, {
      context: "POST /api/admin/promote-user",
      endpoint: request.nextUrl.pathname,
      method: request.method,
      userId
    });
  }
}
