import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
    data,
    message,
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
  error: string,
  status: number = 400,
  details?: any
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
  };

  if (details) {
    response.meta = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Validation error response (400)
 */
export function validationErrorResponse(errors: Record<string, string>): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      meta: {
        validationErrors: errors,
      },
    },
    { status: 400 }
  );
}

/**
 * Not found response (404)
 */
export function notFoundResponse(resourceType: string = 'Resource'): NextResponse {
  return errorResponse(`${resourceType} not found`, 404);
}

/**
 * Unauthorized response (401)
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return errorResponse(message, 401);
}

/**
 * Forbidden response (403)
 */
export function forbiddenResponse(message: string = 'Access denied'): NextResponse {
  return errorResponse(message, 403);
}

/**
 * Internal server error response (500)
 */
export function internalErrorResponse(message: string = 'Internal server error'): NextResponse {
  console.error('Internal server error:', message);
  return errorResponse(message, 500);
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
