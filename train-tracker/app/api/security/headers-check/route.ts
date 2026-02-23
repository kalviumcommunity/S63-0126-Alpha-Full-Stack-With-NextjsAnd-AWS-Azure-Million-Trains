/**
 * Security Headers Check API
 * Returns headers for verification by the headers demo page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders, generateSecurityReport } from '@/lib/security-headers';
import { withCORS, createOPTIONSHandler } from '@/lib/cors-middleware';

/**
 * OPTIONS /api/security/headers-check
 * Handle CORS preflight requests
 */
export const OPTIONS = createOPTIONSHandler();

/**
 * GET /api/security/headers-check
 * Returns security headers information for testing and verification
 */
export const GET = withCORS(async (request: NextRequest) => {
  try {
    // Get security headers configuration
    const securityHeaders = getSecurityHeaders();
    
    // Generate security report
    const report = generateSecurityReport();
    
    // Get request headers
    const requestHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      requestHeaders[key] = value;
    });
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Security headers check successful',
      data: {
        securityHeaders,
        report,
        requestHeaders,
        protocol: request.nextUrl.protocol,
        host: request.nextUrl.host,
        timestamp: new Date().toISOString(),
      },
    });
    
    // Apply security headers to response
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('[Headers Check API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check security headers',
      },
      { status: 500 }
    );
  }
});
