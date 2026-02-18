# Authorization & Role-Based Access Control (RBAC) Guide

## Overview

Complete role-based access control (RBAC) system that protects API routes based on user roles and active JWT sessions.

**Key Features:**
- ✅ Middleware-level authorization checks
- ✅ Role-based route protection (admin, user)
- ✅ Automatic token validation
- ✅ Principle of least privilege implementation
- ✅ Role extension-ready architecture
- ✅ Comprehensive error responses

---

## 1. Understanding Authentication vs Authorization

| Concept | Description | Example |
|---------|-------------|---------|
| **Authentication** | Confirms who the user is | User logs in with email/password |
| **Authorization** | Determines what they can do | Only admins can access /api/admin |

This guide focuses on **authorization** - controlling what authenticated users can access.

---

## 2. User Roles Structure

### Available Roles
```typescript
type UserRole = "user" | "admin";
```

### User Model (Prisma)
```prisma
model User {
  id        String   @id @default(cuid())
  fullName  String
  email     String   @unique
  password  String
  role      String   @default("user")  // "user" or "admin"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([role])
}
```

Each user has exactly one role:
- **user** (default) - Regular authenticated user
- **admin** - Administrative privileges

---

## 3. Middleware-Based Authorization

### File: `app/middleware.ts`

The middleware intercepts all requests and:
1. ✅ Checks if route is protected
2. ✅ Validates JWT token from Authorization header
3. ✅ Verifies user role for admin routes
4. ✅ Attaches user info to headers for route handlers

### Protected Routes
```typescript
// Routes requiring authentication
/api/admin/*          → Admin only
/api/users/profile    → Any authenticated user
/api/users/settings   → Any authenticated user

// Routes NOT protected
/api/auth/signup      → Public
/api/auth/login       → Public
/                      → Public
```

### Middleware Request Flow
```
Request → Middleware
         ↓
    Is route protected?
         ↓ YES
    Has Authorization header?
         ↓ YES
    JWT valid & not expired?
         ↓ YES
    User role matches route requirements?
         ↓ YES
    ✅ Continue to route handler
    
    ✗ NO (at any step) → Return 401/403 error
```

---

## 4. Protected Routes

### Route 1: General Users Route

**Endpoint:** `GET /api/users`

**Access:** Any authenticated user (role: "user" or "admin")

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?limit=10&offset=0
```

**Success Response (200)**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-uuid-123",
        "email": "john@example.com",
        "fullName": "John Doe",
        "role": "user",
        "createdAt": "2024-02-18T10:00:00Z"
      },
      {
        "id": "admin-uuid-456",
        "email": "admin@example.com",
        "fullName": "Admin User",
        "role": "admin",
        "createdAt": "2024-02-18T09:00:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  },
  "message": "Users retrieved successfully",
  "timestamp": "2024-02-18T10:30:00Z"
}
```

**Error Responses:**

Missing Token (401):
```json
{
  "success": false,
  "error": { "code": "E401" },
  "message": "Missing authorization header",
  "timestamp": "2024-02-18T10:30:00Z"
}
```

Invalid Token (401):
```json
{
  "success": false,
  "error": { "code": "E401" },
  "message": "Invalid or malformed token",
  "timestamp": "2024-02-18T10:30:00Z"
}
```

**Testing with curl:**
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Route 2: Admin Dashboard

**Endpoint:** `GET /api/admin`

**Access:** Admin users only (role: "admin")

**Request Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Success Response (200)**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 45,
      "adminUsers": 3,
      "regularUsers": 42,
      "totalContactRequests": 128,
      "totalAuditEvents": 542
    },
    "timestamp": "2024-02-18T10:30:00Z"
  },
  "message": "Admin dashboard data retrieved successfully",
  "timestamp": "2024-02-18T10:30:00Z"
}
```

**Error: Insufficient Permissions (403)**
```json
{
  "success": false,
  "error": { "code": "E403" },
  "message": "Forbidden. Admin access required.",
  "timestamp": "2024-02-18T10:30:00Z"
}
```

**Testing with curl:**
```bash
# With admin token
curl -X GET http://localhost:3000/api/admin \
  -H "Authorization: Bearer <admin_token>"

# With regular user token (will fail)
curl -X GET http://localhost:3000/api/admin \
  -H "Authorization: Bearer <user_token>"
