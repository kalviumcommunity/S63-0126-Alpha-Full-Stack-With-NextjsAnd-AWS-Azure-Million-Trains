# Global API Response Handler

This document explains how the Train Tracker application implements a unified, centralized response handler for all API endpoints. This ensures consistency, improves developer experience, and strengthens observability.

## Table of Contents

1. [Why Standardized Responses Matter](#why-standardized-responses-matter)
2. [Unified Response Envelope](#unified-response-envelope)
3. [Response Handler Utilities](#response-handler-utilities)
4. [Error Codes & Classification](#error-codes)
5. [Implementation Examples](#implementation-examples)
6. [Developer Experience Benefits](#developer-experience-benefits)
7. [Observability & Monitoring](#observability--monitoring)

---

## Why Standardized Responses Matter

Without a standard response format, different endpoints return different structures, making it difficult for frontend developers to handle responses predictably.

### ❌ Inconsistent Example (Before)

```json
// /api/auth/login
{
  "id": "user-123",
  "email": "user@example.com",
  "token": "abc123xyz"
}

// /api/trains/search
{
  "data": [{ "trainNumber": "12001" }],
  "count": 1
}

// /api/contact
{
  "message": "Request received",
  "requestId": "req-456"
}
```

Each endpoint speaks a different language. Frontend code must constantly adapt.

### ✅ Unified Example (After)

```json
// All endpoints
{
  "success": true,
  "message": "Operation completed",
  "data": { /* Resource data */ },
  "timestamp": "2026-02-18T10:30:00Z"
}
```

Every endpoint follows the same structure. Frontend code is predictable.

---

## Unified Response Envelope

Every API response follows this structure:

### Success Response

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { /* Your resource data */ },
  "timestamp": "2026-02-18T10:30:00.000Z",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "hasMore": true
  }
}
```

**Fields:**
- `success` (boolean): Always `true` for successful requests
- `message` (string): Human-readable operation result
- `data` (any): The actual resource(s) returned by the endpoint
- `timestamp` (string): ISO 8601 timestamp of response generation
- `meta` (object, optional): Pagination or list metadata

### Error Response

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": {
    "code": "E001",
    "message": "Invalid input provided",
    "details": {
      "validationErrors": {
        "email": "Valid email format is required"
      }
    }
  },
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

**Fields:**
- `success` (boolean): Always `false` for failed requests
- `message` (string): User-friendly error message
- `error` (object): Structured error information
  - `code` (string): Machine-readable error code (e.g., "E001")
  - `message` (string): Standard message for this error type
  - `details` (object, optional): Additional context (validation errors, etc.)
- `timestamp` (string): ISO 8601 timestamp of response generation

---

## Response Handler Utilities

All response handling is centralized in **`lib/api-response.ts`**:

```typescript
import {
  ApiResponse,
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  internalErrorResponse,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-response';
```

### Core Functions

#### `successResponse<T>(data, message?, status?, meta?)`

Return a successful response with data.

```typescript
export async function GET() {
  const users = [{ id: 1, name: 'Alice' }];
  return successResponse(users, "Users fetched successfully");
}
```

**Response:**
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": [{ "id": 1, "name": "Alice" }],
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

#### `createdResponse<T>(data, message?)`

Return 201 Created response.

```typescript
export async function POST(req: Request) {
  const newUser = { id: 2, name: 'Bob' };
  return createdResponse(newUser, "User created successfully");
}
```

**Response (HTTP 201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": 2, "name": "Bob" },
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

#### `errorResponse(message, status, errorCode, details?)`

Return a structured error response.

```typescript
return errorResponse(
  "Failed to create user",
  500,
  ERROR_CODES.USER_CREATE_FAILED,
  { originalError: err.message }
);
```

**Response:**
```json
{
  "success": false,
  "message": "Failed to create user",
  "error": {
    "code": "E201",
    "message": "Failed to create user account",
    "details": { "originalError": "..." }
  },
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

#### `validationErrorResponse(errors)`

Return validation errors with field details.

```typescript
const errors = {
  email: "Valid email format is required",
  password: "Password must be at least 6 characters"
};
return validationErrorResponse(errors);
```

**Response (HTTP 400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "E001",
    "message": "Invalid input provided",
    "details": {
      "validationErrors": {
        "email": "Valid email format is required",
        "password": "Password must be at least 6 characters"
      }
    }
  },
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

#### Convenience Functions

```typescript
// 401 Unauthorized
unauthorizedResponse("Invalid email or password");

// 403 Forbidden
forbiddenResponse("You don't have permission to access this resource");

// 404 Not Found
notFoundResponse("User not found");

// 409 Conflict
conflictResponse("An account with that email already exists");

// 500 Internal Server Error
internalErrorResponse("Database connection failed");
```

### Pagination Helpers

```typescript
import { getPaginationParams, createPaginationMeta } from '@/lib/api-response';

export async function GET(request: Request) {
  // Extract page/limit from query params, with defaults
  const { page, limit, skip } = getPaginationParams(request.url);
  
  // Fetch data with pagination
  const total = 150;
  const data = fetchData(skip, limit);
  
  // Create pagination metadata
  const meta = createPaginationMeta(page, limit, total);
  
  return successResponse(data, "Results fetched", 200, meta);
}
```

---

## Error Codes & Classification

Error codes provide machine-readable, globally unique error identifiers. They're defined in **`lib/error-codes.ts`**:

### Validation Errors (E00x)

| Code | Constant | HTTP Status | Meaning |
|------|----------|-------------|---------|
| E001 | `VALIDATION_ERROR` | 400 | General validation failed |
| E002 | `MISSING_FIELD` | 400 | Required field missing |
| E003 | `INVALID_FORMAT` | 400 | Invalid data format |
| E004 | `INVALID_EMAIL` | 400 | Email format invalid |
| E005 | `WEAK_PASSWORD` | 400 | Password doesn't meet requirements |

### Authentication & Authorization (E4xx, E01x)

| Code | Constant | HTTP Status | Meaning |
|------|----------|-------------|---------|
| E401 | `UNAUTHORIZED` | 401 | Auth required / session missing |
| E403 | `FORBIDDEN` | 403 | User lacks permission |
| E011 | `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| E012 | `SESSION_EXPIRED` | 401 | Session timeout |

### Resource Errors (E4xx, E01x)

| Code | Constant | HTTP Status | Meaning |
|------|----------|-------------|---------|
| E404 | `NOT_FOUND` | 404 | Resource doesn't exist |
| E409 | `RESOURCE_EXISTS` | 409 | Resource already exists |
| E010 | `CONFLICT` | 409 | Operation conflicts with data |

### Server Errors (E5xx)

| Code | Constant | HTTP Status | Meaning |
|------|----------|-------------|---------|
| E500 | `INTERNAL_ERROR` | 500 | Unexpected server error |
| E501 | `DATABASE_ERROR` | 500 | Database operation failed |
| E502 | `EXTERNAL_API_ERROR` | 502 | External API failure |
| E503 | `SERVICE_UNAVAILABLE` | 503 | Service temporarily down |

### Domain-Specific Codes

**Users (E20x):**
```typescript
E201 = USER_CREATE_FAILED
E202 = USER_NOT_FOUND
E203 = LOGIN_FAILED
E204 = SIGNUP_FAILED
```

**Trains (E30x):**
```typescript
E301 = TRAIN_SEARCH_FAILED
E302 = NO_TRAINS_FOUND
```

**Contact (E4xx):**
```typescript
E401 = CONTACT_SUBMIT_FAILED
E402 = CONTACT_VALIDATION_FAILED
```

### Using Error Codes

```typescript
import { ERROR_CODES } from '@/lib/error-codes';

export async function POST(req: Request) {
  const data = await req.json();
  
  if (!data.email) {
    return errorResponse(
      "Email is required",
      400,
      ERROR_CODES.MISSING_FIELD  // ← Error code
    );
  }
  
  // ... rest of handler
}
```

---

## Implementation Examples

### Example 1: Authentication Signup

**File: `app/api/auth/signup/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { 
  validationErrorResponse, 
  createdResponse, 
  errorResponse, 
  internalErrorResponse 
} from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/error-codes";

export async function POST(request: Request) {
  try {
    const { fullName, email, password } = await request.json();
    const errors: Record<string, string> = {};

    // Validation
    if (!fullName || typeof fullName !== "string") {
      errors.fullName = "Full name is required";
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Valid email is required";
    }
    if (!password || password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return errorResponse(
        "An account with that email already exists",
        409,
        ERROR_CODES.RESOURCE_EXISTS
      );
    }

    // Create user
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        password: hashedPassword
      },
      select: { id: true, email: true, fullName: true }
    });

    return createdResponse(user, "Account created successfully");

  } catch (error) {
    console.error("Signup error:", error);
    return internalErrorResponse(
      "Failed to create account. Please try again."
    );
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

**Error Response (409):**
```json
{
  "success": false,
  "message": "An account with that email already exists",
  "error": {
    "code": "E409",
    "message": "Resource already exists"
  },
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

### Example 2: Train Search with Pagination

**File: `app/api/trains/search/route.ts`**

```typescript
import { 
  successResponse, 
  validationErrorResponse,
  getPaginationParams,
  createPaginationMeta,
  internalErrorResponse 
} from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/error-codes";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();
    const { page, limit, skip } = getPaginationParams(request.url);

    // Validation
    if (!query || query.length < 2) {
      return validationErrorResponse({
        query: "Search query must be at least 2 characters"
      });
    }

    // Search trains (mocked here)
    const allTrains = [
      { trainNumber: "12001", trainName: "Rajdhani Express", ... },
      { trainNumber: "12002", trainName: "Shatabdi Express", ... },
      // ... many more trains
    ];

    // Apply pagination
    const total = allTrains.length;
    const paginatedTrains = allTrains.slice(skip, skip + limit);

    return successResponse(
      paginatedTrains,
      "Trains found",
      200,
      createPaginationMeta(page, limit, total)
    );

  } catch (error) {
    console.error("Search error:", error);
    return internalErrorResponse("Unable to search trains");
  }
}
```

**Success Response (200) with Pagination:**
```json
{
  "success": true,
  "message": "Trains found",
  "data": [
    { "trainNumber": "12001", "trainName": "Rajdhani Express" },
    { "trainNumber": "12002", "trainName": "Shatabdi Express" }
  ],
  "timestamp": "2026-02-18T10:30:00.000Z",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "hasMore": true
  }
}
```

### Example 3: Contact Request with Validation

**File: `app/api/contact/route.ts`**

```typescript
import { 
  validationErrorResponse, 
  createdResponse, 
  internalErrorResponse 
} from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const errors: Record<string, string> = {};

    // Multi-field validation
    if (!body.fullName) errors.fullName = "Full name required";
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.email = "Valid email required";
    }
    if (!body.message) errors.message = "Message required";
    if (typeof body.hasTicket !== "boolean") {
      errors.hasTicket = "Must be true or false";
    }
    if (body.hasTicket && !body.referenceCode) {
      errors.referenceCode = "Reference code required when hasTicket is true";
    }

    // Return all validation errors at once
    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
    }

    // Create contact request
    const contact = await prisma.contactRequest.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        message: body.message,
        hasTicket: body.hasTicket,
        referenceCode: body.referenceCode || null
      }
    });

    return createdResponse(contact, "Request submitted successfully");

  } catch (error) {
    console.error("Contact error:", error);
    return internalErrorResponse("Failed to submit request");
  }
}
```

**Validation Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "E001",
    "message": "Invalid input provided",
    "details": {
      "validationErrors": {
        "email": "Valid email required",
        "message": "Message required",
        "referenceCode": "Reference code required when hasTicket is true"
      }
    }
  },
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

---

## Developer Experience Benefits

### 1. **Frontend Consistency**

Developers know exactly what shape every response will have:

```typescript
// Frontend code - same pattern everywhere
const response = await fetch('/api/trains/search?query=Mumbai');
const { success, data, meta, error } = await response.json();

