# JWT & Session Management Guide

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Token Structure](#token-structure)
3. [Access vs Refresh Tokens](#access-vs-refresh-tokens)
4. [Security Features](#security-features)
5. [Implementation](#implementation)
6. [API Endpoints](#api-endpoints)
7. [Client-Side Usage](#client-side-usage)
8. [Testing Guide](#testing-guide)
9. [Security Best Practices](#security-best-practices)

---

## 🏗️ Architecture Overview

This application implements a **dual-token authentication system** using JSON Web Tokens (JWT) with the following design principles:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Authentication Flow                       │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN
   User credentials → Server validates → Generate token pair
   ├─ Access Token (15 min) → Response body
   └─ Refresh Token (7 days) → HTTP-only cookie

2. API REQUESTS
   Client sends access token → Server validates → Return data
   └─ If expired (401) → Auto-refresh flow

3. AUTO-REFRESH
   Client detects 401 → Call /api/auth/refresh → Get new access token
   └─ Retry original request with new token

4. LOGOUT
   Client calls /api/auth/logout → Blacklist both tokens → Clear cookies
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Dual Token System** | Short-lived access tokens minimize attack window; long-lived refresh tokens enable persistent sessions |
| **HTTP-only Cookies** | Prevents XSS attacks (JavaScript cannot access tokens) |
| **SameSite Strict** | Prevents CSRF attacks (cookies not sent cross-origin) |
| **Token Blacklist** | Enables true logout (tokens invalidated immediately) |
| **Separate Secrets** | Access and refresh tokens use different signing keys for defense-in-depth |

---

## 🔑 Token Structure

### JWT Anatomy

A JWT consists of three parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMz.dBjftJeZ4CVP-mB92
│                                      │                      │
│          HEADER                      │     PAYLOAD          │    SIGNATURE
```

#### 1. Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```
- **alg**: Signing algorithm (HMAC SHA-256)
- **typ**: Token type (JWT)

#### 2. Payload
```json
{
  "userId": 123,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "type": "access",
  "iat": 1672531200,
  "exp": 1672534800
}
```
- **userId**: Unique user identifier
- **email**: User email
- **name**: User full name
- **role**: User role (USER, ADMIN)
- **type**: Token type (access or refresh) - prevents token confusion
- **iat**: Issued at timestamp
- **exp**: Expiration timestamp

#### 3. Signature
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```
- Ensures token integrity (cannot be tampered with)
- Generated using secret key

---

## ⚖️ Access vs Refresh Tokens

### Comparison Table

| Feature | Access Token | Refresh Token |
|---------|-------------|---------------|
| **Lifespan** | 15 minutes | 7 days |
| **Purpose** | Authorize API requests | Generate new access tokens |
| **Storage** | Optional cookie (httpOnly) | HTTP-only cookie (required) |
| **Client Access** | Available to JavaScript (from API response) | Never accessible to JavaScript |
| **Rotation** | Every 15 minutes | Only on login |
| **Secret** | `JWT_SECRET` | `JWT_REFRESH_SECRET` (separate) |
| **Type Field** | `"type": "access"` | `"type": "refresh"` |
| **Attack Window** | 15 minutes maximum | Mitigated by HTTP-only + SameSite |
| **Blacklisted On Logout** | ✅ Yes | ✅ Yes |

### Why Two Tokens?

**Problem**: Single long-lived token (24 hours)
- ❌ If stolen, attacker has 24 hours of access
- ❌ Cannot invalidate without database check on every request (performance cost)

**Solution**: Dual-token system
- ✅ Access token expires quickly (15 min) → Limited attack window
- ✅ Refresh token stored securely (HTTP-only cookie) → XSS protection
- ✅ Refresh token can be blacklisted → True logout
- ✅ Seamless UX → Auto-refresh happens transparently

---

## 🔒 Security Features

### 1. XSS Protection (Cross-Site Scripting)

**Attack**: Malicious JavaScript steals tokens from `localStorage`

**Mitigation**:
```typescript
// ✅ SECURE: Refresh token in HTTP-only cookie
setRefreshTokenCookie(response, refreshToken);
// JavaScript cannot access: document.cookie won't show this token

// ⚠️ ACCEPTABLE: Access token in response body
// (Short 15-minute lifespan limits damage if stolen)
return { accessToken, user };
```

**Why This Works**:
- Refresh token (long-lived) is protected from JavaScript access
- Access token (short-lived) can be stolen but expires quickly
- Even if XSS steals access token, attacker cannot get refresh token to maintain access

### 2. CSRF Protection (Cross-Site Request Forgery)

**Attack**: Malicious site tricks browser into making authenticated requests

**Mitigation**:
```typescript
// SameSite: strict prevents cookies from being sent cross-origin
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict', // 🔒 Browser won't send this cookie from other sites
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days
};
```

**Why This Works**:
- `SameSite: strict` means cookies only sent with same-origin requests
- Attacker's site cannot trigger authenticated requests
- Even if user is logged in, requests from evil.com won't include auth cookies

### 3. Token Replay Protection

**Attack**: Attacker intercepts token and reuses it

**Mitigation**:
```typescript
// Short expiry + blacklist on logout
export const ACCESS_TOKEN_EXPIRY = '15m'; // Expires quickly

// Logout immediately invalidates tokens
export async function logout(tokens: string[]) {
  tokens.forEach(token => {
    const decoded = decodeTokenWithoutVerification(token);
    blacklistToken(token, decoded.exp);
  });
}
```

**Why This Works**:
- Access tokens expire in 15 minutes (limited replay window)
- Logout adds tokens to blacklist (immediate invalidation)
- Refresh endpoint checks blacklist before issuing new tokens

### 4. Token Confusion Attack Prevention

**Attack**: Use refresh token where access token expected (or vice versa)

**Mitigation**:
```typescript
// Each token has a type field
export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
}
```

**Why This Works**:
- Access and refresh tokens use different secrets
- Type field enforced during verification
- Cannot use refresh token to access protected routes

### 5. Secret Separation

**Attack**: Compromise of one secret compromises entire auth system

**Mitigation**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET; // For access tokens
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET; // For refresh tokens
```

**Why This Works**:
- Access token secret compromise doesn't reveal refresh tokens
- Refresh token secret compromise doesn't reveal access tokens
- Defense-in-depth: Multiple layers of security

---

## 🛠️ Implementation

### Files Created/Modified

```
lib/
├── jwt-utils.ts              # JWT generation and verification
├── token-storage.ts          # HTTP-only cookie management
├── token-blacklist.ts        # Token invalidation service
├── auth-fetch.ts             # Client-side auto-refresh hook
└── security-utils.ts         # CSRF protection, security headers

app/api/auth/
├── login/route.ts           # Issues token pair on login
├── refresh/route.ts         # Generates new access token
└── logout/route.ts          # Blacklists tokens and clears cookies
```

### Environment Variables

Add to `.env` or `.env.local`:

```bash
# JWT Secrets (use strong random strings in production)
JWT_SECRET="your-access-token-secret-min-32-chars"
JWT_REFRESH_SECRET="your-different-refresh-token-secret-min-32-chars"

# Generate secrets with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### JWT Utilities (lib/jwt-utils.ts)

```typescript
import jwt from 'jsonwebtoken';

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';

// Generate token pair at login
export function generateTokenPair(payload: TokenPayload) {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return { accessToken, refreshToken };
}

// Verify tokens with type checking
export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
  if (decoded.type !== 'access') throw new Error('Invalid token type');
  return decoded;
}
```

### Token Storage (lib/token-storage.ts)

```typescript
import { NextResponse } from 'next/server';

// Store refresh token securely
export function setRefreshTokenCookie(response: NextResponse, token: string) {
  response.cookies.set('refreshToken', token, {
    httpOnly: true,  // Cannot be accessed by JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}
```

### Token Blacklist (lib/token-blacklist.ts)

```typescript
// In-memory blacklist (use Redis in production)
const blacklistedTokens = new Set<string>();

export function blacklistToken(token: string, expiresAt: number) {
  blacklistedTokens.add(token);
  
  // Auto-remove after expiry
  const ttl = (expiresAt * 1000) - Date.now();
  setTimeout(() => blacklistedTokens.delete(token), ttl);
}

export function isTokenBlacklisted(token: string): boolean {
  return blacklistedTokens.has(token);
}
```

### Auto-Refresh Hook (lib/auth-fetch.ts)

```typescript
'use client';
import { useState } from 'react';

export function useAuthFetch() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  async function refreshAccessToken() {
    const response = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!response.ok) throw new Error('Refresh failed');
    const data = await response.json();
    return data.accessToken;
  }
  
  async function fetchWithAuth(url: string, options: RequestInit = {}) {
    let response = await fetch(url, options);
    
    // Auto-refresh on 401
    if (response.status === 401 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        const newToken = await refreshAccessToken();
        // Retry with new token
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          },
        });
      } catch {
        window.location.href = '/login?session=expired';
      } finally {
        setIsRefreshing(false);
      }
    }
    
    return response;
  }
  
  return { fetchWithAuth, refreshAccessToken, isRefreshing };
}
```

---

## 🌐 API Endpoints

### POST /api/auth/login

**Purpose**: Authenticate user and issue token pair

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

**Cookies Set**:
- `refreshToken`: HTTP-only cookie valid for 7 days
- `accessToken` (optional): HTTP-only cookie valid for 15 minutes

**Usage**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt
```

---

### POST /api/auth/refresh

**Purpose**: Generate new access token using refresh token

**Request**: No body required (reads refresh token from cookie)

**Response**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

**Errors**:
- `401`: No refresh token provided
- `401`: Refresh token blacklisted (user logged out)
- `401`: Invalid or expired refresh token

**Usage**:
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt
```

---

### POST /api/auth/logout

**Purpose**: Invalidate tokens and end session

**Request**: No body required (reads tokens from cookies)

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Side Effects**:
- Both access and refresh tokens added to blacklist
- All auth cookies cleared
- Tokens cannot be used after logout (even if not expired)

**Usage**:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

## 💻 Client-Side Usage

### React Component Example

```typescript
'use client';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useEffect, useState } from 'react';

export default function ProtectedDataComponent() {
  const { fetchWithAuth, isRefreshing } = useAuthFetch();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchWithAuth('/api/protected-data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    }
    
    loadData();
  }, []);
  
  if (isRefreshing) return <p>Refreshing session...</p>;
  if (!data) return <p>Loading...</p>;
  
  return <div>{JSON.stringify(data)}</div>;
}
```

### Login Flow

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (response.ok) {
      const { accessToken, user } = await response.json();
      
      // Store access token (optional - can also use cookie)
      localStorage.setItem('accessToken', accessToken);
      
      // Store user info
      localStorage.setItem('user', JSON.stringify(user));
      
      router.push('/dashboard');
    } else {
      alert('Login failed');
    }
  }
  
  return (
    <form onSubmit={handleLogin}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Logout Flow

```typescript
'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    
    // Clear client-side data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    
    router.push('/login');
  }
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

