/**
 * RBAC Middleware for Next.js API Routes
 * Enforces role-based access control at the API level
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt-utils';
import {
  Role,
  Permission,
  hasPermission,
  hasAnyPermission,
  isRoleAtLeast,
  evaluatePolicy,
  PolicyEvaluation,
} from './rbac-config';
import { logger } from './logger';

/**
 * Authenticated user from JWT
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
}

/**
 * RBAC check result
 */
export interface RBACCheckResult {
  authorized: boolean;
  user?: AuthenticatedUser;
  evaluation?: PolicyEvaluation;
  error?: string;
}

/**
 * Extract and verify user from request
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      
      if (!payload) {
        return null;
      }
      
      return {
        id: payload.id,
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role as Role,
      };
    }
    
    // Try access token cookie
    const accessToken = request.cookies.get('accessToken')?.value;
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      
      if (!payload) {
        return null;
      }
      
      return {
        id: payload.id,
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role as Role,
      };
    }
    
    return null;
  } catch (error) {
    logger.warn('Failed to extract user from request', { error });
    return null;
  }
}

/**
 * Require authentication (any logged-in user)
 */
export async function requireAuth(request: NextRequest): Promise<RBACCheckResult> {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    logger.info('[RBAC] Authentication required but no user found', {
      path: request.nextUrl.pathname,
    });
    
    return {
      authorized: false,
      error: 'Authentication required',
    };
  }
  
  logger.info('[RBAC] User authenticated', {
    userId: user.id,
    role: user.role,
    path: request.nextUrl.pathname,
  });
  
  return {
    authorized: true,
    user,
  };
}

/**
 * Require specific role (or higher in hierarchy)
 */
export async function requireRole(
  request: NextRequest,
  requiredRole: Role
): Promise<RBACCheckResult> {
  const authResult = await requireAuth(request);
  
  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }
  
  const user = authResult.user;
  const allowed = isRoleAtLeast(user.role, requiredRole);
  
  const logData = {
    userId: user.id,
    userRole: user.role,
    requiredRole,
    path: request.nextUrl.pathname,
    allowed,
  };
  
  if (allowed) {
    logger.info('[RBAC] Role check PASSED', logData);
  } else {
    logger.warn('[RBAC] Role check FAILED - Insufficient privileges', logData);
  }
  
  return {
    authorized: allowed,
    user,
    error: allowed ? undefined : `Role ${requiredRole} or higher required`,
  };
}

/**
 * Require specific permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<RBACCheckResult> {
  const authResult = await requireAuth(request);
  
  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }
  
  const user = authResult.user;
  const allowed = hasPermission(user.role, permission);
  
  const evaluation = evaluatePolicy(user.role, request.nextUrl.pathname, permission);
  
  const logData = {
    userId: user.id,
    userRole: user.role,
    permission,
    path: request.nextUrl.pathname,
    allowed,
    reason: evaluation.reason,
  };
  
  if (allowed) {
    logger.info('[RBAC] Permission check PASSED', logData);
  } else {
    logger.warn('[RBAC] Permission check FAILED - Insufficient permissions', logData);
  }
  
  return {
    authorized: allowed,
    user,
    evaluation,
    error: allowed ? undefined : `Permission ${permission} required`,
  };
}

/**
 * Require ANY of the specified permissions
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissions: Permission[]
): Promise<RBACCheckResult> {
  const authResult = await requireAuth(request);
  
  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }
  
  const user = authResult.user;
  const allowed = hasAnyPermission(user.role, permissions);
  
  const logData = {
    userId: user.id,
    userRole: user.role,
    permissions,
    path: request.nextUrl.pathname,
    allowed,
  };
  
  if (allowed) {
    logger.info('[RBAC] Any-permission check PASSED', logData);
  } else {
    logger.warn('[RBAC] Any-permission check FAILED', logData);
  }
  
  return {
    authorized: allowed,
    user,
    error: allowed ? undefined : `One of [${permissions.join(', ')}] required`,
  };
}

/**
 * Create 403 Forbidden response
 */
export function forbiddenResponse(message: string = 'Access denied'): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: 'FORBIDDEN',
      success: false,
    },
    { status: 403 }
  );
}

/**
 * Create 401 Unauthorized response
 */
export function unauthorizedResponse(message: string = 'Authentication required'): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: 'UNAUTHORIZED',
      success: false,
    },
    { status: 401 }
  );
}

/**
 * Wrapper for API routes with role protection
 * Usage: export const GET = withRole(Role.ADMIN, handler);
 */
export function withRole(
  requiredRole: Role,
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const rbacCheck = await requireRole(request, requiredRole);
    
    if (!rbacCheck.authorized) {
      if (!rbacCheck.user) {
        return unauthorizedResponse(rbacCheck.error);
      }
      return forbiddenResponse(rbacCheck.error);
    }
    
    return handler(request, rbacCheck.user!);
  };
}

/**
 * Wrapper for API routes with permission protection
 * Usage: export const GET = withPermission(Permission.USER_READ, handler);
 */
export function withPermission(
  permission: Permission,
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const rbacCheck = await requirePermission(request, permission);
    
    if (!rbacCheck.authorized) {
      if (!rbacCheck.user) {
        return unauthorizedResponse(rbacCheck.error);
      }
      return forbiddenResponse(rbacCheck.error);
    }
    
    return handler(request, rbacCheck.user!);
  };
}

/**
 * Wrapper for API routes requiring authentication only
 * Usage: export const GET = withAuth(handler);
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const rbacCheck = await requireAuth(request);
    
    if (!rbacCheck.authorized || !rbacCheck.user) {
      return unauthorizedResponse(rbacCheck.error);
    }
    
    return handler(request, rbacCheck.user);
  };
}
