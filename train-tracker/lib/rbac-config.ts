/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines roles, permissions, and access policies
 */

/**
 * Permission enum - atomic actions users can perform
 */
export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_LIST = 'user:list',
  
  // Train Data
  TRAIN_CREATE = 'train:create',
  TRAIN_READ = 'train:read',
  TRAIN_UPDATE = 'train:update',
  TRAIN_DELETE = 'train:delete',
  
  // Contact Requests
  CONTACT_READ = 'contact:read',
  CONTACT_UPDATE = 'contact:update',
  CONTACT_DELETE = 'contact:delete',
  
  // Admin Functions
  AUDIT_VIEW = 'audit:view',
  SETTINGS_MANAGE = 'settings:manage',
  ROLE_ASSIGN = 'role:assign',
  
  // API Access
  API_ADMIN = 'api:admin',
  API_USER = 'api:user',
}

/**
 * Role enum - user role types
 */
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER',
  VIEWER = 'VIEWER',
  GUEST = 'GUEST',
}

/**
 * Role hierarchy (higher number = more privilege)
 * Used for role comparison
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 100,
  [Role.ADMIN]: 80,
  [Role.EDITOR]: 60,
  [Role.USER]: 40,
  [Role.VIEWER]: 20,
  [Role.GUEST]: 0,
};

/**
 * Role permissions mapping
 * Each role inherits from roles below it in hierarchy
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    // All permissions
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_LIST,
    Permission.TRAIN_CREATE,
    Permission.TRAIN_READ,
    Permission.TRAIN_UPDATE,
    Permission.TRAIN_DELETE,
    Permission.CONTACT_READ,
    Permission.CONTACT_UPDATE,
    Permission.CONTACT_DELETE,
    Permission.AUDIT_VIEW,
    Permission.SETTINGS_MANAGE,
    Permission.ROLE_ASSIGN,
    Permission.API_ADMIN,
    Permission.API_USER,
  ],
  
  [Role.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_LIST,
    Permission.TRAIN_CREATE,
    Permission.TRAIN_READ,
    Permission.TRAIN_UPDATE,
    Permission.TRAIN_DELETE,
    Permission.CONTACT_READ,
    Permission.CONTACT_UPDATE,
    Permission.CONTACT_DELETE,
    Permission.AUDIT_VIEW,
    Permission.API_ADMIN,
    Permission.API_USER,
  ],
  
  [Role.EDITOR]: [
    Permission.USER_READ,
    Permission.TRAIN_READ,
    Permission.TRAIN_UPDATE,
    Permission.CONTACT_READ,
    Permission.CONTACT_UPDATE,
    Permission.API_USER,
  ],
  
  [Role.USER]: [
    Permission.USER_READ,
    Permission.TRAIN_READ,
    Permission.CONTACT_READ,
    Permission.API_USER,
  ],
  
  [Role.VIEWER]: [
    Permission.TRAIN_READ,
    Permission.API_USER,
  ],
  
  [Role.GUEST]: [
    Permission.TRAIN_READ,
  ],
};

/**
 * Resource-based permissions
 * Maps resources to required permissions
 */
export const RESOURCE_PERMISSIONS: Record<string, Permission[]> = {
  '/api/users': [Permission.USER_LIST],
  '/api/users/[id]': [Permission.USER_READ],
  '/api/users/create': [Permission.USER_CREATE],
  '/api/users/update': [Permission.USER_UPDATE],
  '/api/users/delete': [Permission.USER_DELETE],
  '/api/admin': [Permission.API_ADMIN],
  '/api/contact': [Permission.CONTACT_READ],
  '/api/audit': [Permission.AUDIT_VIEW],
};

/**
 * Route protection levels
 */
export enum ProtectionLevel {
  PUBLIC = 'PUBLIC',           // Anyone can access
  AUTHENTICATED = 'AUTHENTICATED', // Any logged-in user
  ROLE_BASED = 'ROLE_BASED',   // Specific role required
  PERMISSION_BASED = 'PERMISSION_BASED', // Specific permission required
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Compare two roles by hierarchy
 * Returns true if role1 >= role2 in hierarchy
 */
export function isRoleAtLeast(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2];
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Validate if a role is valid
 */
export function isValidRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role);
}

/**
 * Get human-readable role description
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    [Role.SUPER_ADMIN]: 'Full system access, can manage all users and settings',
    [Role.ADMIN]: 'Administrative access, can manage users and content',
    [Role.EDITOR]: 'Can create and edit content, limited user management',
    [Role.USER]: 'Standard user access, can view and interact with content',
    [Role.VIEWER]: 'Read-only access to public content',
    [Role.GUEST]: 'Limited public access',
  };
  
  return descriptions[role] || 'Unknown role';
}

/**
 * Policy evaluation result
 */
export interface PolicyEvaluation {
  allowed: boolean;
  role: Role;
  resource?: string;
  permission?: Permission;
  reason: string;
  timestamp: Date;
}

/**
 * Evaluate if user can access a resource
 */
export function evaluatePolicy(
  role: Role,
  resource: string,
  action?: Permission
): PolicyEvaluation {
  const timestamp = new Date();
  
  // Check if specific permission is required
  if (action) {
    const allowed = hasPermission(role, action);
    return {
      allowed,
      role,
      resource,
      permission: action,
      reason: allowed 
        ? `Role ${role} has permission ${action}` 
        : `Role ${role} lacks permission ${action}`,
      timestamp,
    };
  }
  
  // Check resource-based permissions
  const requiredPermissions = RESOURCE_PERMISSIONS[resource];
  if (requiredPermissions) {
    const allowed = hasAnyPermission(role, requiredPermissions);
    return {
      allowed,
      role,
      resource,
      reason: allowed
        ? `Role ${role} has required permissions for ${resource}`
        : `Role ${role} lacks required permissions for ${resource}`,
      timestamp,
    };
  }
  
  // Default: deny if no explicit permission
  return {
    allowed: false,
    role,
    resource,
    reason: `No permission mapping found for ${resource}`,
    timestamp,
  };
}
