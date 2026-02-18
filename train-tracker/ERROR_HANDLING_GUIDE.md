# Centralized Error Handling Guide

## Overview

A production-grade centralized error handling system that catches, categorizes, logs, and formats all application errors while maintaining security and consistency.

**Key Features:**
- ✅ Structured logging with JSON formatting
- ✅ Environment-aware error responses (dev vs prod)
- ✅ Automatic error categorization
- ✅ Request tracing and correlation IDs
- ✅ Stack trace redaction in production
- ✅ Reusable error handlers for common scenarios
- ✅ Async error wrapping

---

## 1. Why Centralized Error Handling Matters

### Without Centralized Handling ❌
```
400 Bad Request (one format)
{ error: "Invalid input" }

500 Internal Server Error (different format)
Error: Database connection failed
  at DatabaseService.connect()...

401 Unauthorized (yet another format)
Unauthorized
```

**Problems:**
- ❌ Inconsistent response formats
- ❌ Stack traces leak to users in all environments
- ❌ No structured logging for debugging
- ❌ Difficult to monitor errors
- ❌ Security vulnerabilities

### With Centralized Handling ✅
```json
// Development
{
  "success": false,
  "error": {
    "code": "E500",
    "message": "An unexpected error occurred",
    "details": {
      "type": "DATABASE_ERROR",
      "originalMessage": "Connection timeout",
      "stack": "Error: Connection timeout\n at ...",
      "metadata": { "retries": 3 }
    }
  },
  "timestamp": "2024-02-18T10:00:00Z"
}

// Production
{
  "success": false,
  "error": {
    "code": "E500",
    "message": "An unexpected error occurred. Please try again later."
  },
  "timestamp": "2024-02-18T10:00:00Z"
}

// Console Logs (Always Detailed)
{
  "level": "error",
  "message": "[DATABASE_ERROR] Error in GET /api/admin",
  "timestamp": "2024-02-18T10:00:00Z",
  "meta": {
    "errorType": "DATABASE_ERROR",
    "message": "Connection timeout",
    "stack": "Error: Connection timeout\n at ...",
    "endpoint": "/api/admin",
    "method": "GET",
    "userId": "user-123"
  }
}
```

**Benefits:**
- ✅ Consistent response format
- ✅ Stack traces hidden in production
- ✅ Full details in console logs for developers
- ✅ Traceable errors with request IDs
- ✅ Security and user trust

---

## 2. Error Handling Architecture

### Layer 1: Logger (`lib/logger.ts`)
Structured logging utility - logs everything consistently

```typescript
logger.info("User created", { userId: "123" });
logger.error("Database error", { endpoint: "/api/users", code: "E500" });
```

### Layer 2: Custom App Error (`lib/error-handler.ts`)
Extends Error with type and metadata

```typescript
throw new AppError(
  "DATABASE_ERROR",
  "Connection timeout",
  { code: "E500", details: error }
);
```

### Layer 3: Error Handler (`lib/error-handler.ts`)
Catches, categorizes, logs, and formats responses

```typescript
return handleError(error, {
  context: "GET /api/admin",
  userId: "user-123",
  endpoint: "/api/admin"
});
```

---

## 3. Error Types and Status Codes

| Type | Status | Message | Use Case |
|------|--------|---------|----------|
| `VALIDATION_ERROR` | 400 | Invalid request | Bad input/Zod schema failure |
| `AUTH_ERROR` | 401 | Authentication failed | Invalid credentials |
| `PERMISSION_ERROR` | 403 | Forbidden | Insufficient permissions/RBAC |
| `NOT_FOUND` | 404 | Not found | Resource doesn't exist |
| `CONFLICT` | 409 | Already exists | Duplicate resource |
| `DATABASE_ERROR` | 503 | Service unavailable | DB connection/query issues |
| `EXTERNAL_API_ERROR` | 502 | External service error | Third-party API failures |
| `RATE_LIMIT` | 429 | Too many requests | Rate limiting triggered |
| `INTERNAL_ERROR` | 500 | Unexpected error | Unknown/unhandled errors |

---

## 4. Structured Logger Implementation

### File: `lib/logger.ts`

```typescript
export const logger = new Logger();

// Basic logging
logger.info("User signup completed", { userId: "123" });
logger.warn("High memory usage", { percentUsed: 85 });
logger.error("Database query failed", { query: "SELECT...", error: "Timeout" });
logger.debug("API request received", { method: "POST", path: "/api/users" });

// Request-scoped logging
const requestLogger = logger.child("req-id-12345");
requestLogger.info("Processing request", { userId: "123" });
requestLogger.error("Request failed", { message: "Timeout" });
```

**Output Format (JSON):**
```json
{
  "level": "info",
  "message": "User signup completed",
  "timestamp": "2024-02-18T10:00:00.123Z",
  "meta": {
    "userId": "123"
  },
  "requestId": "req-id-12345"
}
```

---

## 5. Error Handler Implementation

### File: `lib/error-handler.ts`

