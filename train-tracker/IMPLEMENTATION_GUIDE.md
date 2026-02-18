# Global Response Handler Implementation Guide

## Quick Start

The Train Tracker API uses a **Global Response Handler** to ensure all endpoints return consistent, structured responses. This guide shows you how to implement it in your API routes.

## Files Involved

```
lib/
├── api-response.ts      ← Main response utilities
├── error-codes.ts       ← Standardized error codes
└── ...

app/api/
├── auth/
│   ├── login/route.ts
│   ├── signup/route.ts
│   └── logout/route.ts
├── trains/
│   └── search/route.ts
├── contact/
│   └── route.ts
└── ...
```

---

## 1. Import Response Utilities

Every API route should import the response handlers:

```typescript
import {
  successResponse,
  createdResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  conflictResponse,
  internalErrorResponse,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-response';

import { ERROR_CODES } from '@/lib/error-codes';
```

---

## 2. Pattern: Simple GET (no validation needed)

**Use:** Fetching a single resource or simple list without required parameters.

```typescript
// app/api/users/route.ts
import { successResponse, internalErrorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const users = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ];
    return successResponse(users, 'Users fetched successfully');
  } catch (error) {
    console.error('Fetch error:', error);
    return internalErrorResponse('Failed to fetch users');
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ],
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

---

## 3. Pattern: GET with Query Validation

**Use:** Search, filter, or list endpoints with query parameters.

```typescript
// app/api/trains/search/route.ts
import {
  successResponse,
  validationErrorResponse,
  getPaginationParams,
  createPaginationMeta,
  internalErrorResponse
} from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();
    const { page, limit, skip } = getPaginationParams(request.url);

    // Validation
    if (!query || query.length < 2) {
      return validationErrorResponse({
        query: 'Search query must be at least 2 characters'
      });
    }

    // Fetch and paginate
    const allTrains = [...]; // Your data
    const total = allTrains.length;
    const paginatedData = allTrains.slice(skip, skip + limit);

    return successResponse(
      paginatedData,
      'Trains found',
      200,
      createPaginationMeta(page, limit, total)
    );

  } catch (error) {
    console.error('Search error:', error);
    return internalErrorResponse('Failed to search trains');
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trains found",
  "data": [{ "trainNumber": "12001" }, { "trainNumber": "12002" }],
  "timestamp": "2026-02-18T10:30:00.000Z",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "hasMore": true
  }
}
```

---

## 4. Pattern: POST with Multi-Field Validation

**Use:** Creating resources with multiple required fields (users, contacts, etc.).

```typescript
// app/api/contact/route.ts
import {
  validationErrorResponse,
  createdResponse,
  internalErrorResponse
} from '@/lib/api-response';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const errors: Record<string, string> = {};

    // Validate each field
    if (!body.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.email = 'Valid email is required';
    }

    if (!body.message?.trim()) {
      errors.message = 'Message is required';
    }

    if (typeof body.hasTicket !== 'boolean') {
      errors.hasTicket = 'hasTicket must be true or false';
    }

    // Only check referenceCode if hasTicket is true
    if (body.hasTicket && !body.referenceCode?.trim()) {
      errors.referenceCode = 'Reference code required when hasTicket is true';
    }

    // Return all validation errors at once
    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
    }

    // Create resource
    const contact = await prisma.contactRequest.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        message: body.message,
        hasTicket: body.hasTicket,
        referenceCode: body.referenceCode || null
      }
    });

    return createdResponse(contact, 'Contact request submitted successfully');

  } catch (error) {
    console.error('Contact error:', error);
    return internalErrorResponse('Failed to submit contact request');
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
        "email": "Valid email is required",
        "referenceCode": "Reference code required when hasTicket is true"
      }
    }
  },
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

---

## 5. Pattern: Authentication (Login)

**Use:** Login and authentication endpoints.