```

---

### Route 3: Promote User to Admin

**Endpoint:** `POST /api/admin/promote-user`

**Access:** Admin users only

**Request Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user-uuid-123"
}
```

**Success Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid-123",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "admin"  // Updated from "user" to "admin"
  },
  "message": "User promoted to admin successfully",
  "timestamp": "2024-02-18T10:30:00Z"
}
```

**Testing with curl:**
```bash
curl -X POST http://localhost:3000/api/admin/promote-user \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-123"
  }'
```

---

## 5. Authorization Errors Reference

| Status | Code | Message | Cause |
|--------|------|---------|-------|
| 401 | E401 | Missing authorization header | Authorization header not provided |
| 401 | E401 | Invalid authorization header format | Format not "Bearer <token>" |
| 401 | E401 | Invalid or malformed token | Token signature invalid or corrupted |
| 401 | E401 | Token has expired | Token timestamp expired |
| 403 | E403 | Forbidden. Admin access required. | User role is not "admin" for admin route |

---

## 6. Authorization Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Incoming Request                         │
│              GET /api/admin                                 │
│              Authorization: Bearer <token>                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────┐
        │  app/middleware.ts         │
        │  Intercepts request        │
        └────────────┬───────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Extract & Parse JWT  │
          │ Verify Signature     │
          │ Check Expiration     │
          └──────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼ VALID                   ▼ INVALID
    ┌──────────┐             ┌──────────┐
    │ Valid?   │             │ 401 Err  │
    │          │             │ Return   │
    └────┬─────┘             └──────────┘
         │
         ▼
    ┌──────────┐
    │ Is route │─── NO ──────────────────┐
    │admin-    │                         │
    │only?     │                         │
    └────┬─────┘                         │
         │ YES                           │
         ▼                               │
    ┌──────────┐                         │
    │ User     │────┐                    │
    │role ==   │    │                    │
    │"admin"?  │    │ NO                 │
    │          │    └─→┌──────────────┐  │
    └────┬─────┘       │ 403 Error    │  │
         │ YES         │ Return       │  │
         │             └──────────────┘  │
         │                               │
         └───────────────────┬───────────┘
                             │
        ┌────────────────────┴──────────────┐
        │                                   │
        ▼                                   ▼
    ┌──────────┐                    ┌────────────┐
    │ Attach   │                    │ Return     │
    │ user info│                    │ Error      │
    │ to       │                    │ Response   │
    │headers   │                    │            │
    └────┬─────┘                    └────────────┘
         │
         ▼
    ┌──────────┐
    │ Continue │
    │ to route │
    │ handler  │
    └──────────┘
```

---

## 7. JWT Token Contents with Role

### Login Response Token
```json
{
  // Token payload
  "id": "user-uuid-123",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "user",         // ← Role included in token
  "iat": 1708256000,      // issued at
  "exp": 1708342400       // expires at (24 hours later)
}
```

### Decoded Token in Middleware
The middleware decodes and validates this token, then attaches:

```
x-user-id: user-uuid-123
x-user-email: user@example.com
x-user-role: user
```

Route handlers can access these via:
```typescript
request.headers.get("x-user-id")
request.headers.get("x-user-role")
```

---

## 8. Complete Testing Flow

### Step 1: Create Users (One as Admin)
```bash
# Create first user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "email": "admin@example.com",
    "password": "AdminPass123!"
  }'

# Create second user (regular)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "UserPass123!"
  }'
```

### Step 2: Promote First User to Admin
```bash
# Login as first user to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123!"
  }'
# Copy the token from response

# Promote the user (in production, would need database access or admin flow)
# For now, manually update database: UPDATE User SET role='admin' WHERE email='admin@example.com'
```

### Step 3: Login Both Users
```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123!"}' | jq -r '.data.token')

# Login as regular user
USER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"UserPass123!"}' | jq -r '.data.token')
```

### Step 4: Access Protected Routes

**Regular user accessing /api/users (✅ Allowed)**
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $USER_TOKEN"
# Response: 200 OK - users list
```

**Regular user accessing /api/admin (❌ Denied)**
```bash
curl -X GET http://localhost:3000/api/admin \
  -H "Authorization: Bearer $USER_TOKEN"
