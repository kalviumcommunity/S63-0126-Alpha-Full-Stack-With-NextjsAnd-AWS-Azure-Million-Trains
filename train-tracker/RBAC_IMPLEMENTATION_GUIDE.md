# Role-Based Access Control (RBAC) Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Role Hierarchy](#role-hierarchy)
3. [Permission System](#permission-system)
4. [Implementation](#implementation)
5. [API Protection](#api-protection)
6. [UI Component Protection](#ui-component-protection)
7. [Audit Logging](#audit-logging)
8. [Testing Guide](#testing-guide)
9. [Security Best Practices](#security-best-practices)

---

## 🎯 Overview

This application implements a comprehensive **Role-Based Access Control (RBAC)** system that assigns permissions to users based on their role rather than their individual identity. RBAC provides:

- **Security**: Enforce access restrictions at both API and UI levels
- **Auditability**: Track all access decisions with detailed logging
- **Scalability**: Easy to add new roles and permissions
- **Maintainability**: Clear separation between roles and business logic

### Key Principles

1. **Deny by Default**: Access is denied unless explicitly granted
2. **Server-Side Enforcement**: All security checks happen on the server
3. **Client-Side Enhancement**: UI adapts based on permissions for better UX
4. **Comprehensive Logging**: Every access decision is logged for auditing

---

## 🎭 Role Hierarchy

### Role Definitions

| Role | Hierarchy Level | Description |
|------|----------------|-------------|
| **SUPER_ADMIN** | 100 | Full system access, can manage all users and settings |
| **ADMIN** | 80 | Administrative access, can manage users and content |
| **EDITOR** | 60 | Can create and edit content, limited user management |
| **USER** | 40 | Standard user access, can view and interact with content |
| **VIEWER** | 20 | Read-only access to public content |
| **GUEST** | 0 | Limited public access |

### Role Hierarchy Rules

```typescript
// Higher number = more privilege
// Roles inherit permissions from lower roles within limits

SUPER_ADMIN > ADMIN > EDITOR > USER > VIEWER > GUEST
```

**Example**: An ADMIN can do everything an EDITOR can do, plus additional admin-specific tasks.

---

## 🔑 Permission System

### Permission Categories

#### User Management
- `USER_CREATE` - Create new users
- `USER_READ` - View user details
- `USER_UPDATE` - Update user information
- `USER_DELETE` - Delete users
- `USER_LIST` - List all users

#### Train Data
- `TRAIN_CREATE` - Create train records
- `TRAIN_READ` - View train information
- `TRAIN_UPDATE` - Update train data
- `TRAIN_DELETE` - Delete train records

#### Contact Requests
- `CONTACT_READ` - View contact submissions
- `CONTACT_UPDATE` - Update contact status
- `CONTACT_DELETE` - Delete contact requests

#### Admin Functions
- `AUDIT_VIEW` - View audit logs
- `SETTINGS_MANAGE` - Manage system settings
- `ROLE_ASSIGN` - Assign roles to users

#### API Access
- `API_ADMIN` - Access admin-level API endpoints
- `API_USER` - Access user-level API endpoints

### Role-Permission Matrix

| Role | User Mgmt | Train Data | Contact | Admin | API |
|------|-----------|------------|---------|-------|-----|
| **SUPER_ADMIN** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ Admin + User |
| **ADMIN** | 📖 Read/Update | ✅ All | ✅ All | 📖 Audit View | ✅ Admin + User |
| **EDITOR** | 📖 Read | 📖 Read/Update | 📖 Read/Update | ❌ None | ✅ User |
| **USER** | 📖 Read | 📖 Read | 📖 Read | ❌ None | ✅ User |
| **VIEWER** | ❌ None | 📖 Read | ❌ None | ❌ None | ✅ User |
| **GUEST** | ❌ None | 📖 Read | ❌ None | ❌ None | ❌ None |

---

## 🛠️ Implementation

### File Structure

```
lib/
├── rbac-config.ts        # Role and permission definitions
├── rbac-middleware.ts    # API route protection middleware
└── jwt-utils.ts          # JWT includes role in payload

hooks/
└── useRBAC.ts           # Client-side permission checking

app/api/admin/
├── users/
│   ├── route.ts         # List/Create users (permission-protected)
│   └── [id]/route.ts    # Get/Update/Delete user (permission-protected)

components/
└── RBACDemo.tsx         # Interactive RBAC demonstration

app/rbac-demo/
└── page.tsx            # RBAC demo page
```

### Core Configuration (lib/rbac-config.ts)

```typescript
// Permission enum
export enum Permission {
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  // ... more permissions
}

// Role enum
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  // ... more roles
}

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    // All permissions
  ],
  [Role.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    // Admin permissions
  ],
  // ... more role mappings
};

// Check if role has permission
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
```

---

## 🔒 API Protection

### Method 1: withPermission Wrapper

**Best for**: Specific permission requirements

```typescript
// app/api/admin/users/route.ts
import { withPermission } from '@/lib/rbac-middleware';
import { Permission } from '@/lib/rbac-config';

export const GET = withPermission(
  Permission.USER_LIST,
  async (request, user) => {
    // User has USER_LIST permission
    // Proceed with fetching users
    
    const users = await prisma.user.findMany();
    
    return NextResponse.json({
      success: true,
      data: users,
      meta: {
        requestedBy: user.email, // User info available
      },
    });
  }
);
```

### Method 2: withRole Wrapper

**Best for**: Role-based requirements

```typescript
// app/api/admin/settings/route.ts
import { withRole } from '@/lib/rbac-middleware';
import { Role } from '@/lib/rbac-config';

export const POST = withRole(Role.ADMIN, async (request, user) => {
  // Only ADMIN or higher can access
  // Update settings logic
});
```

### Method 3: Manual Check

**Best for**: Complex authorization logic

```typescript
import { requirePermission, forbiddenResponse } from '@/lib/rbac-middleware';

export async function DELETE(request: NextRequest) {
  // Check permission
  const rbacCheck = await requirePermission(request, Permission.USER_DELETE);
  
  if (!rbacCheck.authorized) {
    return forbiddenResponse(rbacCheck.error);
  }
  
  const user = rbacCheck.user!;
  
  // Additional business logic
  const targetUserId = getIdFromUrl(request.url);
  
  // Prevent self-deletion
  if (user.id === targetUserId) {
    return forbiddenResponse('Cannot delete your own account');
  }
  
  // Proceed with deletion
  await prisma.user.delete({ where: { id: targetUserId } });
  
  return NextResponse.json({ success: true });
}
```

### Response Codes

| Status | Meaning | When to Use |
|--------|---------|-------------|
| **401 Unauthorized** | Not authenticated | No valid token found |
| **403 Forbidden** | Not authorized | Token valid but insufficient permissions |
| **200 OK** | Success | Permission granted, operation successful |

---

## 🎨 UI Component Protection

### Method 1: Protected Component Wrapper

```typescript
import { Protected } from '@/hooks/useRBAC';
import { Permission, Role } from '@/lib/rbac-config';

export default function UserManagement() {
  return (
    <div>
      {/* Everyone sees this */}
      <button>View Users</button>
      
      {/* Only users with TRAIN_UPDATE permission */}
      <Protected permission={Permission.TRAIN_UPDATE}>
        <button>Edit Train</button>
      </Protected>
      
      {/* Only admins */}
      <Protected role={Role.ADMIN}>
        <button>Admin Settings</button>
      </Protected>
      
      {/* Fallback for unauthorized users */}
      <Protected 
        permission={Permission.USER_DELETE}
        fallback={<span>You don't have delete permission</span>}
      >
        <button>Delete User</button>
      </Protected>
    </div>
  );
}
```

### Method 2: useRBAC Hook

```typescript
'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { Permission, Role } from '@/lib/rbac-config';

export default function Dashboard() {
  const rbac = useRBAC();
  
  // Check permissions
  const canCreateUsers = rbac.can(Permission.USER_CREATE);
  const canDeleteUsers = rbac.can(Permission.USER_DELETE);
  
  // Check roles
  const isAdmin = rbac.isAdmin;
  const isSuperAdmin = rbac.isSuperAdmin;
  
  return (
    <div>
      <h1>Welcome, {rbac.user?.name}</h1>
      <p>Your role: {rbac.role}</p>
      
      {canCreateUsers && (
        <button onClick={handleCreateUser}>Create User</button>
      )}
      
      {isAdmin && (
        <div>
          <h2>Admin Panel</h2>
          {/* Admin-only content */}
        </div>
      )}
      
      {isSuperAdmin && (
        <button>Super Admin Controls</button>
      )}
    </div>
  );
}
```

### Method 3: Conditional Rendering Patterns

```typescript
const rbac = useRBAC();

// Simple boolean check
{rbac.isAdmin && <AdminPanel />}

// Multiple permissions (any)
{rbac.canAny([Permission.USER_UPDATE, Permission.USER_DELETE]) && (
  <UserActions />
)}

// Multiple permissions (all)
{rbac.canAll([Permission.AUDIT_VIEW, Permission.SETTINGS_MANAGE]) && (
  <SystemSettings />
)}

// Role hierarchy check
{rbac.isAtLeast(Role.EDITOR) && (
  <EditButton />
)}
```

---

## 📊 Audit Logging

### Automatic Logging

All RBAC checks are automatically logged using the logger utility:

```typescript
// Permission check PASSED
logger.info('[RBAC] Permission check PASSED', {
  userId: user.id,
  userRole: user.role,
  permission: Permission.USER_CREATE,
  path: '/api/admin/users',
  allowed: true,
  timestamp: new Date().toISOString(),
});

// Permission check FAILED
logger.warn('[RBAC] Permission check FAILED', {
  userId: user.id,
  userRole: user.role,
  permission: Permission.USER_DELETE,
  path: '/api/admin/users/123',
  allowed: false,
  reason: 'Role USER lacks permission USER_DELETE',
  timestamp: new Date().toISOString(),
});
```

### Log Structure

Every RBAC log includes:

- **userId**: Who attempted the action
- **userRole**: Their current role
- **permission/role**: What was required
- **path**: Which resource was accessed
- **allowed**: Whether access was granted
- **reason**: Why access was granted/denied
- **timestamp**: When the decision was made

### Viewing Logs

```bash
# View logs in development
npm run dev
# Check terminal output for [RBAC] entries

# In production, logs can be sent to:
# - CloudWatch (AWS)
# - Application Insights (Azure)
# - Datadog
# - Custom logging service
```

### Policy Evaluation

The system evaluates access policies and returns detailed results:

```typescript
import { evaluatePolicy, Permission, Role } from '@/lib/rbac-config';

const evaluation = evaluatePolicy(
  Role.EDITOR,
  '/api/admin/users',
  Permission.USER_DELETE
);

console.log(evaluation);
// {
//   allowed: false,
//   role: 'EDITOR',
//   resource: '/api/admin/users',
//   permission: 'USER_DELETE',
//   reason: 'Role EDITOR lacks permission USER_DELETE',
//   timestamp: Date
// }
```

---

## 🧪 Testing Guide

### Test Case 1: Admin Can List Users

**Setup**:
```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookies.txt

# Extract access token from response
```

**Test**:
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected**:
- Status: 200 OK
- Response: Array of users
- Log: `[RBAC] Permission check PASSED`

---

### Test Case 2: Regular User Cannot Delete Users

**Setup**:
```bash
# Login as regular user
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"user@example.com","password":"user123"}' \
  -c user-cookies.txt
```

**Test**:
```bash
curl -X DELETE http://localhost:3000/api/admin/users/1 \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected**:
- Status: 403 Forbidden
- Response: `{ error: 'Permission USER_DELETE required' }`
- Log: `[RBAC] Permission check FAILED - Insufficient permissions`

---

### Test Case 3: Unauthenticated Access Denied

**Test**:
```bash
curl http://localhost:3000/api/admin/users
# No Authorization header
```

**Expected**:
- Status: 401 Unauthorized
- Response: `{ error: 'Authentication required' }`
- Log: `[RBAC] Authentication required but no user found`

---

### Test Case 4: UI Component Hiding

**Setup**: Login as different roles and visit `/rbac-demo`

**Test Matrix**:

| User Role | Can See "Edit" Button | Can See "Delete" Button | Can See "Admin Panel" |
|-----------|---------------------|----------------------|---------------------|
| GUEST | ❌ | ❌ | ❌ |
| VIEWER | ❌ | ❌ | ❌ |
| USER | ❌ | ❌ | ❌ |
| EDITOR | ✅ | ❌ | ❌ |
| ADMIN | ✅ | ✅ | ✅ |
| SUPER_ADMIN | ✅ | ✅ | ✅ |

**Verification**:
1. Open browser DevTools → Elements
2. Search for button elements
3. Confirm unauthorized buttons are not in DOM (not just hidden with CSS)

---

### Test Case 5: Self-Deletion Prevention

**Test**:
```bash
# Login as user ID 5
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Try to delete self (even as admin)
curl -X DELETE http://localhost:3000/api/admin/users/5 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
- Status: 403 Forbidden
- Response: `{ error: 'Cannot delete your own account' }`
- Log: Custom business logic denial

---

## 🛡️ Security Best Practices

### 1. Never Check Permissions Only on Client

❌ **BAD**:
```typescript
// Only client-side check - INSECURE!
function DeleteButton() {
  const rbac = useRBAC();
  
  if (!rbac.can(Permission.USER_DELETE)) {
    return null; // Hide button
  }
  
  return <button onClick={deleteUser}>Delete</button>;
}
```

✅ **GOOD**:
```typescript
// Client-side UX enhancement
function DeleteButton() {
  const rbac = useRBAC();
  
  if (!rbac.can(Permission.USER_DELETE)) {
    return null;
  }
  
  return <button onClick={deleteUser}>Delete</button>;
}

// PLUS server-side enforcement
export const DELETE = withPermission(Permission.USER_DELETE, handler);
```

### 2. Store Roles Securely

✅ **Roles stored in**:
- Database (source of truth)
- JWT payload (signed and verified)
- Server-side session

❌ **Never store role decisions in**:
- localStorage (can be modified)
- URL parameters (can be manipulated)
- Client-side state only

### 3. Validate All Inputs

```typescript
// Validate role assignment
export const PATCH = withPermission(Permission.ROLE_ASSIGN, async (req, user) => {
  const { targetUserId, newRole } = await req.json();
  
  // Validate new role is valid
  if (!isValidRole(newRole)) {
    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 400 }
    );
  }
  
  // Prevent privilege escalation
  if (!isRoleAtLeast(user.role as Role, newRole as Role)) {
    return NextResponse.json(
      { error: 'Cannot assign role higher than your own' },
      { status: 403 }
    );
  }
  
  // Update user role
  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });
});
```

### 4. Log All Access Decisions

```typescript
// Always log RBAC decisions
logger.info('[RBAC] Access Decision', {
  userId: user.id,
  action: 'DELETE_USER',
  resource: `/api/admin/users/${targetId}`,
  allowed: true,
  timestamp: new Date().toISOString(),
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
});
```

### 5. Principle of Least Privilege

- Assign the minimum role required for each user
- Don't create "god mode" accounts for everyday use
- Regular audit of role assignments
- Time-limited elevated permissions when needed

### 6. Regular Permission Audits

```typescript
// Audit script example
async function auditUserPermissions() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });
  
  const report = users.map(user => ({
    email: user.email,
    role: user.role,
    permissions: getRolePermissions(user.role as Role),
    lastLogin: user.lastLoginAt,
  }));
  
  // Export to CSV or send to admins
  console.table(report);
}
```

---

## 🚀 Scalability Considerations

### Adding New Roles

```typescript
// 1. Add to Role enum
export enum Role {
  // ... existing roles
  MODERATOR = 'MODERATOR', // New role
}

// 2. Add to hierarchy
export const ROLE_HIERARCHY: Record<Role, number> = {
  // ... existing
  [Role.MODERATOR]: 50, // Between USER and EDITOR
};

// 3. Define permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // ... existing
  [Role.MODERATOR]: [
    Permission.USER_READ,
    Permission.TRAIN_UPDATE,
    Permission.CONTACT_READ,
    Permission.CONTACT_UPDATE,
  ],
};
```

### Adding New Permissions

```typescript
// 1. Add to Permission enum
export enum Permission {
  // ... existing
  REPORT_GENERATE = 'report:generate',
  REPORT_EXPORT = 'report:export',
}

// 2. Assign to roles
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // ... existing permissions
    Permission.REPORT_GENERATE,
    Permission.REPORT_EXPORT,
  ],
  [Role.EDITOR]: [
    // ... existing permissions
    Permission.REPORT_GENERATE, // Can generate but not export
  ],
};
```

### Policy-Based Access Control (Future)

For more complex scenarios, consider migrating to PBAC:

```typescript
// Future: Attribute-based policies
interface Policy {
  effect: 'allow' | 'deny';
  actions: string[];
  resources: string[];
  conditions?: {
    department?: string;
    timeRange?: { start: string; end: string };
    ipWhitelist?: string[];
  };
}

// Example: Only allow HR department to access user data on weekdays
const hrPolicy: Policy = {
  effect: 'allow',
  actions: ['user:read', 'user:update'],
  resources: ['/api/admin/users/*'],
  conditions: {
    department: 'HR',
    timeRange: { start: '09:00', end: '17:00' },
  },
};
```

---

## 📚 Additional Resources

### Code Examples

- **Live Demo**: Visit `/rbac-demo` to interact with RBAC
- **API Examples**: See `app/api/admin/users/` for protected endpoints
- **UI Examples**: See `components/RBACDemo.tsx` for UI patterns

### Further Reading

- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- [NIST RBAC Standard](https://csrc.nist.gov/projects/role-based-access-control)
- [Next.js Middleware for Auth](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**Implementation Date**: February 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Next Review**: Quarterly role audit recommended