```typescript
// app/api/auth/login/route.ts
import {
  validationErrorResponse,
  unauthorizedResponse,
  successResponse,
  internalErrorResponse
} from '@/lib/api-response';
import { ERROR_CODES } from '@/lib/error-codes';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const errors: Record<string, string> = {};

    // Validation
    if (!email?.trim()) {
      errors.email = 'Email is required';
    }
    if (!password?.trim()) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
    }

    // Authenticate user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, password: true }
    });

    if (!user) {
      return unauthorizedResponse('Invalid email or password');
    }

    const passwordMatches = await compare(password, user.password);
    if (!passwordMatches) {
      return unauthorizedResponse('Invalid email or password');
    }

    // Success: set cookie and return user data
    const response = successResponse(
      { id: user.id, email: user.email },
      'Login successful'
    );
    setSessionCookie(response, user.id);
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return internalErrorResponse('Failed to login');
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

**Auth Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": {
    "code": "E401",
    "message": "Authentication required"
  },
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

---

## 6. Pattern: Signup with Conflict Check

**Use:** Creating users or resources that might already exist.

```typescript
// app/api/auth/signup/route.ts
import {
  validationErrorResponse,
  createdResponse,
  errorResponse,
  internalErrorResponse
} from '@/lib/api-response';
import { ERROR_CODES } from '@/lib/error-codes';

