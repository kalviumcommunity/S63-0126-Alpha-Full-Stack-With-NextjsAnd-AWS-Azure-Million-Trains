/**
 * Admin User Management API
 * Demonstrates RBAC with different permissions for different operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac-middleware';
import { Permission, Role } from '@/lib/rbac-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/users/[id]
 * Get user details (requires USER_READ permission)
 */
export const GET = withPermission(
  Permission.USER_READ,
  async (request, user) => {
    try {
      const id = request.nextUrl.pathname.split('/').pop();
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'User ID required' },
          { status: 400 }
        );
      }
      
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: targetUser,
        meta: {
          requestedBy: user.email,
          requestedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('[Admin User API] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user' },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/admin/users/[id]
 * Update user (requires USER_UPDATE permission)
 */
export const PATCH = withPermission(
  Permission.USER_UPDATE,
  async (request, user) => {
    try {
      const id = request.nextUrl.pathname.split('/').pop();
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'User ID required' },
          { status: 400 }
        );
      }
      
      const body = await request.json();
      const { fullName, role } = body;
      
      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });
      
      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(fullName && { fullName }),
          ...(role && { role }),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          updatedAt: true,
        },
      });
      
      return NextResponse.json({
        success: true,
        data: updatedUser,
        meta: {
          updatedBy: user.email,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('[Admin User API] Error updating:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/admin/users/[id]
 * Delete user (requires USER_DELETE permission)
 */
export const DELETE = withPermission(
  Permission.USER_DELETE,
  async (request, user) => {
    try {
      const id = request.nextUrl.pathname.split('/').pop();
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'User ID required' },
          { status: 400 }
        );
      }
      
      // Prevent self-deletion
      if (user.id === id) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete your own account' },
          { status: 403 }
        );
      }
      
      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });
      
      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Delete user
      await prisma.user.delete({
        where: { id },
      });
      
      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
        meta: {
          deletedBy: user.email,
          deletedAt: new Date().toISOString(),
          deletedUserId: id,
        },
      });
    } catch (error) {
      console.error('[Admin User API] Error deleting:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  }
);
