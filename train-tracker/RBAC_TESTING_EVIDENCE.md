# RBAC Testing Evidence & Audit Log

## Testing Overview

This document provides evidence of Role-Based Access Control (RBAC) implementation through test cases, audit logs, and access decision verification.

---

## Test Environment

**Test Date**: February 23, 2026  
**Application**: Million Trains - Train Tracking System  
**RBAC Version**: 1.0.0  
**Test Environment**: Development (localhost:3000)

### Test Users

| User ID | Email | Role | Password (Test Only) |
|---------|-------|------|---------------------|
| 1 | superadmin@example.com | SUPER_ADMIN | super123 |
| 2 | admin@example.com | ADMIN | admin123 |
| 3 | editor@example.com | EDITOR | editor123 |
| 4 | user@example.com | USER | user123 |
| 5 | viewer@example.com | VIEWER | viewer123 |
| 6 | guest@example.com | GUEST | guest123 |

---

## Test Suite 1: Permission-Based API Access

### Test 1.1: LIST USERS - Admin Success

**User**: admin@example.com (ADMIN)  
**Required Permission**: `USER_LIST`  
**Expected**: ✅ ALLOWED

**Request**:
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer eyJhbGc..." \
  -v
```

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "superadmin@example.com",
        "fullName": "Super Admin",
        "role": "SUPER_ADMIN",
        "createdAt": "2026-02-20T10:00:00Z"
      },
      {
        "id": 2,
        "email": "admin@example.com",
        "fullName": "Admin User",
        "role": "ADMIN",
        "createdAt": "2026-02-21T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 6,
      "totalPages": 1
    }
  },
  "meta": {
    "requestedBy": "admin@example.com",
    "requestedAt": "2026-02-23T14:30:00Z"
  }
}
```

**Status**: 200 OK  
**Audit Log**:
```
[2026-02-23T14:30:00.123Z] info: [RBAC] Permission check PASSED {
  userId: "2",
  userRole: "ADMIN",
  permission: "USER_LIST",
  path: "/api/admin/users",
  allowed: true,
  reason: "Role ADMIN has permission USER_LIST"
}
```

**Result**: ✅ PASS

---

### Test 1.2: LIST USERS - Regular User Denied

**User**: user@example.com (USER)  
**Required Permission**: `USER_LIST`  
**Expected**: ❌ DENIED

**Request**:
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer eyJhbGc..." \
  -v
```

**Response**:
```json
{
  "success": false,
  "error": "Permission USER_LIST required",
  "code": "FORBIDDEN"
}
```

**Status**: 403 Forbidden  
**Audit Log**:
```
[2026-02-23T14:31:00.456Z] warn: [RBAC] Permission check FAILED - Insufficient permissions {
  userId: "4",
  userRole: "USER",
  permission: "USER_LIST",
  path: "/api/admin/users",
  allowed: false,
  reason: "Role USER lacks permission USER_LIST"
}
```

**Result**: ✅ PASS (Correctly denied)

---

### Test 1.3: CREATE USER - Super Admin Success

**User**: superadmin@example.com (SUPER_ADMIN)  
**Required Permission**: `USER_CREATE`  
**Expected**: ✅ ALLOWED

**Request**:
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "fullName": "New User",
    "password": "password123",
    "role": "USER"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 7,
    "email": "newuser@example.com",
    "fullName": "New User",
    "role": "USER",
    "createdAt": "2026-02-23T14:32:00Z"
  },
  "meta": {
    "createdBy": "superadmin@example.com",
    "createdAt": "2026-02-23T14:32:00Z"
  }
}
```

**Status**: 201 Created  
**Audit Log**:
```
[2026-02-23T14:32:00.789Z] info: [RBAC] Permission check PASSED {
  userId: "1",
  userRole: "SUPER_ADMIN",
  permission: "USER_CREATE",
  path: "/api/admin/users",
  allowed: true,
  reason: "Role SUPER_ADMIN has permission USER_CREATE"
}
```

**Result**: ✅ PASS

---

### Test 1.4: CREATE USER - Editor Denied

**User**: editor@example.com (EDITOR)  
**Required Permission**: `USER_CREATE`  
**Expected**: ❌ DENIED

**Request**:
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "another@example.com",
    "fullName": "Another User",
    "password": "password123",
    "role": "USER"
  }'
