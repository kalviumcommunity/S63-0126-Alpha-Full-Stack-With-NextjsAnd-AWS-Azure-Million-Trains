/**
 * Centralized Error Handler
 * Catches, categorizes, logs, and formats errors for API responses
 * Keeps sensitive details hidden in production
 */

import { NextResponse } from "next/server";
import { logger } from "./logger";

export type ErrorType =
  | "VALIDATION_ERROR" // Zod/input validation
  | "AUTH_ERROR" // Authentication failures
  | "PERMISSION_ERROR" // Authorization/RBAC
  | "NOT_FOUND" // Resource doesn't exist
  | "CONFLICT" // Resource already exists
  | "DATABASE_ERROR" // Database connection/query issues
  | "EXTERNAL_API_ERROR" // Third-party API failures
  | "RATE_LIMIT" // Rate limiting
  | "INTERNAL_ERROR"; // Unexpected server errors

const ERROR_STATUS_CODES: Record<ErrorType, number> = {
  VALIDATION_ERROR: 400,
  AUTH_ERROR: 401,
  PERMISSION_ERROR: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  DATABASE_ERROR: 503,
  EXTERNAL_API_ERROR: 502,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500
};

const ERROR_MESSAGES: Record<ErrorType, string> = {
  VALIDATION_ERROR: "Invalid request. Please check your input.",
  AUTH_ERROR: "Authentication failed. Please log in again.",
  PERMISSION_ERROR: "You do not have permission to access this resource.",
  NOT_FOUND: "The requested resource was not found.",
  CONFLICT: "This resource already exists.",
  DATABASE_ERROR: "Database service temporarily unavailable. Please try again later.",
  EXTERNAL_API_ERROR: "External service unavailable. Please try again later.",
  RATE_LIMIT: "Too many requests. Please slow down.",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again later."
};

interface ErrorMetadata {
  code?: string;
  details?: any;
  requestId?: string;
  endpoint?: string;
  method?: string;
}

export class AppError extends Error {
  constructor(
    public type: ErrorType = "INTERNAL_ERROR",
    public message: string = "An unexpected error occurred",
    public metadata?: ErrorMetadata
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  getStatusCode(): number {
    return ERROR_STATUS_CODES[this.type];
  }

  getUserFacingMessage(): string {
    return ERROR_MESSAGES[this.type];
  }
}

export interface ErrorHandlerOptions {
  context?: string;
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
}

/**
 * Main error handling function
 * Accepts any error type and returns a formatted NextResponse
 */
export function handleError(error: any, options: ErrorHandlerOptions = {}): NextResponse {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const { context = "Unknown", userId, requestId, endpoint, method } = options;

  // Determine if error is our custom AppError or unknown error
  const isAppError = error instanceof AppError;
  const errorType: ErrorType = isAppError ? error.type : "INTERNAL_ERROR";
  const statusCode = isAppError ? error.getStatusCode() : 500;

  // Build metadata for logging
  const logMeta = {
    errorType,
    message: error.message || "Unknown error",
    stack: isDevelopment ? error.stack : "REDACTED_IN_PRODUCTION",
    userId,
    endpoint,
    method,
    context,
    timestamp: new Date().toISOString()
  };

  // Create appropriate logger
  const childLogger = requestId ? logger.child(requestId) : logger;

  // Log the error with full details
  childLogger.error(`[${errorType}] Error in ${context}`, logMeta);

  // Build user-facing response
  const userMessage = isAppError ? error.getUserFacingMessage() : ERROR_MESSAGES.INTERNAL_ERROR;

  const responseData = {
    success: false,
    error: {
      code: isAppError ? error.metadata?.code : "E500",
      message: userMessage,
      ...(isDevelopment && {
        details: {
          type: errorType,
          originalMessage: error.message,
          stack: error.stack,
          metadata: isAppError ? error.metadata : null
        }
      })
    },
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(responseData, { status: statusCode });
}

/**
 * Specific error handlers for common scenarios
 */

export function handleValidationError(
  message: string,
  meta?: any,
  options?: ErrorHandlerOptions
): NextResponse {
  const error = new AppError("VALIDATION_ERROR", message, {
    ...options?.requestId && { requestId: options.requestId },
    details: meta
  });
  return handleError(error, options);
}

export function handleAuthError(
  message: string = "Invalid credentials",
  options?: ErrorHandlerOptions
): NextResponse {
  const error = new AppError("AUTH_ERROR", message, {
    ...options?.requestId && { requestId: options.requestId }
  });
  return handleError(error, options);
}

export function handlePermissionError(
  message: string = "Insufficient permissions",
  options?: ErrorHandlerOptions
): NextResponse {
  const error = new AppError("PERMISSION_ERROR", message, {
    ...options?.requestId && { requestId: options.requestId }
  });
  return handleError(error, options);
}

export function handleNotFoundError(
  resource: string = "Resource",
  options?: ErrorHandlerOptions
): NextResponse {
  const error = new AppError("NOT_FOUND", `${resource} not found`, {
    ...options?.requestId && { requestId: options.requestId }
  });
  return handleError(error, options);
}

export function handleConflictError(
  message: string = "Resource already exists",
  options?: ErrorHandlerOptions
): NextResponse {
  const error = new AppError("CONFLICT", message, {
    ...options?.requestId && { requestId: options.requestId }
  });
  return handleError(error, options);
}

export function handleDatabaseError(
  originalError?: any,
  options?: ErrorHandlerOptions
): NextResponse {
  const error = new AppError("DATABASE_ERROR", "Database operation failed", {
    ...options?.requestId && { requestId: options.requestId },
    details: originalError?.message
  });
  return handleError(error, options);
}

export function handleExternalApiError(
  service: string,
  originalError?: any,
  options?: ErrorHandlerOptions
): NextResponse {
  const error = new AppError(
    "EXTERNAL_API_ERROR",
    `Failed to connect to ${service}`,
    {
      ...options?.requestId && { requestId: options.requestId },
      details: originalError?.message
    }
  );
  return handleError(error, options);
}

export function handleRateLimitError(
  retryAfter?: number,
  options?: ErrorHandlerOptions
): NextResponse {
  const error = new AppError("RATE_LIMIT", "Too many requests. Please try again later.", {
    ...options?.requestId && { requestId: options.requestId },
    details: { retryAfterSeconds: retryAfter }
  });
  const response = handleError(error, options);

  if (retryAfter) {
    response.headers.set("Retry-After", retryAfter.toString());
  }

  return response;
}

/**
 * Catch-all error handler for unknown errors
 */
export function handleUnknownError(
  error: any,
  context: string,
  options?: ErrorHandlerOptions
): NextResponse {
  if (error instanceof AppError) {
    return handleError(error, { ...options, context });
  }

  const appError = new AppError("INTERNAL_ERROR", error.message || "Unknown error", {
    ...options?.requestId && { requestId: options.requestId },
    details: {
      originalType: error.constructor.name,
      originalMessage: error.message
    }
  });

  return handleError(appError, { ...options, context });
}

/**
 * Async error wrapper for route handlers
 * Catches Promise rejections and passes to error handler
 */
export function withErrorHandling(
  fn: (req: any) => Promise<NextResponse>,
  context: string
) {
  return async (req: any) => {
    try {
      return await fn(req);
    } catch (error) {
      return handleUnknownError(error, context, {
        endpoint: req.nextUrl.pathname,
        method: req.method
      });
    }
  };
}