#### Custom AppError Class
```typescript
// Throw custom errors with type and metadata
throw new AppError(
  "DATABASE_ERROR",
  "Failed to fetch user",
  {
    code: "E503",
    details: { originalError: error.message }
  }
);
```

#### Main Error Handler
```typescript
// Catches and formats any error
return handleError(error, {
  context: "POST /api/auth/signup",
  userId: "user-123",
  endpoint: "/api/auth/signup",
  method: "POST"
});
```

#### Specific Error Handlers
```typescript
// Validation error
return handleValidationError("Email already exists", 
  { field: "email", value: "user@example.com" });

// Auth error
return handleAuthError("Invalid credentials");

// Permission error
return handlePermissionError("Admin access required");

// Not found error
return handleNotFoundError("User");

// Database error
return handleDatabaseError(originalError);

// External API error
return handleExternalApiError("Stripe API", error);

// Rate limit error
return handleRateLimitError(60); // retry after 60 seconds
```

---

## 6. Development vs Production Responses

### Development Mode

**Request:**
```bash
curl -X GET http://localhost:3000/api/admin
```

**Response (200 - Successful):**
```json
{
  "success": true,
  "data": { /* admin stats */ },
  "message": "Admin dashboard data retrieved successfully",
  "timestamp": "2024-02-18T10:00:00Z"
}
```

**Response (500 - Error with Full Details):**
```json
{
  "success": false,
  "error": {
    "code": "E500",
    "message": "Database service temporarily unavailable. Please try again later.",
    "details": {
      "type": "DATABASE_ERROR",
      "originalMessage": "Connection timeout after 30000ms",
      "stack": "Error: Connection timeout after 30000ms\n  at Timeout._onTimeout [as _callback] (/path/to/db.js:145:20)\n  at listOnTimeout (internal/timers.js:445:16)\n  at process.nextTick (processNextTick) [nodejs callback]",
      "metadata": {
        "endpoint": "/api/admin",
        "method": "GET"
      }
    }
  },
  "timestamp": "2024-02-18T10:00:00Z"
}
```

**Console Logs (Always Detailed):**
```json
{
  "level": "error",
  "message": "[DATABASE_ERROR] Error in GET /api/admin",
  "timestamp": "2024-02-18T10:00:00Z",
  "meta": {
    "errorType": "DATABASE_ERROR",
    "message": "Connection timeout after 30000ms",
    "stack": "Error: Connection timeout...",
    "endpoint": "/api/admin",
    "method": "GET",
    "userId": null,
    "context": "GET /api/admin"
  }
}
```

### Production Mode

**Response (Same Error - Redacted):**
```json
{
  "success": false,
  "error": {
    "code": "E500",
    "message": "An unexpected error occurred. Please try again later."
  },
  "timestamp": "2024-02-18T10:00:00Z"
}
```

**Console Logs (Full Details Preserved):**
```json
{
  "level": "error",
  "message": "[DATABASE_ERROR] Error in GET /api/admin",
  "timestamp": "2024-02-18T10:00:00Z",
  "meta": {
    "errorType": "DATABASE_ERROR",
    "message": "Connection timeout after 30000ms",
    "stack": "Error: Connection timeout...",
    "endpoint": "/api/admin",
    "method": "GET",
    "userId": null,
    "context": "GET /api/admin"
  }
}
```

**Key Difference:** Stack traces and implementation details are **hidden from users** but **logged for developers**.

---

## 7. Real-World Error Examples

### Example 1: Authentication Failure

**Code:**
```typescript
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return handleAuthError("Invalid email or password");
  }
} catch (error) {
  return handleDatabaseError(error, {
    context: "POST /api/auth/login",
    endpoint: "/api/auth/login"
  });
}
```

**Development Response:**
```json
{
  "success": false,
  "error": {
    "code": "E401",
    "message": "Invalid email or password",
    "details": { ... }
  }
}
```

**Production Response:**
```json
{
  "success": false,
  "error": {
    "code": "E401",
    "message": "Authentication failed. Please log in again."
  }
}
```

### Example 2: Validation Error

**Code:**
```typescript
const validatedData = await parseAndValidateBody(request, signupSchema);
if (validatedData.error) {
  return handleValidationError(
    "Invalid request",
    { errors: validatedData.error.errors }
  );
}
```

**Development Response:**
```json
{
  "success": false,
  "error": {
    "code": "E400",
    "message": "Invalid request. Please check your input.",
    "details": {
      "type": "VALIDATION_ERROR",
      "errors": [
        { "path": "email", "message": "Invalid email format" }
      ]
    }
  }
}
```

### Example 3: Permission Denied

**Code:**
```typescript
const userRole = request.headers.get("x-user-role");
if (userRole !== "admin") {
  return handlePermissionError("Admin access required", {
    endpoint: "/api/admin",
    userId: userRequest.headers.get("x-user-id")
  });
}
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "E403",
    "message": "You do not have permission to access this resource."
  },
  "timestamp": "2024-02-18T10:00:00Z"
}
```

---

## 8. Using Error Handlers in Routes