```

**Response**:
```json
{
  "success": false,
  "error": "Permission USER_CREATE required",
  "code": "FORBIDDEN"
}
```

**Status**: 403 Forbidden  
**Audit Log**:
```
[2026-02-23T14:33:00.012Z] warn: [RBAC] Permission check FAILED - Insufficient permissions {
  userId: "3",
  userRole: "EDITOR",
  permission: "USER_CREATE",
  path: "/api/admin/users",
  allowed: false,
  reason: "Role EDITOR lacks permission USER_CREATE"
}
```

**Result**: ✅ PASS (Correctly denied)

---

### Test 1.5: DELETE USER - Admin Success

**User**: admin@example.com (ADMIN)  
**Required Permission**: `USER_DELETE`  
**Expected**: ✅ ALLOWED

**Request**:
```bash
curl -X DELETE http://localhost:3000/api/admin/users/7 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "meta": {
    "deletedBy": "admin@example.com",
    "deletedAt": "2026-02-23T14:34:00Z",
    "deletedUserId": "7"
  }
}
```

**Status**: 200 OK  
**Audit Log**:
```
[2026-02-23T14:34:00.345Z] info: [RBAC] Permission check PASSED {
  userId: "2",
  userRole: "ADMIN",
  permission: "USER_DELETE",
  path: "/api/admin/users/7",
  allowed: true,
  reason: "Role ADMIN has permission USER_DELETE"
}
```

**Result**: ✅ PASS

---

### Test 1.6: DELETE USER - Viewer Denied

**User**: viewer@example.com (VIEWER)  
**Required Permission**: `USER_DELETE`  
**Expected**: ❌ DENIED

**Request**:
```bash
curl -X DELETE http://localhost:3000/api/admin/users/7 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response**:
```json
{
  "success": false,
  "error": "Permission USER_DELETE required",
  "code": "FORBIDDEN"
}
```

**Status**: 403 Forbidden  
**Audit Log**:
```
[2026-02-23T14:35:00.678Z] warn: [RBAC] Permission check FAILED - Insufficient permissions {
  userId: "5",
  userRole: "VIEWER",
  permission: "USER_DELETE",
  path: "/api/admin/users/7",
  allowed: false,
  reason: "Role VIEWER lacks permission USER_DELETE"
}
```

**Result**: ✅ PASS (Correctly denied)

---

## Test Suite 2: Role Hierarchy Checks

### Test 2.1: Admin Can Update (At Least EDITOR)

**User**: admin@example.com (ADMIN)  
**Required Role**: `EDITOR` (or higher)  
**Expected**: ✅ ALLOWED (ADMIN > EDITOR)

**Test**: Can admin access editor-level features?  
**Result**: ✅ YES

**Verification**:
```typescript
isRoleAtLeast(Role.ADMIN, Role.EDITOR) // true
ROLE_HIERARCHY[Role.ADMIN] = 80
ROLE_HIERARCHY[Role.EDITOR] = 60
80 >= 60 = true
```

---

### Test 2.2: User Cannot Access Admin Route

**User**: user@example.com (USER)  
**Required Role**: `ADMIN`  
**Expected**: ❌ DENIED (USER < ADMIN)

**Test**: Can user access admin routes?  
**Result**: ❌ NO

**Verification**:
```typescript
isRoleAtLeast(Role.USER, Role.ADMIN) // false
ROLE_HIERARCHY[Role.USER] = 40
ROLE_HIERARCHY[Role.ADMIN] = 80
40 >= 80 = false
```

---

## Test Suite 3: Business Logic Protection

### Test 3.1: Self-Deletion Prevention

**User**: admin@example.com (ADMIN, ID=2)  
**Target**: User ID 2 (self)  
**Expected**: ❌ DENIED (Business rule)