# Response: 403 Forbidden - Admin access required
```

**Admin accessing /api/admin (✅ Allowed)**
```bash
curl -X GET http://localhost:3000/api/admin \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Response: 200 OK - admin stats
```

**No token accessing protected route (❌ Denied)**
```bash
curl -X GET http://localhost:3000/api/admin
# Response: 401 Unauthorized - Missing authorization header
```

---

## 9. Extending Roles

### Adding a New Role (e.g., "moderator")

**Step 1: Update User Model**
```prisma
model User {
  // ... existing fields
  role String @default("user")  // Now can be: "user", "admin", "moderator"
}
```

**Step 2: Update Middleware**
```typescript
const MOD_ROUTES = [
  /^\/api\/mod/
];

// In middleware...
const isModRoute = MOD_ROUTES.some(route => route.test(pathname));
if (isModRoute && !["admin", "moderator"].includes(decoded.role)) {
  return NextResponse.json(
    { success: false, message: "Moderator access required" },
    { status: 403 }
  );
}
```

**Step 3: Create New Routes**
```typescript
// app/api/mod/route.ts
export async function GET(req) {
  const role = req.headers.get("x-user-role");
  if (!["admin", "moderator"].includes(role)) {
    return NextResponse.json({ message: "Denied" }, { status: 403 });
  }
  // Handle moderator route
}
```

**Benefits:**
- ✅ Easily add new roles
- ✅ Extend middleware patterns
- ✅ Maintain role hierarchy

---

## 10. Security Best Practices

### 1. Principle of Least Privilege
```
✅ DO: Only give admins access to /api/admin
❌ DON'T: Give all authenticated users access to sensitive endpoints
```

### 2. Token in Headers (Not Query Params)
```
✅ DO: Authorization: Bearer <token>
❌ DON'T: ?token=<token> (visible in logs, URLs)
```

### 3. Validate at Multiple Levels
```
Middleware (global checks) → Route handler (business logic checks)
```

### 4. Clear Error Messages Without Leaking Info
```
✅ DO: "Admin access required"
❌ DON'T: "User with ID 123 is not an admin"
```

### 5. Log Authorization Events
```typescript
// Log when admin actions happen
await prisma.auditEvent.create({
  data: {
    eventType: "admin_access",
    entityType: "Admin",
    entityId: userId,
    meta: { action: "view_dashboard" }
  }
});
```

---

## 11. Role-Based Endpoint Summary

| Endpoint | Method | Access | Purpose |
|----------|--------|--------|---------|
| `/api/auth/signup` | POST | Public | Create account |
| `/api/auth/login` | POST | Public | Get JWT token |
| `/api/auth/profile` | GET | Authenticated | Get own profile |
| `/api/users` | GET | Authenticated | List all users + pagination |
| `/api/admin` | GET | Admin only | Admin dashboard stats |
| `/api/admin/promote-user` | POST | Admin only | Promote user to admin |

---

## 12. Troubleshooting

### "Missing authorization header"
→ Add header: `Authorization: Bearer <token>`

### "Forbidden. Admin access required"
→ User doesn't have admin role. Promote them first.

### "Invalid or expired token"
→ Token expired (24h) or signature invalid. Login again.

### "Authentication required"
→ Middleware not injecting user headers. Clear browser cache.

### Token claims changing between requests
→ Token is immutable. Changes require new login.

---

## 13. Files Created/Updated

✅ **Created:**
- `app/middleware.ts` - Authorization middleware
- `app/api/admin/route.ts` - Admin-only routes
- `app/api/users/route.ts` - Authenticated user routes

✅ **Updated:**
- `prisma/schema.prisma` - Added role field to User
- `lib/jwt-utils.ts` - Added role to JWTPayload
- `app/api/auth/login/route.ts` - Include role in JWT
- `app/api/auth/profile/route.ts` - Return role from database

---

## 14. Next Steps

1. **Set up your database** with the role field migration
2. **Test all endpoints** using curl or Postman
3. **Promote your first admin user** via direct database access
4. **Implement audit logging** for sensitive operations
5. **Add more roles** as your application grows
6. **Monitor authorization failures** for security threats

---

**Pro Tip:** "Authorization isn't about blocking users — it's about creating trust boundaries that scale with your application. Well-designed RBAC grows gracefully from simple user/admin to complex permission hierarchies."
