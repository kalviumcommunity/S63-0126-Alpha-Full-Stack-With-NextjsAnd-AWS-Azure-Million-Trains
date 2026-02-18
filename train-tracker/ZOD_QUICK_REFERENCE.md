# Zod Validation Quick Reference

## 🚀 Quick Start

### Import and Use in API Route
```typescript
import { parseAndValidateBody } from "@/lib/validation-helpers";
import { signupSchema } from "@/lib/validation-schemas";

export async function POST(request: Request) {
  try {
    const data = await parseAndValidateBody(request, signupSchema);
    // data is now typed and validated ✅
    
    // Your business logic here...
    
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return internalErrorResponse("Operation failed");
  }
}
```

---

## 📋 Available Schemas

### Authentication
```typescript
import { signupSchema, loginSchema } from "@/lib/validation-schemas";

// Signup: fullName, email, password
const signupData = await parseAndValidateBody(request, signupSchema);

// Login: email, password
const loginData = await parseAndValidateBody(request, loginSchema);
```

### Contact Form
```typescript
import { contactSchema } from "@/lib/validation-schemas";

// category, fullName, email, hasTicket, referenceCode?, message, attachmentUrl?
const contactData = await parseAndValidateBody(request, contactSchema);
```

### Train Search
```typescript
import { trainSearchSchema } from "@/lib/validation-schemas";

// query, from?, to?, date?
const searchData = await parseAndValidateBody(request, trainSearchSchema);
```

### Pagination
```typescript
import { paginationSchema } from "@/lib/validation-schemas";
import { parseAndValidateQuery } from "@/lib/validation-helpers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { page, limit } = await parseAndValidateQuery(url, paginationSchema);
  // page and limit are validated numbers
}
```

---

## 🛠️ Helper Functions

### Request Body Validation
```typescript
import { parseAndValidateBody } from "@/lib/validation-helpers";

const data = await parseAndValidateBody(request, schema);
// Throws validation error response if invalid
// Returns typed data if valid
```

### Query Parameter Validation
```typescript
import { parseAndValidateQuery } from "@/lib/validation-helpers";

const url = new URL(request.url);
const params = await parseAndValidateQuery(url, schema);
```

### Direct Validation
```typescript
import { validateRequestBody } from "@/lib/validation-helpers";

const data = validateRequestBody(schema, body);
// Throws validation error response if invalid
```

### Optional Field Validation
```typescript
import { validateIfPresent } from "@/lib/validation-helpers";

const data = validateIfPresent(schema, value);
// Returns null if value is null/undefined
// Validates and returns data if present
```

---

## 📝 Creating Custom Schemas

### Basic Schema
```typescript
import { z } from "zod";

export const mySchema = z.object({
  name: z.string({ message: "Name is required" })
    .min(2, { message: "Name must be at least 2 characters" }),
  
  age: z.number({ message: "Age must be a number" })
    .min(18, { message: "Must be at least 18 years old" }),
  
  email: z.string().email({ message: "Invalid email address" }),
});

// Auto-generate TypeScript type
export type MyInput = z.infer<typeof mySchema>;
```

### Schema with Optional Fields
```typescript
export const mySchema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  nullable: z.string().nullable(),
  optionalWithDefault: z.string().default("default value"),
});
```

### Schema with Transformations
```typescript
export const mySchema = z.object({
  email: z.string()
    .email()
    .toLowerCase()  // Automatically lowercase
    .trim(),        // Automatically trim whitespace
  
  name: z.string()
    .trim()
    .transform(val => val.toUpperCase()),  // Custom transformation
});
```

### Schema with Conditional Validation
```typescript
export const mySchema = z.object({
  hasAddress: z.boolean(),
  address: z.string().optional(),
}).refine(
  (data) => {
    // If hasAddress is true, address must be provided
    if (data.hasAddress && !data.address) {
      return false;
    }
    return true;
  },
  {
    message: "Address is required when hasAddress is true",
    path: ["address"],  // Error will be attached to this field
  }
);
```

### Schema with Enums
```typescript
export const mySchema = z.object({
  status: z.enum(["pending", "active", "inactive"], {
    message: "Status must be one of: pending, active, inactive"
  }),
  
  role: z.union([
    z.literal("admin"),
    z.literal("user"),
    z.literal("guest"),
  ]),
});
```

