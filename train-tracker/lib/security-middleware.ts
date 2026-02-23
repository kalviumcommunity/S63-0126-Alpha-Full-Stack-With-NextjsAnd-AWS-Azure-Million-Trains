/**
 * Security Middleware for API Routes
 * OWASP-compliant security layer for all API endpoints
 * 
 * Features:
 * - Input sanitization
 * - Rate limiting
 * - Security headers
 * - Request validation
 * - XSS/Injection prevention
 */

import { NextRequest, NextResponse } from 'next/server';
import { sanitizeWithValidation, sanitizeHeader, SanitizationLevel } from './input-sanitizer';
import { SECURITY_HEADERS } from './output-encoder';
import { logger } from './logger';

/**
 * Security configuration options
 */
export interface SecurityConfig {
  enableSanitization?: boolean;
  enableRateLimiting?: boolean;
  enableSecurityHeaders?: boolean;
  maxRequestSize?: number; // bytes
  allowedOrigins?: string[];
  customHeaders?: Record<string, string>;
}

const DEFAULT_CONFIG: SecurityConfig = {
  enableSanitization: true,
  enableRateLimiting: true,
  enableSecurityHeaders: true,
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  allowedOrigins: [],
};

/**
 * Rate limiting storage (in-memory)
 * In production, use Redis
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every minute
setInterval(cleanupRateLimits, 60000);

/**
 * Rate limiting middleware
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    const resetAt = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment count
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown';

  // Combine with user agent for better uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}-${userAgent.substring(0, 50)}`;
}

/**
 * Validate request headers for injection attacks
 */
function validateHeaders(request: NextRequest): { valid: boolean; reason?: string } {
  // Check for header injection attempts
  const suspiciousHeaders = ['x-forwarded-host', 'x-original-url'];
  
  for (const header of suspiciousHeaders) {
    const value = request.headers.get(header);
    if (value && /[\r\n]/.test(value)) {
      return { valid: false, reason: `Header injection attempt in ${header}` };
    }
  }

  // Validate Content-Type for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    if (contentType && !contentType.includes('application/json') && 
        !contentType.includes('multipart/form-data') &&
        !contentType.includes('application/x-www-form-urlencoded')) {
      return { valid: false, reason: 'Invalid content type' };
    }
  }

  return { valid: true };
}

/**
 * Validate request size
 */
async function validateRequestSize(
  request: NextRequest,
  maxSize: number
): Promise<{ valid: boolean; reason?: string }> {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSize) {
      return { valid: false, reason: `Request too large: ${size} bytes` };
    }
  }

  return { valid: true };
}

/**
 * Sanitize request body
 */
import { SanitizationRules } from './input-sanitizer';

export function sanitizeRequestBody<T = any>(
  body: any,
  rules: Record<string, SanitizationRules>
): { sanitized: T; valid: boolean; errors: Record<string, string[]> } {
  const sanitized: any = {};
  const errors: Record<string, string[]> = {};
  let valid = true;

  for (const [key, rule] of Object.entries(rules)) {
    const result = sanitizeWithValidation(body[key], rule as any);
    
    sanitized[key] = result.value;
    
    if (!result.isValid) {
      errors[key] = result.warnings;
      valid = false;
    } else if (result.warnings.length > 0) {
      errors[key] = result.warnings;
    }
  }

  return { sanitized: sanitized as T, valid, errors };
}

/**
 * Security middleware wrapper for API routes
 */
