import { NextResponse } from 'next/server';
import { ERROR_CODES, getErrorCodeMessage } from './error-codes';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message?: string;
    details?: any;
  };
  timestamp: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
  meta?: ApiResponse<T>['meta']
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    message: message || 'Operation completed successfully',
    data,
    timestamp: new Date().toISOString(),
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

/**
 * Created response (201)
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse {
  return successResponse(data, message || 'Resource created successfully', 201);
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status: number = 400,
  errorCode: string = ERROR_CODES.INTERNAL_ERROR,
  details?: any
): NextResponse {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code: errorCode,
      message: getErrorCodeMessage(errorCode),
      details,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

/**
 * Validation error response (400)
 */
export function validationErrorResponse(errors: Record<string, string>): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message: 'Validation failed',
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'One or more fields failed validation',
        details: { validationErrors: errors },
      },
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

/**
 * Not found response (404)
 */
export function notFoundResponse(
  message: string = 'Resource not found',
  resourceType?: string
): NextResponse {
  return errorResponse(
    message || `${resourceType || 'Resource'} not found`,
    404,
    ERROR_CODES.NOT_FOUND
  );
}

/**
 * Unauthorized response (401)
 */
export function unauthorizedResponse(message: string = 'Authentication required'): NextResponse {
  return errorResponse(message, 401, ERROR_CODES.UNAUTHORIZED);
}

/**
 * Forbidden response (403)
 */
export function forbiddenResponse(message: string = 'Access denied'): NextResponse {
  return errorResponse(message, 403, ERROR_CODES.FORBIDDEN);
}

/**
 * Conflict response (409)
 */
export function conflictResponse(message: string = 'Resource already exists'): NextResponse {
  return errorResponse(message, 409, ERROR_CODES.RESOURCE_EXISTS);
}

/**
 * Internal server error response (500)
 */
export function internalErrorResponse(message: string = 'Internal server error'): NextResponse {
  console.error('Internal server error:', message);
  return errorResponse(
    message,
    500,
    ERROR_CODES.INTERNAL_ERROR
  );
}

/**
 * Parse pagination parameters from request URL
 */
export function getPaginationParams(url: string, defaults = { page: 1, limit: 10 }) {
  const { searchParams } = new URL(url);
  const page = Math.max(1, Number(searchParams.get('page')) || defaults.page);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || defaults.limit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}
