# Authentication API Documentation

## Overview
Complete secure authentication system with JWT tokens, bcrypt password hashing, and protected routes.

**Key Features:**
- ✅ Secure password hashing with bcryptjs (10 salt rounds)
- ✅ JWT token generation and validation
- ✅ Automatic token expiry (24 hours by default)
- ✅ Zod validation for request payloads
- ✅ Protected routes requiring valid tokens
- ✅ Comprehensive error handling

---

## 1. Signup API

### Endpoint
`POST /api/auth/signup`

### Request
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

### Validation
- `fullName`: string (min 2 chars)
- `email`: valid email format
- `password`: string (min 8 chars)

### Success Response (201)
```json
{
  "success": true,
  "data": {
    "id": "user-uuid-123",
    "email": "jane@example.com",
    "fullName": "Jane Doe"
  },
  "message": "Account created successfully",
  "timestamp": "2024-02-18T10:00:00Z"
}
```

### Error Responses

**Validation Error (400)**
```json
{
  "success": false,
  "error": {
    "code": "E001"
  },
  "validationErrors": [
    {
      "field": "password",
      "message": "String must contain at least 8 character(s)"
    }
  ],
  "timestamp": "2024-02-18T10:00:00Z"
}
```

**User Already Exists (409)**
```json
{
  "success": false,
  "error": {
    "code": "E409"
  },
  "message": "An account with that email already exists",
  "timestamp": "2024-02-18T10:00:00Z"
}
```

**Database Connection Error (503)**
```json
{
  "success": false,
  "error": {
    "code": "E503"
  },
  "message": "Database connection failed. Ensure Supabase is reachable and DATABASE_URL is correct.",
  "timestamp": "2024-02-18T10:00:00Z"
}
```

### Testing with curl
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }'
```

### Testing with Postman
1. Open Postman → New Request
2. Method: `POST`
3. URL: `http://localhost:3000/api/auth/signup`
4. Headers: `Content-Type: application/json`
5. Body (JSON):
   ```json
   {
     "fullName": "Jane Doe",
     "email": "jane@example.com",
     "password": "SecurePassword123!"
   }
   ```
6. Click Send

---

## 2. Login API

### Endpoint
`POST /api/auth/login`

### Request
```json
{
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "user-uuid-123",
    "email": "jane@example.com",
    "fullName": "Jane Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItdXVpZC0xMjMiLCJlbWFpbCI6ImphbmVAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNzA4MjU2MDAwLCJleHAiOjE3MDgzNDI0MDB9.xyz..."
  },
  "message": "Login successful",
  "timestamp": "2024-02-18T10:00:00Z"
}
```

### Error Responses

**Invalid Credentials (401)**
```json
{
  "success": false,
  "error": {
    "code": "E401"
  },
  "message": "Invalid email or password",
  "timestamp": "2024-02-18T10:00:00Z"
}
```

**User Not Found (401)**
```json
{
  "success": false,
  "error": {
    "code": "E401"
  },
  "message": "Invalid email or password",
  "timestamp": "2024-02-18T10:00:00Z"
}
```

### Token Structure
The JWT token contains:
```json
{
  "id": "user-uuid-123",
  "email": "jane@example.com",
  "fullName": "Jane Doe",
  "iat": 1708256000,
  "exp": 1708342400
}
```

**Token Expiry:** 24 hours (configurable via `JWT_EXPIRY` in .env.local)

### Testing with curl
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }'
```

### Testing with Postman
1. Method: `POST`
2. URL: `http://localhost:3000/api/auth/login`
3. Body (JSON):
   ```json
   {
     "email": "jane@example.com",
     "password": "SecurePassword123!"
   }
   ```
4. Copy the `token` from the response

---

## 3. Protected Route: Profile API

### Endpoint
`GET /api/auth/profile`

### Authorization
**Required Header:**
```
Authorization: Bearer <jwt_token>
```

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "user-uuid-123",
    "email": "jane@example.com",
    "fullName": "Jane Doe"
  },
  "message": "Profile retrieved successfully",
  "timestamp": "2024-02-18T10:00:00Z"
}
```

### Error Responses

**Missing Token (401)**
```json
{
  "success": false,
  "error": {
    "code": "E401"
  },
  "message": "Missing or invalid authorization header",
  "timestamp": "2024-02-18T10:00:00Z"
}
```

**Invalid/Expired Token (401)**
```json
{
  "success": false,
  "error": {
    "code": "E401"
  },
  "message": "Invalid or expired token",
  "timestamp": "2024-02-18T10:00:00Z"
}
```

### Testing with curl
```bash
# Replace TOKEN with the JWT from login response
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Testing with Postman
1. Method: `GET`
2. URL: `http://localhost:3000/api/auth/profile`
3. Headers tab:
   - Key: `Authorization`
   - Value: `Bearer <your_jwt_token>`
4. Click Send

---

## Complete Authentication Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /api/auth/signup
       │    { fullName, email, password }
       ▼
┌──────────────────────────────────┐
│  Signup Endpoint                 │
│  ✓ Validate with Zod             │
│  ✓ Check if user exists          │
│  ✓ Hash password (bcryptjs)      │
│  ✓ Create user in DB             │
│  ✓ Log audit event               │
└──────┬───────────────────────────┘
       │ 201 Created
       │ { id, email, fullName }
       ▼
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 2. POST /api/auth/login
       │    { email, password }
       ▼