### Protected API Request

```typescript
async function fetchProtectedData() {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch('/api/protected', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (response.status === 401) {
    // Token expired - useAuthFetch handles this automatically
    console.log('Token expired, auto-refresh will trigger');
  }
  
  return response.json();
}
```

---

## 🧪 Testing Guide

### 1. Test Login

```bash
# Login and save cookies
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}' \
  -c cookies.txt -v

# Expected: 200 OK with accessToken in response body
# Expected: Set-Cookie headers for refreshToken and accessToken
```

### 2. Test Protected Route with Valid Token

```bash
# Extract access token from login response
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Make authenticated request
curl http://localhost:3000/api/protected \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -v

# Expected: 200 OK with protected data
```

### 3. Test Token Expiry (Wait 15+ Minutes)

```bash
# Use expired access token
curl http://localhost:3000/api/protected \
  -H "Authorization: Bearer $EXPIRED_TOKEN" \
  -v

# Expected: 401 Unauthorized with error message
```

### 4. Test Token Refresh

```bash
# Refresh using cookie (contains refresh token)
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt \
  -v

# Expected: 200 OK with new accessToken
# Expected: Updated accessToken cookie
```

### 5. Test Logout

```bash
# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -v

# Expected: 200 OK with success message
# Expected: Cleared cookie headers

# Attempt refresh after logout
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt \
  -v

# Expected: 401 Unauthorized (token blacklisted)
```