### Schema with Arrays
```typescript
export const mySchema = z.object({
  tags: z.array(z.string())
    .min(1, { message: "At least one tag is required" })
    .max(10, { message: "Maximum 10 tags allowed" }),
  
  items: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })),
});
```

---

## 🎯 Common Patterns

### Pattern 1: API Route with Body Validation
```typescript
import { parseAndValidateBody } from "@/lib/validation-helpers";
import { createdResponse, internalErrorResponse } from "@/lib/api-response";
import { mySchema } from "@/lib/validation-schemas";

export async function POST(request: Request) {
  try {
    const data = await parseAndValidateBody(request, mySchema);
    
    // Business logic...
    const result = await createResource(data);
    
    return createdResponse(result, "Resource created");
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return internalErrorResponse("Failed to create resource");
  }
}
```

### Pattern 2: API Route with Query Validation
```typescript
import { parseAndValidateQuery } from "@/lib/validation-helpers";
import { successResponse } from "@/lib/api-response";
import { paginationSchema } from "@/lib/validation-schemas";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { page, limit } = await parseAndValidateQuery(url, paginationSchema);
    
    const skip = (page - 1) * limit;
    const data = await fetchData(skip, limit);
    
    return successResponse(data);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return internalErrorResponse("Failed to fetch data");
  }
}
```

### Pattern 3: Client-Side Validation
```typescript
import { signupSchema, SignupInput } from "@/lib/validation-schemas";
import { useState } from "react";

export function SignupForm() {
  const [formData, setFormData] = useState<SignupInput>({
    fullName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Client-side validation (same schema as server!)
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(newErrors);
      return;
    }
    
    // Submit to API...
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
  }
}
```

---

## ❌ Error Handling

### Validation Error Response Format
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "code": "E001",
    "message": "Invalid input provided",
    "details": {
      "fieldName": "Error message for this field"
    }
  },
  "timestamp": "2025-02-04T10:00:00.000Z"
}
```

### Catching Validation Errors
```typescript
try {
  const data = await parseAndValidateBody(request, schema);
} catch (error) {
  // Validation errors are already formatted as NextResponse
  if (error instanceof NextResponse) {
    return error;  // Return directly
  }
  // Handle other errors...
}
```

---

## 🧪 Testing

### Test Valid Input
```typescript
import { signupSchema } from "@/lib/validation-schemas";

const result = signupSchema.safeParse({
  fullName: "John Doe",
  email: "john@example.com",
  password: "password123",
});

console.log(result.success);  // true
console.log(result.data);     // { fullName, email, password }
```

### Test Invalid Input
```typescript
const result = signupSchema.safeParse({
  fullName: "A",
  email: "invalid",
  password: "123",
});

console.log(result.success);  // false
console.log(result.error.issues);  // Array of validation errors
```

### Test with curl
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John","email":"john@example.com","password":"password123"}'
```

---

## 🔗 File Locations

| File | Purpose |
|------|---------|
| `lib/validation-schemas.ts` | All Zod schemas |
| `lib/validation-helpers.ts` | Helper functions |
| `lib/api-response.ts` | Response utilities |
| `lib/error-codes.ts` | Error code constants |

---

## 📚 Full Documentation

For detailed examples and explanations, see:
- **[ZOD_VALIDATION_GUIDE.md](ZOD_VALIDATION_GUIDE.md)** - Complete guide with examples
- **[ZOD_IMPLEMENTATION_SUMMARY.md](ZOD_IMPLEMENTATION_SUMMARY.md)** - Implementation details
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Full API reference
- **[RESPONSE_HANDLER.md](RESPONSE_HANDLER.md)** - Response format guide

---

## ✅ Checklist for New Endpoint

When creating a new API endpoint with validation:

1. [ ] Create Zod schema in `lib/validation-schemas.ts`
2. [ ] Export TypeScript type: `export type MyInput = z.infer<typeof mySchema>`
3. [ ] Import schema and helper in API route
4. [ ] Use `parseAndValidateBody()` or `parseAndValidateQuery()`
5. [ ] Add error handling: `if (error instanceof NextResponse) return error`
6. [ ] Test with valid input
7. [ ] Test with invalid input
8. [ ] Update documentation

---

**Quick Tip**: Use `.safeParse()` for try-catch style validation, or `.parse()` to throw errors directly.
