/**
 * Secure Comment API - Demonstrates Input Sanitization & XSS Prevention
 * This endpoint shows OWASP-compliant security practices
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, sanitizeRequestBody } from '@/lib/security-middleware';
import { SanitizationLevel, SanitizationRules } from '@/lib/input-sanitizer';
import { logger } from '@/lib/logger';
import { withCORS, createOPTIONSHandler } from '@/lib/cors-middleware';

// In-memory storage for demo (use database in production)
let comments: Array<{
  id: string;
  content: string;
  contentRaw: string; // Original input for comparison
  author: string;
  createdAt: string;
  sanitizationLevel: string;
}> = [];

/**
 * OPTIONS /api/security/comments
 * Handle CORS preflight requests
 */
export const OPTIONS = createOPTIONSHandler();

/**
 * GET /api/security/comments
 * Retrieve all comments
 */
export const GET = withCORS(withSecurity(async (request: NextRequest) => {
  try {
    return NextResponse.json({
      success: true,
      data: comments,
      meta: {
        total: comments.length,
        message: 'All comments are sanitized to prevent XSS attacks',
      },
    });
  } catch (error) {
    logger.error('[Comments API] GET error', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}));

/**
 * POST /api/security/comments
 * Create a new comment with sanitization
 */
export const POST = withCORS(withSecurity(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Define sanitization rules
    const { sanitized, valid, errors } = sanitizeRequestBody(body, {
      content: {
        type: 'string',
        level: SanitizationLevel.BASIC, // Strips dangerous HTML, allows basic formatting
        required: true,
        minLength: 1,
        maxLength: 1000,
      },
      author: {
        type: 'string',
        level: SanitizationLevel.STRICT, // No HTML allowed in names
        required: true,
        minLength: 2,
        maxLength: 50,
      },
    });

    // Check validation
    if (!valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          errors,
        },
        { status: 400 }
      );
    }

    // Store sanitized comment
    const comment = {
      id: Date.now().toString(),
      content: sanitized.content,
      contentRaw: body.content, // Keep original for demo purposes
      author: sanitized.author,
      createdAt: new Date().toISOString(),
      sanitizationLevel: 'BASIC',
    };

    comments.push(comment);

    // Log security event
    logger.info('[Comments API] Comment created with sanitization', {
      commentId: comment.id,
      author: sanitized.author,
      hadHTML: body.content !== sanitized.content,
    });

    return NextResponse.json({
      success: true,
      data: comment,
      meta: {
        sanitized: body.content !== sanitized.content,
        message: 'Comment sanitized and stored safely',
      },
    }, { status: 201 });

  } catch (error) {
    logger.error('[Comments API] POST error', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}));

/**
 * DELETE /api/security/comments
 * Clear all comments (for demo purposes)
 */
export const DELETE = withCORS(withSecurity(async (request: NextRequest) => {
  const count = comments.length;
  comments = [];

  return NextResponse.json({
    success: true,
    message: `Deleted ${count} comments`,
  });
}));