### 6. Test Auto-Refresh in Browser

1. Open browser DevTools → Network tab
2. Login to application
3. Make API request every 5 seconds
4. Wait 15 minutes for access token expiry
5. Observe network traffic:
   - Protected endpoint returns `401`
   - Client automatically calls `/api/auth/refresh`
   - Refresh succeeds with new access token
   - Original request retries with new token
   - User never sees error

### 7. Test Token Blacklist

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"test@example.com","password":"Test1234!"}' \
  -c cookies.txt

# Immediately logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt

# Try to use refresh token from before logout
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt

# Expected: 401 Unauthorized (token blacklisted even though not expired)
```

---

## 🛡️ Security Best Practices

### 1. Environment Variables

```bash
# ❌ NEVER commit secrets to version control
JWT_SECRET=weak-secret-123

# ✅ Generate strong random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ✅ Use different secrets for access and refresh
JWT_SECRET=a1b2c3d4e5f6...  # 64 characters
JWT_REFRESH_SECRET=x9y8z7w6v5u4...  # Different, 64 characters
```

### 2. HTTPS in Production

```typescript
// ✅ Enforce secure cookies in production
const cookieOptions = {
  secure: process.env.NODE_ENV === 'production', // Only over HTTPS
  sameSite: 'strict',
  httpOnly: true,
};
```

### 3. Token Expiry Times

```typescript
// ✅ Recommended expiry times
export const ACCESS_TOKEN_EXPIRY = '15m';  // Short-lived
export const REFRESH_TOKEN_EXPIRY = '7d';  // Long-lived