┌──────────────────────────────────┐
│  Login Endpoint                  │
│  ✓ Validate with Zod             │
│  ✓ Find user by email            │
│  ✓ Compare password (bcryptjs)   │
│  ✓ Generate JWT token (24h exp)  │
└──────┬───────────────────────────┘
       │ 200 OK
       │ { id, email, fullName, token }
       ▼
┌─────────────────────────────────────┐
│   Client stores token in            │
│   localStorage/sessionStorage       │
└────────┬────────────────────────────┘
         │
         │ 3. GET /api/auth/profile
         │    Authorization: Bearer <token>
         ▼
┌──────────────────────────────────┐
│  Protected Route Handler         │
│  ✓ Extract token from header     │
│  ✓ Verify JWT signature          │
│  ✓ Check token expiry            │
│  ✓ Return user data              │
└──────┬───────────────────────────┘
       │ 200 OK
       │ { id, email, fullName }
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

---

## Security Best Practices Implemented

### 1. Password Hashing
- **Algorithm:** bcryptjs
- **Salt Rounds:** 10 (automatically handled by bcryptjs)
- **Why it matters:** Even if database is leaked, passwords remain unreadable

```typescript
// In signup route
const hashedPassword = await hash(validatedData.password, 10);
await prisma.user.create({
  data: { password: hashedPassword, ... }
});
```

### 2. JWT Token Security
- **Algorithm:** HS256 (HMAC SHA-256)
- **Secret:** `JWT_SECRET` environment variable (24+ character key in production)
- **Expiry:** 24 hours (configurable)
- **Cannot be tampered:** Verified using secret key

```typescript
// Token structure
{
  "id": "user-id",
  "email": "user@example.com",
  "iat": 1708256000,      // issued at
  "exp": 1708342400       // expires at
}
```

### 3. Token Verification
Each protected route verifies:
- ✓ Token exists in Authorization header
- ✓ Token format is correct ("Bearer <token>")
- ✓ JWT signature is valid (not tampered)
- ✓ Token has not expired

### 4. Input Validation
All requests validated with Zod schemas:
- Email format validation
- Password strength requirements
- Request body type safety

### 5. Error Handling
- No sensitive data in error messages
- Consistent error codes
- Database connection errors handled separately

---

## Token Management Strategies

### Strategy 1: Client-Side Storage (Current)
**Storage:** `localStorage` or `sessionStorage`

**Advantages:**
- Simple to implement
- Works with any backend
- Good for SPAs

**Disadvantages:**
- Vulnerable to XSS attacks
- Lost on browser clear

**When to use:** Development, simple SPAs

### Strategy 2: Secure HTTP-Only Cookies (Recommended for Production)
Store token in HTTP-only cookie instead of localStorage

```typescript
// In login endpoint
const response = NextResponse.json({ success: true, ... });
response.cookies.set('authToken', token, {
  httpOnly: true,
  secure: true,        // HTTPS only
  sameSite: 'strict',
  maxAge: 86400        // 24 hours
});
return response;
```

**Advantages:**
- Protected from XSS
- Automatically sent with requests
- Can't be accessed by JavaScript

### Strategy 3: Refresh Token Pattern (Long Sessions)
Maintain two tokens:
- **Access Token:** 15 minutes (short-lived)
- **Refresh Token:** 7 days (long-lived, stored securely)

```typescript
// Generate both tokens
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

// Return both
response.json({
  accessToken,
  refreshToken,
  expiresIn: 900  // 15 minutes in seconds
});
```

---

## Environment Variables

### Development (.env.local)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/train_tracker"
JWT_SECRET="dev-secret-key-change-in-production"
JWT_EXPIRY="24h"
```

### Production (.env.production)
```env
DATABASE_URL="postgresql://prod-user:prod-password@prod-host:5432/train_tracker"
JWT_SECRET="use-strong-random-key-32-chars-minimum"
JWT_EXPIRY="24h"
```

**Generate secure JWT_SECRET:**
```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## Testing Complete Flow

### Step 1: Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected:** 201 Created with user data

### Step 2: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected:** 200 OK with JWT token

### Step 3: Access Protected Route
```bash
# Copy token from login response
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected:** 200 OK with user profile

### Step 4: Test with Invalid Token
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer invalid-token"
```

**Expected:** 401 Unauthorized

---

## Files Created/Updated

✅ **Created:**
- `lib/jwt-utils.ts` - JWT generation and verification
- `app/api/auth/profile/route.ts` - Protected route example

✅ **Updated:**
- `app/api/auth/login/route.ts` - JWT token generation
- `.env.local` - JWT configuration

---

## Next Steps

1. **Update .env.local** with your actual database connection string
2. **Test all endpoints** using curl or Postman
3. **Implement token refresh** for long sessions
4. **Add role-based authorization** (admin, user, etc.)
5. **Deploy with production environment variables**
6. **Monitor token usage** and implement rate limiting

---

## Troubleshooting

### "DATABASE_URL not found"
→ Update `.env.local` with your PostgreSQL connection string

### "Invalid or expired token"
→ Token has expired or wasn't signed with correct secret

### "Missing Authorization header"
→ Include header: `Authorization: Bearer <token>`

### "User already exists"
→ Try signing up with a different email

### 500 Internal Error
→ Check server logs: `npm run dev` terminal output

