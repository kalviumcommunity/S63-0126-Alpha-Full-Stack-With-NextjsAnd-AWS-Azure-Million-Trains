/**
 * Admin Users API
 * Demonstrates RBAC with permission-based access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac-middleware';
import { Permission } from '@/lib/rbac-config';
import { prisma } from '@/lib/prisma';
import { withCORS, createOPTIONSHandler, STRICT_CORS_CONFIG } from '@/lib/cors-middleware';

/**
 * OPTIONS /api/admin/users
 * Handle CORS preflight - strict config for admin endpoints
 */
export const OPTIONS = createOPTIONSHandler(STRICT_CORS_CONFIG);

/**
 * GET /api/admin/users
 * List all users (requires USER_LIST permission)
 */
export const GET = withCORS(withPermission(Permission.USER_LIST, async (request, user) => {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;
    
    // Fetch users from database
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      meta: {
        requestedBy: user.email,
        requestedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Admin Users API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
      },
      { status: 500 }
    );
  }
}), STRICT_CORS_CONFIG);

/**
 * POST /api/admin/users
 * Create new user (requires USER_CREATE permission)
 */
export const POST = withCORS(withPermission(Permission.USER_CREATE, async (request, user) => {
  try {
    const body = await request.json();
    const { email, fullName, password, role } = body;
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
        },
        { status: 409 }
      );
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
        role: role || 'USER',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: newUser,
      meta: {
        createdBy: user.email,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Admin Users API] Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
      },
      { status: 500 }
    );
  }
}), STRICT_CORS_CONFIG);