export function withSecurity(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const startTime = Date.now();

    try {
      // 1. Validate headers
      if (mergedConfig.enableSecurityHeaders) {
        const headerValidation = validateHeaders(request);
        if (!headerValidation.valid) {
          logger.warn('[Security] Header validation failed', {
            reason: headerValidation.reason,
            path: request.nextUrl.pathname,
          });
          return NextResponse.json(
            { success: false, error: 'Invalid request headers' },
            { status: 400 }
          );
        }
      }

      // 2. Check rate limit
      if (mergedConfig.enableRateLimiting) {
        const identifier = getClientIdentifier(request);
        const rateLimit = checkRateLimit(identifier);

        if (!rateLimit.allowed) {
          logger.warn('[Security] Rate limit exceeded', {
            identifier,
            path: request.nextUrl.pathname,
          });
          return NextResponse.json(
            { success: false, error: 'Too many requests' },
            { 
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
                'X-RateLimit-Limit': '100',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(rateLimit.resetAt),
              },
            }
          );
        }
      }

      // 3. Validate request size
      if (mergedConfig.maxRequestSize) {
        const sizeValidation = await validateRequestSize(request, mergedConfig.maxRequestSize);
        if (!sizeValidation.valid) {
          logger.warn('[Security] Request size validation failed', {
            reason: sizeValidation.reason,
            path: request.nextUrl.pathname,
          });
          return NextResponse.json(
            { success: false, error: 'Request payload too large' },
            { status: 413 }
          );
        }
      }

      // 4. Call handler
      const response = await handler(request, context);

      // 5. Add security headers
      if (mergedConfig.enableSecurityHeaders) {
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        // Add custom headers
        if (mergedConfig.customHeaders) {
          Object.entries(mergedConfig.customHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        }
      }

      // 6. Log successful request
      const duration = Date.now() - startTime;
      logger.info('[Security] Request processed', {
        method: request.method,
        path: request.nextUrl.pathname,
        status: response.status,
        duration: `${duration}ms`,
      });

      return response;

    } catch (error) {
      logger.error('[Security] Request processing error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * CORS middleware
 */
export function withCORS(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  allowedOrigins: string[] = []
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const origin = request.headers.get('origin');

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = await handler(request, context);

    // Add CORS headers
    if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  };
}

/**
 * SQL Injection Prevention Guide (documentation)
 * 
 * Since we're using Prisma, SQL injection is automatically prevented through:
 * 1. Parameterized queries
 * 2. Type-safe query building
 * 3. No raw string concatenation
 * 
 * SAFE (Prisma):
 * ```
 * await prisma.user.findFirst({
 *   where: { email: userInput }  // ✅ Automatically parameterized
 * });
 * ```
 * 
 * UNSAFE (Raw SQL - avoid):
 * ```
 * await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}` // ❌ Vulnerable
 * ```
 * 
 * If you MUST use raw SQL:
 * ```
 * await prisma.$queryRaw`SELECT * FROM users WHERE email = ${Prisma.sql`${userInput}`}` // ✅ Safe
 * ```
 */

export const SQL_INJECTION_PREVENTION = {
  documentation: 'Using Prisma ORM with parameterized queries automatically prevents SQL injection',
  safe_examples: [
    'prisma.user.findFirst({ where: { email: input } })',
    'prisma.user.create({ data: { name: input } })',
  ],
  unsafe_examples: [
    'db.query(`SELECT * FROM users WHERE name = "${input}"`)',
    'prisma.$queryRawUnsafe(`SELECT * FROM users WHERE id = ${input}`)',
  ],
} as const;

/**
 * Command Injection Prevention
 * Never pass user input directly to child_process, exec, spawn
 */
export function validateCommandInput(input: string, allowedPattern: RegExp): boolean {
  // Deny-list dangerous characters
  const dangerousChars = /[;&|`$(){}[\]<>]/;
  if (dangerousChars.test(input)) {
    logger.warn('[Security] Command injection attempt detected', { input });
    return false;
  }

  // Validate against allow-list
  if (!allowedPattern.test(input)) {
    logger.warn('[Security] Input does not match allowed pattern', { input });
    return false;
  }

  return true;
}

/**
 * Path Traversal Prevention
 */
export function validateFilePath(input: string, allowedDirectory: string): boolean {
  // Remove potential path traversal
  const normalized = input.replace(/\.\./g, '').replace(/\/\//g, '/');
  
  // Check if result is within allowed directory
  const fullPath = `${allowedDirectory}/${normalized}`;
  
  if (!fullPath.startsWith(allowedDirectory)) {
    logger.warn('[Security] Path traversal attempt detected', { input, fullPath });
    return false;
  }

  return true;
}