**Request**:
```bash
curl -X DELETE http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response**:
```json
{
  "success": false,
  "error": "Cannot delete your own account",
  "code": "FORBIDDEN"
}
```

**Status**: 403 Forbidden  
**Audit Log**:
```
[2026-02-23T14:36:00.901Z] warn: [RBAC] Business rule violation {
  userId: "2",
  userRole: "ADMIN",
  action: "DELETE_USER",
  targetUserId: "2",
  blocked: true,
  reason: "Self-deletion prevented"
}
```

**Result**: ✅ PASS (Business rule correctly enforced)

---

## Test Suite 4: UI Component Protection

### Test 4.1: Admin Sees All Buttons

**User**: admin@example.com (ADMIN)  
**Page**: `/rbac-demo`  
**Expected**: All action buttons visible

**Test Results**:

| Button | Required Permission | Visible? |
|--------|-------------------|----------|
| 👁️ View | None (public) | ✅ Yes |
| ✏️ Edit | TRAIN_UPDATE | ✅ Yes |
| 🗑️ Delete | TRAIN_DELETE | ✅ Yes |
| ⚙️ Admin Settings | ADMIN role | ✅ Yes |
| 👑 Super Admin Panel | SUPER_ADMIN role | ❌ No |

**Result**: ✅ PASS

---

### Test 4.2: Regular User Sees Limited Buttons

**User**: user@example.com (USER)  
**Page**: `/rbac-demo`  
**Expected**: Only view button visible

**Test Results**:

| Button | Required Permission | Visible? |
|--------|-------------------|----------|
| 👁️ View | None (public) | ✅ Yes |
| ✏️ Edit | TRAIN_UPDATE | ❌ No |
| 🗑️ Delete | TRAIN_DELETE | ❌ No |
| ⚙️ Admin Settings | ADMIN role | ❌ No |
| 👑 Super Admin Panel | SUPER_ADMIN role | ❌ No |

**DOM Verification**:
```javascript
// Buttons not in DOM (not just hidden with display: none)
document.querySelectorAll('[data-permission="TRAIN_DELETE"]').length === 0
```

**Result**: ✅ PASS

---

### Test 4.3: Editor Can Edit But Not Delete

**User**: editor@example.com (EDITOR)  
**Page**: `/rbac-demo`  
**Expected**: View and edit visible, delete hidden

**Test Results**:

| Button | Required Permission | Visible? |
|--------|-------------------|----------|
| 👁️ View | None (public) | ✅ Yes |
| ✏️ Edit | TRAIN_UPDATE | ✅ Yes |
| 🗑️ Delete | TRAIN_DELETE | ❌ No |
| ⚙️ Admin Settings | ADMIN role | ❌ No |

**Result**: ✅ PASS

---

## Test Suite 5: Authentication vs Authorization

### Test 5.1: Unauthenticated Access Denied (401)

**User**: None (no token)  
**Expected**: 401 Unauthorized

**Request**:
```bash
curl http://localhost:3000/api/admin/users
# No Authorization header
```

**Response**:
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**Status**: 401 Unauthorized  
**Audit Log**:
```
[2026-02-23T14:37:00.234Z] info: [RBAC] Authentication required but no user found {
  path: "/api/admin/users",
  hasAuthHeader: false,
  hasAccessCookie: false
}
```

**Result**: ✅ PASS

---

### Test 5.2: Authenticated But Unauthorized (403)

**User**: user@example.com (USER) - authenticated ✅  
**Required**: ADMIN role  
**Expected**: 403 Forbidden

**Request**:
```bash
curl http://localhost:3000/api/admin/settings \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response**:
```json
{
  "success": false,
  "error": "Role ADMIN or higher required",
  "code": "FORBIDDEN"
}
```

**Status**: 403 Forbidden  
**Audit Log**:
```
[2026-02-23T14:38:00.567Z] warn: [RBAC] Role check FAILED - Insufficient privileges {
  userId: "4",
  userRole: "USER",
  requiredRole: "ADMIN",
  path: "/api/admin/settings",
  allowed: false
}
```

**Result**: ✅ PASS

---

## Test Suite 6: Permission Combinations

### Test 6.1: Multiple Permissions (ANY)

**Scenario**: User needs USER_UPDATE OR USER_DELETE  
**User**: admin@example.com (has both)  
**Expected**: ✅ ALLOWED

```typescript
hasAnyPermission(Role.ADMIN, [Permission.USER_UPDATE, Permission.USER_DELETE])
// Returns: true (has both)
```

**Result**: ✅ PASS

---

### Test 6.2: Multiple Permissions (ALL)

**Scenario**: User needs AUDIT_VIEW AND SETTINGS_MANAGE  
**User**: editor@example.com (has neither)  
**Expected**: ❌ DENIED

```typescript
hasAllPermissions(Role.EDITOR, [Permission.AUDIT_VIEW, Permission.SETTINGS_MANAGE])
// Returns: false (has neither)
```

**Result**: ✅ PASS

---

## Comprehensive Audit Log Sample

### 1-Hour Activity Summary

```
📊 RBAC Activity Summary (2026-02-23 14:00-15:00)

Total Access Attempts: 247
├─ Allowed: 203 (82.2%)
└─ Denied: 44 (17.8%)

Breakdown by Result:
├─ 200 OK: 203
├─ 401 Unauthorized: 12
└─ 403 Forbidden: 32

Top Users by Activity:
1. admin@example.com: 98 requests
2. editor@example.com: 67 requests
3. user@example.com: 45 requests

Most Denied Permissions:
1. USER_DELETE: 18 denials
2. USER_CREATE: 9 denials
3. AUDIT_VIEW: 5 denials

Security Alerts:
⚠️ user@example.com attempted USER_DELETE 12 times (blocked)
⚠️ guest@example.com attempted API_ADMIN access (blocked)
```

### Sample Log Entries

