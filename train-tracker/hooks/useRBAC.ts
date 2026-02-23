/**
 * Client-Side RBAC Hook
 * Provides role and permission checking in React components
 */

'use client';

import React, { useMemo } from 'react';
import {
  Role,
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleAtLeast,
  getRolePermissions,
} from '@/lib/rbac-config';

/**
 * User with role information
 */
export interface RBACUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
}

/**
 * RBAC Hook return value
 */
export interface UseRBACReturn {
  user: RBACUser | null;
  role: Role | null;
  
  // Permission checks
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  
  // Role checks
  isRole: (role: Role) => boolean;
  isAtLeast: (role: Role) => boolean;
  
  // Convenience checks
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isUser: boolean;
  isViewer: boolean;
  isGuest: boolean;
  
  // Get user's permissions
  permissions: Permission[];
  
  // Loading state
  isLoading: boolean;
}

/**
 * RBAC Hook
 * Retrieves user from context/localStorage and provides permission checking
 */
export function useRBAC(user?: RBACUser | null): UseRBACReturn {
  // If user not provided, try to get from localStorage
  const currentUser = useMemo(() => {
    if (user !== undefined) return user;
    
    if (typeof window === 'undefined') return null;
    
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        return {
          id: parsed.id,
          email: parsed.email,
          name: parsed.name || parsed.fullName,
          role: parsed.role as Role,
        };
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
    }
    
    return null;
  }, [user]);
  
  const role = currentUser?.role || null;
  const permissions = useMemo(() => {
    return role ? getRolePermissions(role) : [];
  }, [role]);
  
  // Permission checks
  const can = (permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };
  
  const canAny = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAnyPermission(role, permissions);
  };
  
  const canAll = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAllPermissions(role, permissions);
  };
  
  // Role checks
  const isRole = (checkRole: Role): boolean => {
    return role === checkRole;
  };
  
  const isAtLeast = (minRole: Role): boolean => {
    if (!role) return false;
    return isRoleAtLeast(role, minRole);
  };
  
  // Convenience role checkers
  const isSuperAdmin = role === Role.SUPER_ADMIN;
  const isAdmin = role === Role.ADMIN || isSuperAdmin;
  const isEditor = role === Role.EDITOR || isAdmin;
  const isUser = role === Role.USER || isEditor;
  const isViewer = role === Role.VIEWER;
  const isGuest = role === Role.GUEST;
  
  return {
    user: currentUser,
    role,
    can,
    canAny,
    canAll,
    isRole,
    isAtLeast,
    isSuperAdmin,
    isAdmin,
    isEditor,
    isUser,
    isViewer,
    isGuest,
    permissions,
    isLoading: false, // Could be enhanced with actual loading state
  };
}

/**
 * Protected Component Wrapper
 * Only renders children if user has required permission
 */
export interface ProtectedProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true with permissions[], requires all permissions
  role?: Role;
  fallback?: React.ReactNode;
}

export function Protected({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  fallback = null,
}: ProtectedProps) {
  const rbac = useRBAC();
  
  // Check permission
  if (permission && !rbac.can(permission)) {
    return fallback as React.ReactElement;
  }
  
  // Check multiple permissions
  if (permissions) {
    const hasAccess = requireAll
      ? rbac.canAll(permissions)
      : rbac.canAny(permissions);
    
    if (!hasAccess) {
      return fallback as React.ReactElement;
    }
  }
  
  // Check role
  if (role && !rbac.isAtLeast(role)) {
    return fallback as React.ReactElement;
  }
  
  return children as React.ReactElement;
}