// ❌ Avoid long-lived access tokens
export const ACCESS_TOKEN_EXPIRY = '24h';  // Too long - if stolen, 24hr window

// ❌ Avoid short-lived refresh tokens
export const REFRESH_TOKEN_EXPIRY = '1h';  // Too short - poor UX
```

### 4. Redis for Production Blacklist

```typescript
// ❌ In-memory blacklist (lost on server restart, not shared across instances)
const blacklistedTokens = new Set<string>();

// ✅ Redis blacklist (persistent, distributed)
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export async function blacklistToken(token: string, expiresAt: number) {
  const ttl = expiresAt - Math.floor(Date.now() / 1000);
  await redis.setex(`blacklist:${token}`, ttl, '1');
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const result = await redis.get(`blacklist:${token}`);
  return result === '1';
}
```

### 5. Security Headers

```typescript
// Add to middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}
```

### 6. Rate Limiting

```typescript
// Prevent brute force attacks on login
import { checkRateLimit } from '@/lib/security-utils';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!checkRateLimit(`login:${ip}`, 5, 60000)) { // 5 attempts per minute
    return NextResponse.json(
      { error: 'Too many login attempts' },
      { status: 429 }
    );
  }
  
  // ... login logic
}
```

### 7. Password Requirements

```typescript
import { validatePasswordStrength } from '@/lib/security-utils';

const { isValid, errors } = validatePasswordStrength(password);

if (!isValid) {
  return NextResponse.json({ errors }, { status: 400 });
}

// Requirements:
// - Minimum 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character
```

---

## 📊 Monitoring & Debugging

### Token Decode Tool

```typescript
// Debug token contents without verification
import { decodeTokenWithoutVerification } from '@/lib/jwt-utils';

const decoded = decodeTokenWithoutVerification(token);
console.log('Token expires at:', new Date(decoded.exp * 1000));
console.log('Token issued at:', new Date(decoded.iat * 1000));
console.log('Time remaining:', decoded.exp - Math.floor(Date.now() / 1000), 'seconds');
```

### Network Tab Monitoring

1. Open DevTools → Network
2. Filter: Fetch/XHR
3. Look for:
   - `POST /api/auth/login` → Status 200, cookies set
   - `GET /api/protected` → Status 401 (after 15 min)
   - `POST /api/auth/refresh` → Status 200, new token
   - `GET /api/protected` → Status 200 (retry succeeds)

### Logging Token Events

```typescript
// Add to jwt-utils.ts
import { logger } from '@/lib/logger';

export function generateTokenPair(payload: TokenPayload) {
  logger.info('Token pair generated', { userId: payload.userId });
  // ...
}

export function verifyAccessToken(token: string) {
  try {
    // ...
  } catch (error) {
    logger.warn('Token verification failed', { error });
    throw error;
  }
}
```

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Environment variables set with strong random secrets
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are different
- [ ] Secrets are at least 32 characters (256 bits)
- [ ] HTTPS enabled (required for `secure: true` cookies)
- [ ] Redis configured for token blacklist
- [ ] Rate limiting enabled on login/refresh endpoints
- [ ] Security headers added to middleware
- [ ] CORS configured for allowed origins only
- [ ] Logging configured for token events
- [ ] Password strength validation enforced
- [ ] Token expiry times reviewed (15m access, 7d refresh recommended)
- [ ] Error messages don't leak sensitive information
- [ ] Database connection pooling configured
- [ ] Load testing completed with token refresh scenarios

---

## 📚 Further Reading

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Top 10 Security Risks](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)

---

## 🐛 Troubleshooting

### "Invalid token" error immediately after login

**Cause**: Access and refresh tokens using same secret

**Fix**: Ensure `JWT_SECRET` ≠ `JWT_REFRESH_SECRET` in `.env`

### Auto-refresh infinite loop

**Cause**: Refresh endpoint returning 401, triggering another refresh

**Fix**: Check `skipAuthRetry` option in `fetchWithAuth`:
```typescript
await fetchWithAuth('/api/auth/refresh', { skipAuthRetry: true });
```

### Session expires immediately after login

**Cause**: Server time and client time out of sync

**Fix**: Ensure server clock is synchronized (use NTP in production)

### Cookies not being sent

**Cause**: CORS issue or SameSite restriction

**Fix**: 
- Development: Use same port (localhost:3000) for frontend and API
- Production: Ensure API and frontend on same domain or subdomain
- Check `SameSite: strict` - may need `lax` for cross-subdomain

### Token blacklist not working

**Cause**: In-memory blacklist cleared on server restart

**Fix**: Implement Redis persistence (see Security Best Practices #4)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Train Tracker Team
