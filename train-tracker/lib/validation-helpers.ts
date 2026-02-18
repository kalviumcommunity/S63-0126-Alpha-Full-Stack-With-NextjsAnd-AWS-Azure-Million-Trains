/**
 * Zod Validation Helper Utilities
 * 
 * Provides reusable functions for handling Zod validation in API routes
 */

import { z, ZodError, ZodSchema } from "zod";
import { validationErrorResponse } from "./api-response";

/**
 * Validate request body against a Zod schema
 * Returns validated data or throws validation error response
 */
export function validateRequestBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): T {
  const result = schema.safeParse(body);
  
  if (!result.success) {
    throw createValidationErrorResponse(result.error);
  }
  
  return result.data;
}

/**
 * Validate query parameters against a Zod schema
 * Returns validated data or throws validation error response
 */
export function validateQueryParams<T>(
  schema: ZodSchema<T>,
  searchParams: URLSearchParams
): T {
  // Convert URLSearchParams to object
  const paramsObject: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    paramsObject[key] = value;
  });
  
  const result = schema.safeParse(paramsObject);
  
  if (!result.success) {
    throw createValidationErrorResponse(result.error);
  }
  
  return result.data;
}

/**
 * Convert Zod validation error to our API error response format
 */
export function createValidationErrorResponse(error: ZodError) {
  const errors: Record<string, string> = {};
  
  error.issues.forEach((err: z.ZodIssue) => {
    const field = err.path.join(".");
    errors[field] = err.message;
  });
  
  return validationErrorResponse(errors);
}

/**
 * Safely parse and validate request JSON body
 * Catches JSON parse errors and validation errors
 */
export async function parseAndValidateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return validateRequestBody(schema, body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      // JSON parsing error
      throw validationErrorResponse({
        body: "Invalid JSON format in request body",
      });
    }
    // Re-throw validation error responses
    throw error;
  }
}

/**
 * Extract and validate query string from URL
 */
export function parseAndValidateQuery<T>(
  url: string,
  schema: ZodSchema<T>
): T {
  const { searchParams } = new URL(url);
  return validateQueryParams(schema, searchParams);
}

/**
 * Type guard to check if error is a validation error response
 */
export function isValidationErrorResponse(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "headers" in error &&
    "status" in error
  );
}

/**
 * Conditional validation - only validate if field exists
 * Useful for optional fields that need validation when present
 */
export function validateIfPresent<T>(
  schema: ZodSchema<T>,
  value: unknown
): T | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  
  const result = schema.safeParse(value);
  
  if (!result.success) {
    throw createValidationErrorResponse(result.error);
  }
  
  return result.data;
}

/**
 * Batch validation - validate multiple values with different schemas
 * Returns all validation errors at once
 */
export function validateMultiple(
  validations: Array<{
    schema: ZodSchema<any>;
    value: unknown;
    fieldName: string;
  }>
): Record<string, any> {
  const errors: Record<string, string> = {};
  const validatedData: Record<string, any> = {};
  
  validations.forEach(({ schema, value, fieldName }) => {
    const result = schema.safeParse(value);
    
    if (!result.success) {
      result.error.issues.forEach((err: z.ZodIssue) => {
        errors[fieldName] = err.message;
      });
    } else {
      validatedData[fieldName] = result.data;
    }
  });
  
  if (Object.keys(errors).length > 0) {
    throw validationErrorResponse(errors);
  }
  
  return validatedData;
}

/**
 * Format Zod error for logging (non-user-facing)
 */
export function formatZodErrorForLogging(error: ZodError): string {
  return error.issues
    .map((err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`)
    .join(", ");
}

/**
 * Create a partial schema from an existing schema
 * Useful for PATCH endpoints where all fields are optional
 */
export function createPartialSchema<T extends ZodSchema>(schema: T) {
  if ("partial" in schema && typeof schema.partial === "function") {
    return schema.partial();
  }
  return schema;
}
