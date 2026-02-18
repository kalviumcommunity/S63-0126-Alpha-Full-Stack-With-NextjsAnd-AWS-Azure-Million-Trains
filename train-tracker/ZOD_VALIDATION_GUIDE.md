# Zod Validation Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Installation](#installation)
3. [Schema Definitions](#schema-definitions)
4. [API Integration](#api-integration)
5. [Before and After Examples](#before-and-after-examples)
6. [Advanced Patterns](#advanced-patterns)
7. [Testing Validation](#testing-validation)
8. [Type Safety](#type-safety)

---

## Overview

This guide demonstrates how to implement **Zod** validation in your Next.js Train Tracker API. Zod is a TypeScript-first schema validation library that provides:

- ✅ **Type Safety**: Automatic TypeScript type inference
- ✅ **Reduced Boilerplate**: Replace 20-30 lines of manual validation with 1 function call
- ✅ **Reusable Schemas**: Share validation logic between client and server
- ✅ **Better Error Messages**: Automatic field-level error reporting
- ✅ **Runtime Validation**: Catch errors at runtime with compile-time guarantees

---

## Installation

Zod is already installed in this project:

```bash
npm install zod
```

**Current Version**: Zod v4.3.6

---

## Schema Definitions

All validation schemas are defined in [`lib/validation-schemas.ts`](lib/validation-schemas.ts).

### Example: Signup Schema

```typescript
import { z } from "zod";

export const signupSchema = z.object({
  fullName: z
    .string({ message: "Full name is required" })
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(100, { message: "Full name must not exceed 100 characters" })
    .trim(),
  
  email: z
    .string({ message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .toLowerCase()
    .trim(),
  
  password: z
    .string({ message: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must not exceed 100 characters" }),
});

// TypeScript type automatically inferred from schema
export type SignupInput = z.infer<typeof signupSchema>;
```

### Available Schemas

| Schema | Purpose | File |
|--------|---------|------|
| `signupSchema` | User registration | `validation-schemas.ts` |
| `loginSchema` | User authentication | `validation-schemas.ts` |
| `contactSchema` | Contact form submission | `validation-schemas.ts` |
| `trainSearchSchema` | Train search queries | `validation-schemas.ts` |
| `paginationSchema` | Query pagination parameters | `validation-schemas.ts` |

---

## API Integration

### Helper Functions

**File**: [`lib/validation-helpers.ts`](lib/validation-helpers.ts)

#### `parseAndValidateBody()`

The primary function for validating request bodies in API routes:

```typescript
import { parseAndValidateBody } from "@/lib/validation-helpers";
import { signupSchema } from "@/lib/validation-schemas";

export async function POST(request: Request) {
  try {
    // Validates request body and throws validation error response if invalid
    const validatedData = await parseAndValidateBody(request, signupSchema);
    
    // validatedData is now typed as SignupInput
    console.log(validatedData.fullName); // ✅ TypeScript knows this exists
    
    // Proceed with business logic...
  } catch (error) {
    // Validation errors are automatically returned as NextResponse
    return error;
  }
}
```

#### `parseAndValidateQuery()`

For validating URL query parameters:

```typescript
import { parseAndValidateQuery } from "@/lib/validation-helpers";
import { paginationSchema } from "@/lib/validation-schemas";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const validatedParams = await parseAndValidateQuery(url, paginationSchema);
    
    console.log(validatedParams.page); // Typed and validated
  } catch (error) {
    return error;
  }
}
```

---

## Before and After Examples

### Example 1: Signup Endpoint

#### ❌ Before (Manual Validation)

```typescript
// app/api/auth/signup/route.ts (OLD)
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 30+ lines of manual validation
    if (!body.fullName || typeof body.fullName !== "string") {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }
    
    if (body.fullName.trim().length < 2) {
      return NextResponse.json(
        { error: "Full name must be at least 2 characters" },
        { status: 400 }
      );
    }
    
    if (!body.email || typeof body.email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    if (!body.password || typeof body.password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }
    
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    
    // Finally... business logic
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        fullName: body.fullName.trim(),
        email: body.email.toLowerCase().trim(),
        password: hashedPassword,
      },
    });
    
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
```

#### ✅ After (Zod Validation)

```typescript
// app/api/auth/signup/route.ts (NEW)
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createdResponse, internalErrorResponse } from "@/lib/api-response";
import { parseAndValidateBody } from "@/lib/validation-helpers";
import { signupSchema } from "@/lib/validation-schemas";
import { ERROR_CODES } from "@/lib/error-codes";

export async function POST(request: Request) {
  try {
    // Single line replaces 30+ lines of manual validation! 🎉
    const validatedData = await parseAndValidateBody(request, signupSchema);
    
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existing) {
      return errorResponse(
        "User already exists",
        400,
        ERROR_CODES.RESOURCE_EXISTS
      );
    }
    
    // Business logic
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const user = await prisma.user.create({
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        password: hashedPassword,
      },
    });
    
    return createdResponse({ id: user.id, email: user.email });
  } catch (error) {
    // Validation errors are automatically handled
    if (error instanceof NextResponse) return error;
    return internalErrorResponse("Signup failed");
  }
}
```

**Improvements**:
- ✅ Reduced from **60+ lines** to **30 lines** (50% reduction)
- ✅ Consistent error response format
- ✅ Automatic TypeScript types
- ✅ Reusable validation schema
- ✅ Better error messages with field-level details

---

### Example 2: Contact Form Endpoint

#### ❌ Before (Manual Validation)

```typescript
// app/api/contact/route.ts (OLD)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isValidEmail(value: string): boolean {
  return /.+@.+\..+/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const errors: Record<string, string> = {};
    
    // Manual validation for each field
    if (!body.category || typeof body.category !== "string") {
      errors.category = "Category is required";
    }
    
    if (typeof body.hasTicket !== "boolean") {
      errors.hasTicket = "hasTicket must be a boolean value";
    }
    
    if (body.hasTicket && !body.referenceCode) {
      errors.referenceCode = "Reference code is required when hasTicket is true";
    }
    
    if (!body.message || body.message.trim().length === 0) {
      errors.message = "Message is required";
    }
    
    if (!body.fullName || body.fullName.trim().length === 0) {
      errors.fullName = "Full name is required";
    }
    
    if (!body.email || !isValidEmail(body.email)) {
      errors.email = "Valid email address is required";
    }
    
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }
    
    // Business logic...
    const record = await prisma.contactRequest.create({
      data: {
        category: body.category.trim(),
        hasTicket: body.hasTicket,
        referenceCode: body.referenceCode?.trim() ?? null,
        message: body.message.trim(),
        fullName: body.fullName.trim(),
        email: body.email.trim().toLowerCase()
      }
    });
    
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
```

#### ✅ After (Zod Validation)

```typescript
// app/api/contact/route.ts (NEW)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createdResponse, internalErrorResponse } from "@/lib/api-response";
import { parseAndValidateBody } from "@/lib/validation-helpers";
import { contactSchema } from "@/lib/validation-schemas";

/**
 * POST /api/contact
 * Submit a contact/support request with Zod validation
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Validate request body with Zod schema
    const validatedData = await parseAndValidateBody(request, contactSchema);

    // Create contact request in database
    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.contactRequest.create({
        data: {
          category: validatedData.category,
          hasTicket: validatedData.hasTicket,
          referenceCode: validatedData.hasTicket ? validatedData.referenceCode : null,
          message: validatedData.message,
          attachmentUrl: validatedData.attachmentUrl,
          fullName: validatedData.fullName,
          email: validatedData.email
        }
      });

      await tx.auditEvent.create({
        data: {
          eventType: "contact_request_created",
          entityType: "ContactRequest",
          entityId: created.id,
          meta: {
            category: created.category,
            hasTicket: created.hasTicket,
            email: created.email
          }
        }
      });

      return created;
    });

    return createdResponse(record, "Contact request submitted successfully");
  } catch (error) {
    console.error("Contact request error:", error);
    if (error instanceof NextResponse) return error;
    return internalErrorResponse("Failed to submit contact request. Please try again.");
  }
}
```

**Key Improvements**:
- ✅ Removed `isValidEmail()` helper function (Zod handles it)
- ✅ Conditional validation handled by schema `.refine()`
- ✅ Consistent error response structure
- ✅ TypeScript types automatically inferred
- ✅ Reusable `contactSchema` for client-side validation

---

## Advanced Patterns

### Conditional Validation

The `contactSchema` demonstrates conditional validation using `.refine()`:

```typescript
export const contactSchema = z.object({
  hasTicket: z.boolean({ message: "hasTicket field is required" }),
  referenceCode: z.string().trim().optional().nullable(),
  // ... other fields
}).refine(
  (data) => {
    // If hasTicket is true, referenceCode must be provided
    if (data.hasTicket && (!data.referenceCode || data.referenceCode.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Reference code is required when hasTicket is true",
    path: ["referenceCode"], // Error will be attached to this field
  }
);
```

**Testing**:

```bash
# Valid: hasTicket = false, no referenceCode
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "category": "general",
    "hasTicket": false,
    "message": "This is a test message",
    "fullName": "John Doe",
    "email": "john@example.com"
  }'

# Invalid: hasTicket = true, but no referenceCode
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "category": "technical",
    "hasTicket": true,
    "message": "This is a test message",
    "fullName": "Jane Smith",
    "email": "jane@example.com"
  }'

# Response:
{
  "success": false,
  "message": "Validation error",
  "error": {
    "code": "E001",
    "message": "Invalid input provided",
    "details": {
      "referenceCode": "Reference code is required when hasTicket is true"
    }
  },
  "timestamp": "2025-02-04T10:30:00.000Z"
}
```

---

### Transformations

Zod automatically applies transformations like `.trim()`, `.toLowerCase()`:

```typescript
const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  fullName: z.string().trim(),
});

// Input:  { email: "  USER@EXAMPLE.COM  ", fullName: "  John Doe  " }
// Output: { email: "user@example.com", fullName: "John Doe" }
```

---

### Query Parameter Validation

Use `parseAndValidateQuery()` for GET endpoints:

```typescript
import { parseAndValidateQuery } from "@/lib/validation-helpers";
import { paginationSchema } from "@/lib/validation-schemas";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = await parseAndValidateQuery(url, paginationSchema);
    
    // params.page is now a number (Zod coerces it from string)
    const skip = (params.page - 1) * params.limit;
    
    const trains = await prisma.train.findMany({
      skip,
      take: params.limit,
    });
    
    return successResponse(trains);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return internalErrorResponse("Failed to fetch trains");
  }
}
```

**paginationSchema**:

```typescript
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
```

**URL Examples**:
- `GET /api/trains?page=2&limit=10` → `{ page: 2, limit: 10 }`
- `GET /api/trains` → `{ page: 1, limit: 20 }` (defaults applied)
- `GET /api/trains?page=0` → **Validation Error**: "Page must be at least 1"

---

## Testing Validation

### Manual Testing with curl

#### Test Valid Signup

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alice Johnson",
    "email": "alice@example.com",
    "password": "password123"
  }'
```

**Expected Response**:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "email": "alice@example.com"
  },
  "timestamp": "2025-02-04T10:00:00.000Z"
}
```

---

#### Test Invalid Signup (Short Password)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Bob Smith",
    "email": "bob@example.com",
    "password": "123"
  }'
```

**Expected Response**:

```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "code": "E001",
    "message": "Invalid input provided",
    "details": {
      "password": "Password must be at least 6 characters"
    }
  },
  "timestamp": "2025-02-04T10:00:00.000Z"
}
```

---

#### Test Invalid Signup (Multiple Errors)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "A",
    "email": "invalid-email",
    "password": "123"
  }'
```

**Expected Response**:

```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "code": "E001",
    "message": "Invalid input provided",
    "details": {
      "fullName": "Full name must be at least 2 characters",
      "email": "Please enter a valid email address",
      "password": "Password must be at least 6 characters"
    }
  },
  "timestamp": "2025-02-04T10:00:00.000Z"
}
```

---

### Automated Testing (Jest Example)

```typescript
import { signupSchema } from "@/lib/validation-schemas";

describe("signupSchema", () => {
  it("should validate correct input", () => {
    const result = signupSchema.safeParse({
      fullName: "John Doe",
      email: "john@example.com",
      password: "password123",
    });
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("john@example.com");
    }
  });
  
  it("should reject short password", () => {
    const result = signupSchema.safeParse({
      fullName: "John Doe",
      email: "john@example.com",
      password: "123",
    });
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 6 characters");
    }
  });
  
  it("should transform email to lowercase", () => {
    const result = signupSchema.safeParse({
      fullName: "John Doe",
      email: "JOHN@EXAMPLE.COM",
      password: "password123",
    });
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("john@example.com");
    }
  });
});
```

---

## Type Safety

### Automatic Type Inference

Zod automatically infers TypeScript types from schemas:

```typescript
import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

// TypeScript type automatically inferred ✨
export type SignupInput = z.infer<typeof signupSchema>;

// SignupInput is equivalent to:
// {
//   fullName: string;
//   email: string;
//   password: string;
// }
```

### Using Inferred Types in API Handlers

```typescript
import { SignupInput } from "@/lib/validation-schemas";

async function createUser(data: SignupInput) {
  // TypeScript knows exactly what properties exist
  console.log(data.fullName);  // ✅ Valid
  console.log(data.email);     // ✅ Valid
  console.log(data.age);       // ❌ TypeScript error: Property 'age' does not exist
}
```

### Sharing Types with Frontend

```typescript
// components/SignupForm.tsx
import { useState } from "react";
import { SignupInput } from "@/lib/validation-schemas";

export function SignupForm() {
  const [formData, setFormData] = useState<SignupInput>({
    fullName: "",
    email: "",
    password: "",
  });
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Client-side validation (same schema!)
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      // Show validation errors...
      return;
    }
    
    // Submit to API
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  }
}
```

---

## Response Format

All validation errors return this consistent format:

```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "code": "E001",
    "message": "Invalid input provided",
    "details": {
      "fieldName1": "Error message for field 1",
      "fieldName2": "Error message for field 2"
    }
  },
  "timestamp": "2025-02-04T10:00:00.000Z"
}
```

**Benefits**:
- ✅ Consistent structure across all endpoints
- ✅ Machine-readable error codes (`E001`, etc.)
- ✅ Field-level error details for UI feedback
- ✅ Timestamps for logging/debugging

---

## Best Practices

### 1. Keep Schemas Close to Usage

```
lib/
  validation-schemas.ts       # All schemas in one place
  validation-helpers.ts       # Reusable utilities
app/api/
  auth/signup/route.ts        # Import and use
```

### 2. Reuse Schemas Between Client and Server

```typescript
// lib/validation-schemas.ts
export const signupSchema = z.object({ ... });

// app/api/auth/signup/route.ts (server)
import { signupSchema } from "@/lib/validation-schemas";
const data = await parseAndValidateBody(request, signupSchema);

// app/signup/SignupForm.tsx (client)
import { signupSchema } from "@/lib/validation-schemas";
const result = signupSchema.safeParse(formData);
```

### 3. Use `.safeParse()` for Try-Catch Style

```typescript
const result = schema.safeParse(data);

if (!result.success) {
  // Handle errors
  console.error(result.error.issues);
} else {
  // Use validated data
  console.log(result.data);
}
```

### 4. Use `.parse()` for Throwing Errors

```typescript
try {
  const data = schema.parse(input);
  // Use data...
} catch (error) {
  if (error instanceof ZodError) {
    // Handle validation error
  }
}
```

### 5. Document Schema Expectations

```typescript
/**
 * Contact Request Schema
 * 
 * Validates contact form submissions with conditional validation:
 * - If hasTicket is true, referenceCode is required
 * - Email is automatically lowercased
 * - All strings are trimmed
 */
export const contactSchema = z.object({ ... });
```

---

## Summary

### Key Achievements

✅ **Reduced Boilerplate**: Cut validation code by 50%+ (60 lines → 30 lines)  
✅ **Type Safety**: Automatic TypeScript types from schemas  
✅ **Consistent Errors**: Unified response format with error codes  
✅ **Reusable Logic**: Share schemas between client/server  
✅ **Better DX**: Auto-completion and compile-time checks  
✅ **Production Ready**: Comprehensive error handling

### Files Modified

1. ✅ `lib/validation-schemas.ts` - All Zod schemas
2. ✅ `lib/validation-helpers.ts` - Validation utilities
3. ✅ `app/api/auth/signup/route.ts` - Refactored with Zod
4. ✅ `app/api/auth/login/route.ts` - Refactored with Zod
5. ✅ `app/api/contact/route.ts` - Refactored with Zod

### Next Steps

- [ ] Apply Zod validation to remaining endpoints:
  - `/api/trains/search`
  - `/api/trains/schedule`
  - `/api/fare`
  - `/api/pnr-status`
  - `/api/seat-availability`
- [ ] Add client-side validation in frontend forms
- [ ] Write Jest tests for all schemas
- [ ] Create Postman collection with validation test cases

---

## Additional Resources

- **Zod Documentation**: https://zod.dev
- **Zod v4 Release Notes**: https://github.com/colinhacks/zod/releases
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **TypeScript Type Inference**: https://www.typescriptlang.org/docs/handbook/type-inference.html

---

**Created**: February 4, 2025  
**Version**: 1.0.0  
**Author**: Train Tracker Team
