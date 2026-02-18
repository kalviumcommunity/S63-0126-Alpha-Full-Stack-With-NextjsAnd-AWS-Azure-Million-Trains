import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { successResponse, unauthorizedResponse } from "../../../lib/api-response";

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
      return unauthorizedResponse("Admin access required");
    }

    // Fetch admin statistics
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: "admin" } });
    const totalContactRequests = await prisma.contactRequest.count();
    const totalAuditEvents = await prisma.auditEvent.count();

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
    console.error("Admin route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "E500" },
        message: "Internal server error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promote-user
 * Promote a user to admin role (admin only)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") {
      return unauthorizedResponse("Admin access required");
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "E400" },
          message: "userId is required"
        },
        { status: 400 }
      );
    }

    // Promote user to admin
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: "admin" },
      select: { id: true, email: true, fullName: true, role: true }
    });

    return successResponse(
      updatedUser,
      "User promoted to admin successfully"
    );
  } catch (error) {
    console.error("Promote user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "E500" },
        message: "Failed to promote user"
      },
      { status: 500 }
    );
  }
}
