/**
 * Security Headers Configuration
 * Comprehensive security header management for HTTPS enforcement and attack prevention
 * 
 * Headers Implemented:
 * - HSTS (HTTP Strict Transport Security) - Forces HTTPS
 * - CSP (Content Security Policy) - Prevents XSS and code injection
 * - CORS (Cross-Origin Resource Sharing) - Controls API access
 * - X-Frame-Options - Prevents clickjacking
 * - X-Content-Type-Options - Prevents MIME sniffing
 * - And more...
 */

/**
 * Environment Configuration
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * Allowed Origins for CORS
 * Configure these based on your deployment
 */
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://yourdomain.com',
      'https://www.yourdomain.com',
    ];

/**
 * HSTS (HTTP Strict Transport Security)
 * Forces browsers to use HTTPS for all connections
 * 
 * max-age: 2 years (63072000 seconds)
 * includeSubDomains: Apply to all subdomains
 * preload: Eligible for browser HSTS preload list
 */
export const HSTS_HEADER = {
  key: 'Strict-Transport-Security',
  value: 'max-age=63072000; includeSubDomains; preload',
};

/**
 * Content Security Policy (CSP)
 * Defines allowed sources for scripts, styles, images, etc.
 * 
 * IMPORTANT: Customize based on your app's needs
 * - Remove 'unsafe-inline' and 'unsafe-eval' for maximum security
 * - Add trusted CDN domains (fonts.googleapis.com, cdn.jsdelivr.net, etc.)
 * - Add analytics domains (analytics.google.com, etc.)
 */
export const CSP_DIRECTIVES = {
  // Default fallback for all resource types
  'default-src': ["'self'"],
  
  // Script sources (JavaScript)
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js (remove if possible)
    "'unsafe-eval'",   // Required for Next.js dev mode
    // Add trusted script sources:
    // 'https://www.googletagmanager.com',
    // 'https://www.google-analytics.com',
  ],
  
  // Style sources (CSS)
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS (remove for inline styles)
    // Add trusted style sources:
    // 'https://fonts.googleapis.com',
  ],
  
  // Image sources
  'img-src': [
    "'self'",
    'data:',     // For inline images
    'https:',    // Allow HTTPS images
    'blob:',     // For object URLs
  ],
  
  // Font sources
  'font-src': [
    "'self'",
    'data:',
    // Add font CDNs:
    // 'https://fonts.gstatic.com',
  ],
  
  // AJAX, WebSocket, fetch() sources
  'connect-src': [
    "'self'",
    'https:',
    // Add API domains:
    // 'https://api.yourdomain.com',
    // 'wss://yourdomain.com',
  ],
  
  // Media sources (video/audio)
  'media-src': [
    "'self'",
    'https:',
  ],
  
  // Object/embed sources (plugins)
  'object-src': ["'none'"],
  
  // Frame sources (iframes)
  'frame-src': [
    "'self'",
    // Add trusted iframe sources:
    // 'https://www.youtube.com',
    // 'https://player.vimeo.com',
  ],
  
  // Worker sources (Web Workers, Service Workers)
  'worker-src': ["'self'", 'blob:'],
  
  // Form submission targets
  'form-action': ["'self'"],
  
  // Valid ancestors for iframe embedding
  'frame-ancestors': ["'none'"],
  
  // Base URI restrictions
  'base-uri': ["'self'"],
  
  // Manifest sources
  'manifest-src': ["'self'"],
  
  // Upgrade insecure requests (HTTP → HTTPS)
  'upgrade-insecure-requests': [],
  
  // Block mixed content
  'block-all-mixed-content': [],
};

/**
 * Generate CSP header string from directives
 */
export function generateCSPString(
  customDirectives?: Partial<typeof CSP_DIRECTIVES>
): string {
  const directives = { ...CSP_DIRECTIVES, ...customDirectives };
  
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * All Security Headers
 * Comprehensive set of security headers for protection
 */
export const SECURITY_HEADERS = {
  // HSTS - Force HTTPS
  'Strict-Transport-Security': HSTS_HEADER.value,
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS Protection (legacy, but still useful)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (disable unnecessary features)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC
    'payment=()',
    'usb=()',
  ].join(', '),
  
  // Content Security Policy
  'Content-Security-Policy': generateCSPString(),
  
  // DNS Prefetch Control
  'X-DNS-Prefetch-Control': 'on',
  
  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
} as const;

/**
 * CORS Headers Configuration
 */
export interface CORSConfig {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
}