if (!success) {
  // Handle error consistently
  console.error(error.code, error.message);
  return;
}

// Process data safely
data.forEach(train => { /* ... */ });

// Handle pagination
if (meta?.hasMore) {
  loadNextPage();
}
```

**No need to write different parsing logic for each endpoint.**

### 2. **Self-Documenting Errors**

Error responses include both machine-readable codes and human-readable messages:

```typescript
// Network layer gets error code for logging
console.error(`Error ${response.error.code}: ${response.error.message}`);

// UI displays user-friendly message
showNotification(response.message);

// Monitoring dashboards track errors by code
analytics.trackError(response.error.code);
```

### 3. **Easier Testing**

Postman monitors, automated tests, and CI/CD pipelines can easily verify responses:

```bash
# Test script knows the response structure
assert response.success == true
assert response.data != null
assert response.timestamp exists
```

### 4. **Clear Status Code Mapping**

| Status | Code | Meaning | Action |
|--------|------|---------|--------|
| 200 | E001+ | Validation | Retry with correct data |
| 201 | - | Created | Success, use new ID |
| 400 | E001 | Validation | Show field errors |
| 401 | E401, E011 | Auth issue | Redirect to login |
| 404 | E404 | Not found | Show 404 page |
| 409 | E409 | Conflict | Email exists, try another |
| 500 | E500+ | Server error | Retry later, contact support |

---

## Observability & Monitoring

### 1. **Structured Logging**

Every response includes a timestamp, enabling precise error tracking:

```typescript
// Log entry with precision
{
  "timestamp": "2026-02-18T10:30:45.123Z",
  "error_code": "E001",
  "request_id": "req-12345",
  "endpoint": "/api/auth/signup",
  "status": 400
}
```

### 2. **Error Aggregation**

Monitoring tools like Sentry, Datadog, or custom dashboards can group errors by code:

```bash
# Dashboard shows: how many E001 errors in last hour?
# Which endpoints have the most E500 errors?
# Which is the most common validation error?
```

### 3. **Performance Tracking**

Timestamps enable latency measurements:

```typescript
const start = Date.now();
const response = await fetch('/api/trains/search');
const { timestamp } = await response.json();
const latency = Date.now() - new Date(timestamp).getTime();
```

### 4. **Client-Side Error Recovery**

Frontend code can intelligently handle errors:

```typescript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url);
    const { success, error } = response.json();
    
    if (success) return response;
    
    // Retry on server errors
    if (error.code.startsWith('E5')) {
      await delay(1000 * Math.pow(2, i)); // Exponential backoff
      continue;
    }
    
    // Don't retry on client errors (4xx)
    throw error;
  }
}
```

---

## Summary

The Global API Response Handler ensures:

✅ **Consistency**: Every endpoint returns the same structure  
✅ **Clarity**: Error codes + messages for debugging  
✅ **Observability**: Timestamps and structured error info for monitoring  
✅ **Developer Experience**: Frontend code is simple and predictable  
✅ **Maintainability**: New endpoints follow established patterns  
✅ **Scalability**: Pattern works for any number of endpoints  

By treating your API as a unified system with a consistent "voice," you reduce integration errors, speed up onboarding, and build more reliable applications.

---

**Last Updated:** February 18, 2026  
**Version:** 1.0