export async function POST(request: Request) {
  try {
    const { fullName, email, password } = await request.json();
    const errors: Record<string, string> = {};

    // Validation
    if (!fullName?.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Valid email is required';
    }
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
    }

    // Check if resource exists (409 Conflict)
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return errorResponse(
        'An account with that email already exists',
        409,
        ERROR_CODES.RESOURCE_EXISTS
      );
    }

    // Create resource
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        password: hashedPassword
      },
      select: { id: true, email: true, fullName: true }
    });

    return createdResponse(user, 'Account created successfully');

  } catch (error) {
    console.error('Signup error:', error);
    return internalErrorResponse('Failed to create account');
  }
}
```

**Conflict Error Response (409):**
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

---

## 7. Pattern: 404 Not Found

**Use:** When requested resource doesn't exist.

```typescript
// app/api/users/[id]/route.ts
import { notFoundResponse, successResponse, internalErrorResponse } from '@/lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!user) {
      return notFoundResponse('User not found');
    }

    return successResponse(user, 'User fetched');

  } catch (error) {
    console.error('Fetch error:', error);
    return internalErrorResponse('Failed to fetch user');
  }
}
```

**Not Found Response (404):**
```json
{
  "success": false,
  "message": "User not found",
  "error": {
    "code": "E404",
    "message": "Resource not found"
  },
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

---

## Common Error Response Helpers

### `validationErrorResponse(errors)`

Use for 400 Bad Request (validation failures).

```typescript
return validationErrorResponse({
  email: 'Valid email is required',
  password: 'Password must be at least 6 characters'
});
```

### `unauthorizedResponse(message)`

Use for 401 Unauthorized (auth failures).

```typescript
return unauthorizedResponse('Invalid email or password');
return unauthorizedResponse('Session expired. Please login again');
```

### `forbiddenResponse(message)`

Use for 403 Forbidden (permission denied).

```typescript
return forbiddenResponse('You do not have permission to access this resource');
```

### `conflictResponse(message)`

Use for 409 Conflict (resource already exists).

```typescript
return conflictResponse('An account with that email already exists');
```

### `notFoundResponse(message)`

Use for 404 Not Found.

```typescript
return notFoundResponse('User not found');
```

### `internalErrorResponse(message)`

Use for 500 Internal Server Error.

```typescript
console.error('Database error:', error);
return internalErrorResponse('Failed to fetch users');
```

---

## Pagination Pattern

For any list endpoint that returns multiple items:

```typescript
import { 
  successResponse, 
  getPaginationParams, 
  createPaginationMeta 
} from '@/lib/api-response';

export async function GET(request: Request) {
  // Extract pagination params (defaults: page=1, limit=10)
  const { page, limit, skip } = getPaginationParams(request.url);

  // Fetch your data
  const items = await prisma.item.findMany({
    skip,
    take: limit,
  });

  const total = await prisma.item.count();

  // Create pagination metadata
  const meta = createPaginationMeta(page, limit, total);

  return successResponse(items, 'Items fetched', 200, meta);
}
```

**Request:**
```
GET /api/items?page=2&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Items fetched",
  "data": [{ ... }, { ... }],
  "timestamp": "2026-02-18T10:30:00.000Z",
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

---

## Error Code Reference

Use `ERROR_CODES` from `lib/error-codes.ts` for consistency:

```typescript
import { ERROR_CODES } from '@/lib/error-codes';

// E001: General validation error
validationErrorResponse({ ... });

// E401: Unauthorized
unauthorizedResponse('...');

// E404: Not found
notFoundResponse('...');

// E409: Resource exists
conflictResponse('...');

// E500: Server error
internalErrorResponse('...');
```

**Available codes:**
```typescript
ERROR_CODES.VALIDATION_ERROR      // E001
ERROR_CODES.MISSING_FIELD          // E002
ERROR_CODES.INVALID_FORMAT         // E003
ERROR_CODES.INVALID_EMAIL          // E004
ERROR_CODES.WEAK_PASSWORD          // E005

ERROR_CODES.UNAUTHORIZED           // E401
ERROR_CODES.FORBIDDEN              // E403
ERROR_CODES.INVALID_CREDENTIALS    // E011
ERROR_CODES.SESSION_EXPIRED        // E012

ERROR_CODES.NOT_FOUND              // E404
ERROR_CODES.RESOURCE_EXISTS        // E409
ERROR_CODES.CONFLICT               // E010

ERROR_CODES.INTERNAL_ERROR         // E500
ERROR_CODES.DATABASE_ERROR         // E501
ERROR_CODES.EXTERNAL_API_ERROR     // E502
ERROR_CODES.SERVICE_UNAVAILABLE    // E503

// Domain-specific codes
ERROR_CODES.USER_CREATE_FAILED     // E201
ERROR_CODES.USER_NOT_FOUND         // E202
ERROR_CODES.LOGIN_FAILED           // E203
ERROR_CODES.SIGNUP_FAILED          // E204

ERROR_CODES.TRAIN_SEARCH_FAILED    // E301
ERROR_CODES.NO_TRAINS_FOUND        // E302

ERROR_CODES.CONTACT_SUBMIT_FAILED  // E401
ERROR_CODES.CONTACT_VALIDATION_FAILED // E402
```

---

## Checklist: Adding a New Endpoint

When creating a new API route, use this checklist:

- [ ] Import response utilities and error codes at the top
- [ ] Wrap entire function in try-catch
- [ ] Validate all required params/body fields
- [ ] Return `validationErrorResponse()` if validation fails
- [ ] Check for conflicts (existing resources) and use `conflictResponse()`
- [ ] Return `createdResponse()` for successful POST (201)
- [ ] Return `successResponse()` for successful GET/PUT/DELETE (200)
- [ ] Return `unauthorizedResponse()` for auth failures (401)
- [ ] Return `notFoundResponse()` for missing resources (404)
- [ ] Return `internalErrorResponse()` in catch block (500)
- [ ] Include descriptive `message` in response
- [ ] Log errors with context (don't just swallow exceptions)
- [ ] For list endpoints: use `getPaginationParams()` and `createPaginationMeta()`

---

## Frontend Usage Example

How to consume these consistent responses on the frontend:

```typescript
// utils/api.ts
async function apiCall<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const body: ApiResponse<T> = await response.json();

  if (!body.success) {
    // Handle error consistently
    const errorCode = body.error?.code;
    const errorMsg = body.error?.message;
    const validationErrors = body.error?.details?.validationErrors;

    if (validationErrors) {
      // Show field-level errors
      return { error: { type: 'validation', details: validationErrors } };
    }

    // Show generic error
    return { error: { type: 'error', message: body.message } };
  }

  // Success
  return { data: body.data, meta: body.meta };
}

// Usage in component
const { data, error } = await apiCall('/api/users');

if (error?.type === 'validation') {
  // Show validation errors per field
  displayFieldErrors(error.details);
} else if (error) {
  // Show generic error
  showAlert(error.message);
} else {
  // Process data
  setUsers(data);
}
```

---

## Benefits of This System

✅ **Consistency**: Every endpoint returns the same structure  
✅ **Predictability**: Frontend knows exactly what to expect  
✅ **Observability**: Error codes enable monitoring and logging  
✅ **Debuggability**: Timestamps and error details help troubleshooting  
✅ **Maintainability**: New team members understand patterns immediately  
✅ **Scalability**: Works identically for 10 or 100+ endpoints  
✅ **Reliability**: Structured error handling prevents surprises  

---

**Last Updated:** February 18, 2026  
**Version:** 1.0