### Pattern 1: Try-Catch with Specific Handler

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // ... business logic
    return successResponse(data, "Success");
  } catch (error) {
    return handleDatabaseError(error, {
      context: "POST /api/users",
      endpoint: request.nextUrl.pathname,
      method: request.method
    });
  }
}
```

### Pattern 2: Conditional Error Throwing

```typescript
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      throw new AppError("AUTH_ERROR", "User not authenticated");
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("NOT_FOUND", "User not found");
    }
    
    return successResponse(user);
  } catch (error) {
    return handleError(error, {
      context: "GET /api/users/profile",
      userId: request.headers.get("x-user-id")
    });
  }
}
```

### Pattern 3: Async Error Wrapper

```typescript
import { withErrorHandling } from "@/lib/error-handler";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const users = await prisma.user.findMany();
  return successResponse(users);
}, "GET /api/users");
```

---

## 9. Logging Best Practices

### ✅ DO: Log Contextual Information
```typescript
logger.info("Payment processed", {
  userId: "user-123",
  amount: 99.99,
  currency: "USD",
  transactionId: "txn-456"
});
```

### ❌ DON'T: Log Sensitive Data
```typescript
logger.info("User login", {
  email: user.email,
  password: user.password, // ❌ NEVER!
  apiKey: process.env.API_KEY // ❌ NEVER!
});
```

### ✅ DO: Use Error Context
```typescript
logger.error("Database query failed", {
  query: "SELECT * FROM users WHERE id = ?",
  parameters: [userId],
  duration: 5000,
  error: error.message
});
```

### ✅ DO: Trace Request Flow
```typescript
const requestId = crypto.randomUUID();
const log = logger.child(requestId);

log.info("Request received");
log.debug("Processing payment");
log.info("Payment completed");
```

---

## 10. Error Response in Different Scenarios

### Scenario 1: User Provides Invalid Email

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John","email":"invalid-email","password":"Pass123!"}'
```

**Development Response:**
```json
{
  "success": false,
  "error": {
    "code": "E400",
    "message": "Invalid request. Please check your input.",
    "details": {
      "type": "VALIDATION_ERROR",
      "originalMessage": "Invalid email",
      "stack": "ZodError: [..stacktrace..]"
    }
  }
}
```

**Production Response:**
```json
{
  "success": false,
  "error": {
    "code": "E400",
    "message": "Invalid request. Please check your input."
  }
}
```

### Scenario 2: Database Unavailable

**Console Log (Both Environments):**
```json
{
  "level": "error",
  "message": "[DATABASE_ERROR] Error in POST /api/auth/signup",
  "timestamp": "2024-02-18T10:00:00Z",
  "meta": {
    "errorType": "DATABASE_ERROR",
    "message": "Connection refused: Database server is unreachable",
    "context": "POST /api/auth/signup"
  }
}
```

**User Response (Both Environments):**
```json
{
  "success": false,
  "error": {
    "code": "E503",
    "message": "Database service temporarily unavailable. Please try again later."
  }
}
```

---

## 11. Files Created/Updated

✅ **Created:**
- `lib/logger.ts` - Structured logging utility
- `lib/error-handler.ts` - Centralized error handling

✅ **Updated:**
- `app/api/admin/route.ts` - Added error handling and logging
- `app/api/users/route.ts` - Added error handling and logging

---

## 12. Benefits of Centralized Error Handling

| Benefit | Impact |
|---------|--------|
| **Consistency** | All errors follow same format |
| **Security** | Stack traces hidden in production |
| **Observability** | Structured logs for debugging |
| **Maintainability** | Update error handling in one place |
| **User Experience** | Clear, friendly error messages |
| **Developer Experience** | Full details in logs for troubleshooting |
| **Scalability** | Easy to integrate with logging services (Sentry, CloudWatch) |

---

## 13. Integration with External Services

### Example: Sentry Integration

```typescript
import * as Sentry from "@sentry/nextjs";

export function handleError(error: any, options: ErrorHandlerOptions = {}) {
  // ... existing logic
  
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      tags: { context: options.context },
      extra: { userId: options.userId }
    });
  }
  
  // ... rest of logic
}
```

### Example: CloudWatch Logs

```typescript
import { CloudWatchClient, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch";

export async function logToCloudWatch(logEntry: LogEntry) {
  const client = new CloudWatchClient({ region: "us-east-1" });
  await client.send(new PutLogEventsCommand({
    logGroupName: "/aws/lambda/train-tracker",
    logStreamName: new Date().toISOString().split("T")[0],
    logEvents: [{ message: JSON.stringify(logEntry), timestamp: Date.now() }]
  }));
}
```

---

## 14. Next Steps

1. **Use error handlers** in all routes for consistency
2. **Log contextual info** for debugging
3. **Never log sensitive data** (passwords, tokens, PII)
4. **Test error scenarios** in both dev and prod
5. **Monitor error logs** for patterns and alerts
6. **Integrate with external services** (Sentry, CloudWatch)

---

**Pro Tip:** "A professional application doesn't just run smoothly — it fails gracefully. Good error handling isn't about hiding errors; it's about handling them intelligently."