export const DEFAULT_CORS_CONFIG: CORSConfig = {
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Generate CORS headers based on request origin
 */
export function generateCORSHeaders(
  origin: string | null,
  config: CORSConfig = DEFAULT_CORS_CONFIG
): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // Handle origin
  if (origin && config.origin) {
    const allowedOrigins = Array.isArray(config.origin)
      ? config.origin
      : [config.origin];
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    } else if (allowedOrigins.includes('*')) {
      headers['Access-Control-Allow-Origin'] = '*';
    }
  }
  
  // Methods
  if (config.methods) {
    headers['Access-Control-Allow-Methods'] = config.methods.join(', ');
  }
  
  // Allowed Headers
  if (config.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
  }
  
  // Exposed Headers
  if (config.exposedHeaders) {
    headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ');
  }
  
  // Credentials
  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  // Max Age
  if (config.maxAge !== undefined) {
    headers['Access-Control-Max-Age'] = String(config.maxAge);
  }
  
  // Vary header for caching
  headers['Vary'] = 'Origin';
  
  return headers;
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(
  origin: string | null,
  allowed: string | string[] = ALLOWED_ORIGINS
): boolean {
  if (!origin) return false;
  
  const allowedOrigins = Array.isArray(allowed) ? allowed : [allowed];
  
  // Check for wildcard
  if (allowedOrigins.includes('*')) return true;
  
  // Check for exact match
  if (allowedOrigins.includes(origin)) return true;
  
  // Check for pattern match (e.g., *.yourdomain.com)
  for (const allowedOrigin of allowedOrigins) {
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.slice(2);
      if (origin.endsWith(domain)) return true;
    }
  }
  
  return false;
}

/**
 * Security Headers for Development
 * Relaxed headers for local development
 */
export const DEV_SECURITY_HEADERS = {
  ...SECURITY_HEADERS,
  'Content-Security-Policy': generateCSPString({
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
  }),
  // No HSTS in development
  'Strict-Transport-Security': undefined,
} as const;

/**
 * Get appropriate headers based on environment
 */
export function getSecurityHeaders(): Record<string, string> {
  const headers = IS_DEVELOPMENT ? DEV_SECURITY_HEADERS : SECURITY_HEADERS;
  
  // Filter out undefined values
  return Object.fromEntries(
    Object.entries(headers).filter(([_, value]) => value !== undefined)
  ) as Record<string, string>;
}

/**
 * Apply security headers to a Response object
 */
export function applySecurityHeaders(
  response: Response,
  additionalHeaders?: Record<string, string>
): Response {
  const securityHeaders = getSecurityHeaders();
  
  Object.entries({ ...securityHeaders, ...additionalHeaders }).forEach(
    ([key, value]) => {
      if (value) {
        response.headers.set(key, value);
      }
    }
  );
  
  return response;
}

/**
 * HTTPS Enforcement Utilities
 */
export function isHTTPS(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

export function enforceHTTPS(url: string): string {
  if (IS_DEVELOPMENT) return url; // Allow HTTP in development
  
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'http:') {
      parsedUrl.protocol = 'https:';
    }
    return parsedUrl.toString();
  } catch {
    return url;
  }
}

/**
 * Security Headers Report
 * Generate a report of current security header configuration
 */
export interface SecurityHeadersReport {
  environment: 'production' | 'development';
  hstsEnabled: boolean;
  cspEnabled: boolean;
  corsConfigured: boolean;
  headers: Record<string, string>;
  recommendations: string[];
}

export function generateSecurityReport(): SecurityHeadersReport {
  const headers = getSecurityHeaders();
  const recommendations: string[] = [];
  
  // Check for common security issues
  if (headers['Content-Security-Policy']?.includes('unsafe-inline')) {
    recommendations.push(
      "CSP contains 'unsafe-inline' - consider using nonces or hashes for inline scripts/styles"
    );
  }
  
  if (headers['Content-Security-Policy']?.includes('unsafe-eval')) {
    recommendations.push(
      "CSP contains 'unsafe-eval' - avoid eval() and Function() constructors"
    );
  }
  
  if (!headers['Strict-Transport-Security'] && IS_PRODUCTION) {
    recommendations.push('HSTS header is missing in production - enforce HTTPS');
  }
  
  if (ALLOWED_ORIGINS.includes('*')) {
    recommendations.push(
      'CORS allows all origins (*) - restrict to specific domains in production'
    );
  }
  
  return {
    environment: IS_PRODUCTION ? 'production' : 'development',
    hstsEnabled: !!headers['Strict-Transport-Security'],
    cspEnabled: !!headers['Content-Security-Policy'],
    corsConfigured: ALLOWED_ORIGINS.length > 0,
    headers,
    recommendations,
  };
}

/**
 * CSP Violation Reporter
 * Parse and log CSP violation reports
 */
export interface CSPViolation {
  'document-uri': string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  disposition: 'enforce' | 'report';
  'blocked-uri': string;
  'line-number': number;
  'column-number': number;
  'source-file': string;
  'status-code': number;
  'script-sample': string;
}

export function logCSPViolation(violation: CSPViolation): void {
  console.error('[CSP Violation]', {
    directive: violation['violated-directive'],
    blocked: violation['blocked-uri'],
    source: violation['source-file'],
    line: violation['line-number'],
    timestamp: new Date().toISOString(),
  });
  
  // In production, send to monitoring service
  if (IS_PRODUCTION) {
    // Example: Send to Sentry, DataDog, or custom endpoint
    // sendToMonitoring('csp-violation', violation);
  }
}