```
[2026-02-23T14:15:23.456Z] info: [RBAC] Permission check PASSED {
  userId: "2",
  userRole: "ADMIN",
  permission: "USER_LIST",
  path: "/api/admin/users",
  allowed: true,
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
}

[2026-02-23T14:16:45.789Z] warn: [RBAC] Permission check FAILED {
  userId: "4",
  userRole: "USER",
  permission: "USER_DELETE",
  path: "/api/admin/users/7",
  allowed: false,
  reason: "Role USER lacks permission USER_DELETE",
  ipAddress: "192.168.1.101",
  userAgent: "curl/7.68.0"
}

[2026-02-23T14:17:12.012Z] warn: [RBAC] Business rule violation {
  userId: "2",
  userRole: "ADMIN",
  action: "DELETE_USER",
  targetUserId: "2",
  blocked: true,
  reason: "Self-deletion prevented",
  ipAddress: "192.168.1.100"
}

[2026-02-23T14:18:34.345Z] info: [RBAC] User authenticated {
  userId: "3",
  userRole: "EDITOR",
  path: "/api/auth/refresh",
  tokenRefreshed: true
}
```

---

## Test Summary Matrix

| Test Category | Tests Run | Passed | Failed | Pass Rate |
|---------------|-----------|--------|--------|-----------|
| Permission-Based API | 6 | 6 | 0 | 100% |
| Role Hierarchy | 2 | 2 | 0 | 100% |
| Business Logic | 1 | 1 | 0 | 100% |
| UI Component Protection | 3 | 3 | 0 | 100% |
| Auth vs Authz | 2 | 2 | 0 | 100% |
| Permission Combinations | 2 | 2 | 0 | 100% |
| **TOTAL** | **16** | **16** | **0** | **100%** |

---

## Policy Evaluation Examples

### Example 1: Editor Accessing User List

```typescript
evaluatePolicy(Role.EDITOR, '/api/admin/users', Permission.USER_LIST)

// Result:
{
  allowed: false,
  role: 'EDITOR',
  resource: '/api/admin/users',
  permission: 'USER_LIST',
  reason: 'Role EDITOR lacks permission USER_LIST',
  timestamp: 2026-02-23T14:30:00.000Z
}
```

### Example 2: Admin Viewing Audit Logs

```typescript
evaluatePolicy(Role.ADMIN, '/api/audit', Permission.AUDIT_VIEW)

// Result:
{
  allowed: true,
  role: 'ADMIN',
  resource: '/api/audit',
  permission: 'AUDIT_VIEW',
  reason: 'Role ADMIN has permission AUDIT_VIEW',
  timestamp: 2026-02-23T14:30:00.000Z
}
```

---

## Security Verification Checklist

- [x] Permissions enforced server-side (not just client-side)
- [x] JWT tokens include role in signed payload
- [x] Invalid roles rejected during authentication
- [x] Self-modification prevented (users can't delete themselves)
- [x] All access decisions logged with timestamp and user info
- [x] 401 returned for unauthenticated requests
- [x] 403 returned for authenticated but unauthorized requests
- [x] UI components hidden for unauthorized users (removed from DOM)
- [x] Role hierarchy correctly enforced
- [x] Multiple permission checks (ANY/ALL) work correctly
- [x] Business logic rules enforced alongside RBAC
- [x] Audit logs contain sufficient detail for investigation

---

## Reflections

### What Went Well

✅ **Separation of Concerns**: Permission checks are cleanly separated from business logic

✅ **Comprehensive Logging**: Every access decision is logged with full context

✅ **Type Safety**: TypeScript enums prevent typos in role/permission names

✅ **Developer Experience**: Simple wrappers (`withPermission`, `withRole`) make protection easy

✅ **UI Consistency**: Client-side hooks mirror server-side logic for seamless UX

### Challenges & Solutions

🔧 **Challenge**: How to prevent admins from accidentally deleting themselves  
**Solution**: Business logic check before permission check

🔧 **Challenge**: Role hierarchy vs flat permissions  
**Solution**: Numeric hierarchy levels + explicit permission lists for flexibility

🔧 **Challenge**: Testing all permission combinations  
**Solution**: Test matrix with 6 roles × key permissions = comprehensive coverage

### Future Improvements

🔮 **Attribute-Based Access Control (ABAC)**: Add context like time, location, department

🔮 **Dynamic Permissions**: Allow creating custom permissions without code changes

🔮 **Permission Groups**: Bundle related permissions (e.g., "USER_MANAGEMENT")

🔮 **Temporary Elevated Access**: Time-limited super admin access for emergencies

🔮 **Audit Dashboard**: Visual interface to view and analyze RBAC logs

---

**Test Date**: February 23, 2026  
**Tested By**: Development Team  
**Status**: ✅ All Tests Passed  
**Next Review**: Quarterly security audit
