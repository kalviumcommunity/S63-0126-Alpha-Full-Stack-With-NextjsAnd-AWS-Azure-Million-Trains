/**
 * CORS Middleware for API Routes
 * Provides CORS support with security headers for all API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCORSHeaders, DEFAULT_CORS_CONFIG, type CORSConfig } from './security-headers';
import { logger } from './logger';

/**
 * API handler type
 */
type APIHandler = (
  request: NextRequest,
  ...args: any[]
) => Promise<NextResponse> | NextResponse;

/**
 * Apply CORS headers to a response
 */
export function applyCORSHeaders(
  response: NextResponse,
  origin: string | null,
  config: CORSConfig = DEFAULT_CORS_CONFIG
): NextResponse {
  const corsHeaders = generateCORSHeaders(origin, config);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Handle CORS preflight OPTIONS requests
 */
export async function handlePreflight(
  request: NextRequest,
  config: CORSConfig = DEFAULT_CORS_CONFIG
): Promise<NextResponse> {
  const origin = request.headers.get('origin');
  
  // Log preflight request
  logger.info('[CORS] Preflight request', {
    origin,
    method: request.method,
    url: request.url,
  });
  
  const response = new NextResponse(null, { 
    status: 204, // No Content
    headers: {
      'Content-Length': '0',
    },
  });
  
  return applyCORSHeaders(response, origin, config);
}

/**
 * Wrap an API handler with CORS support
 * 
 * @example
 * ```typescript
 * export const GET = withCORS(async (request) => {
 *   return NextResponse.json({ data: 'hello' });
 * });
 * 
 * export const POST = withCORS(async (request) => {
 *   const body = await request.json();
 *   return NextResponse.json({ success: true });
 * }, {
 *   allowedOrigins: ['https://example.com'],
 *   allowCredentials: true,
 * });
 * ```
 */
export function withCORS(
  handler: APIHandler,
  config: CORSConfig = DEFAULT_CORS_CONFIG
): APIHandler {
  return async (request: NextRequest, ...args: any[]) => {
    const origin = request.headers.get('origin');
    
    try {
      // Execute handler
      const response = await handler(request, ...args);
      
      // Apply CORS headers to response
      return applyCORSHeaders(response, origin, config);
    } catch (error) {
      logger.error('[CORS] Handler error', { error, origin });
      
      // Return error response with CORS headers
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error',
        },
        { status: 500 }
      );
      
      return applyCORSHeaders(errorResponse, origin, config);
    }
  };
}

/**
 * Create CORS-enabled OPTIONS handler
 * Call this in your route file to handle preflight requests
 * 
 * @example
 * ```typescript
 * export const OPTIONS = createOPTIONSHandler();
 * // Or with custom config:
 * export const OPTIONS = createOPTIONSHandler({
 *   allowedOrigins: ['https://example.com'],
 *   allowedMethods: ['GET', 'POST'],
 * });
 * ```
 */
export function createOPTIONSHandler(config: CORSConfig = DEFAULT_CORS_CONFIG): APIHandler {
  return async (request: NextRequest) => {
    return handlePreflight(request, config);
  };
}

/**
 * Strict CORS configuration - only allow specific origins
 */
export const STRICT_CORS_CONFIG: CORSConfig = {
  ...DEFAULT_CORS_CONFIG,
  origin: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://yourdomain.com',
    'https://www.yourdomain.com',
  ],
  credentials: true,
};

/**
 * Public API CORS configuration - allow any origin (read-only APIs)
 */
export const PUBLIC_CORS_CONFIG: CORSConfig = {
  ...DEFAULT_CORS_CONFIG,
  origin: '*',
  credentials: false,
};

/**
 * Development CORS configuration - permissive for local development
 */
export const DEV_CORS_CONFIG: CORSConfig = {
  ...DEFAULT_CORS_CONFIG,
  origin: '*',
  credentials: true,
};

/**
 * Get CORS config based on environment
 */
export function getCORSConfig(): CORSConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isDevelopment) {
    return DEV_CORS_CONFIG;
  }
  
  if (isProduction) {
    return STRICT_CORS_CONFIG;
  }
  
  return DEFAULT_CORS_CONFIG;
}

/**
 * Middleware to check if origin is allowed
 */
export function isOriginAllowed(
  origin: string | null,
  config: CORSConfig = DEFAULT_CORS_CONFIG
): boolean {
  if (!origin) {
    return true; // Same-origin requests don't have Origin header
  }
  
  const allowedOrigins = config.origin;
  
  // Allow all origins if * is specified
  if (allowedOrigins === '*') {
    return true;
  }
  
  // If allowedOrigins is a string, check exact match
  if (typeof allowedOrigins === 'string') {
    return allowedOrigins === origin;
  }
  
  // If allowedOrigins is an array, check if origin is in the list
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin);
  }
  
  return false;
}

/**
 * Validate CORS request
 */
export function validateCORSRequest(
  request: NextRequest,
  config: CORSConfig = DEFAULT_CORS_CONFIG
): { valid: boolean; error?: string } {
  const origin = request.headers.get('origin');
  const method = request.method;
  
  // Check if origin is allowed
  if (origin && !isOriginAllowed(origin, config)) {
    return {
      valid: false,
      error: `Origin ${origin} is not allowed`,
    };
  }
  
  // Check if method is allowed
  const allowedMethods = config.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  if (!allowedMethods.includes(method)) {
    return {
      valid: false,
      error: `Method ${method} is not allowed`,
    };
  }
  
  return { valid: true };
}

/**
 * Create a CORS-protected API handler with validation
 */
export function withCORSValidation(
  handler: APIHandler,
  config: CORSConfig = DEFAULT_CORS_CONFIG
): APIHandler {
  return async (request: NextRequest, ...args: any[]) => {
    // Validate CORS request
    const validation = validateCORSRequest(request, config);
    
    if (!validation.valid) {
      logger.warn('[CORS] Request blocked', {
        origin: request.headers.get('origin'),
        method: request.method,
        error: validation.error,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'CORS validation failed',
        },
        { status: 403 }
      );
    }
    
    // Proceed with CORS-enabled handler
    return withCORS(handler, config)(request, ...args);
  };
}

/**
 * Log CORS activity for debugging
 */
export function logCORSActivity(request: NextRequest, response: NextResponse): void {
  const origin = request.headers.get('origin');
  const method = request.method;
  const corsHeaders: Record<string, string> = {};
  
  // Extract CORS headers from response
  ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers'].forEach(
    (header) => {
      const value = response.headers.get(header);
      if (value) {
        corsHeaders[header] = value;
      }
    }
  );
  
  logger.debug('[CORS] Request processed', {
    origin,
    method,
    url: request.url,
    status: response.status,
    corsHeaders,
  });
}
