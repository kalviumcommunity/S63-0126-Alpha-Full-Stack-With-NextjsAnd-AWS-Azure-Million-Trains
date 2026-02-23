# HTTPS Enforcement & Security Headers Implementation Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [HTTPS Enforcement](#https-enforcement)
3. [Security Headers](#security-headers)
4. [CORS Configuration](#cors-configuration)
5. [Implementation Details](#implementation-details)
6. [Testing & Verification](#testing--verification)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers the implementation of HTTPS enforcement and security headers in the Train Tracker application. These security measures form the third layer of our defense-in-depth strategy:

1. **Layer 1 (RBAC)**: Controls WHO can access resources
2. **Layer 2 (Input Sanitization)**: Validates WHAT data enters the system
3. **Layer 3 (HTTPS/Headers)**: Secures HOW data travels and renders

### Purpose

- **Prevent Protocol Downgrade Attacks**: Force HTTPS connections with HSTS
- **Block XSS Attacks**: Control resource loading with CSP
- **Prevent Clickjacking**: Block iframe embedding with X-Frame-Options
- **Control Cross-Origin Access**: Protect APIs with CORS headers
- **Enable Browser Security Features**: Leverage modern security features

---

## HTTPS Enforcement

### Strict Transport Security (HSTS)

HSTS forces browsers to use HTTPS for all connections to your domain.

#### Configuration

```javascript
// next.config.mjs
{
  key: 'Strict-Transport-Security',
  value: 'max-age=63072000; includeSubDomains; preload'
}
```

#### Parameters

- `max-age=63072000`: Cache HTTPS requirement for 2 years (730 days)
- `includeSubDomains`: Apply to all subdomains
- `preload`: Eligible for browser preload list

#### Benefits

✅ Prevents man-in-the-middle (MITM) attacks  
✅ Blocks SSL stripping attacks  
✅ Automatic HTTPS redirection  
✅ Improved SEO ranking  

#### Preload List Submission

To submit your domain to the HSTS preload list:

1. Visit: https://hstspreload.org/
2. Enter your domain
3. Ensure you meet requirements:
   - Valid SSL certificate
   - Redirects HTTP to HTTPS
   - HSTS header with preload directive
4. Submit and wait for inclusion (2-3 months)

---

## Security Headers

### 1. Content Security Policy (CSP)

Controls which resources can be loaded to prevent XSS attacks.

#### Configuration

```javascript
// lib/security-headers.ts
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
  'block-all-mixed-content': [],
};
```

#### Directive Explanations

| Directive | Purpose | Value |
|-----------|---------|-------|
| `default-src` | Default policy for all resource types | `'self'` (same origin only) |
| `script-src` | JavaScript sources | `'self'` + inline/eval for Next.js |
| `style-src` | CSS sources | `'self'` + inline for Tailwind |
| `img-src` | Image sources | `'self'`, data URIs, HTTPS |
| `connect-src` | Fetch/XHR/WebSocket sources | `'self'` (API calls) |
| `object-src` | Plugin sources (Flash, etc.) | `'none'` (disabled) |
| `frame-ancestors` | Embed in frames | `'none'` (clickjacking protection) |
| `base-uri` | `<base>` tag URLs | `'self'` |
| `form-action` | Form submission URLs | `'self'` |

#### CSP Violation Reporting

```typescript
// lib/security-headers.ts
export function logCSPViolation(violation: {
  documentURI: string;
  blockedURI: string;
  violatedDirective: string;
}): void {
  logger.warn('[CSP] Violation detected', {
    document: violation.documentURI,
    blocked: violation.blockedURI,
    directive: violation.violatedDirective,
  });
}
```

### 2. X-Frame-Options

Prevents clickjacking by controlling iframe embedding.

```javascript
{
  key: 'X-Frame-Options',
  value: 'DENY'
}
```

**Options:**
- `DENY`: Cannot be embedded in any frame
- `SAMEORIGIN`: Can be embedded in same-origin frames only
- `ALLOW-FROM uri`: Can be embedded in specified origin (deprecated)

### 3. X-Content-Type-Options

Prevents MIME-sniffing attacks.

```javascript
{
  key: 'X-Content-Type-Options',
  value: 'nosniff'
}
```

Forces browsers to respect the declared `Content-Type` header.

### 4. Referrer-Policy

Controls how much referrer information is shared.

```javascript
{
  key: 'Referrer-Policy',
  value: 'strict-origin-when-cross-origin'
}
```

**Options:**
- `no-referrer`: Never send referrer
- `strict-origin`: Send origin only on HTTPS → HTTPS
- `strict-origin-when-cross-origin`: Full URL for same-origin, origin only for cross-origin (recommended)

### 5. Permissions-Policy

Controls browser features like camera, microphone, geolocation.

```javascript
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=()'
}
```

Disables sensitive features unless explicitly needed.

### 6. Cross-Origin Policies

#### COEP (Cross-Origin-Embedder-Policy)

```javascript
{
  key: 'Cross-Origin-Embedder-Policy',
  value: 'require-corp'
}
```

Prevents documents from loading cross-origin resources without explicit permission.

#### COOP (Cross-Origin-Opener-Policy)

```javascript
{
  key: 'Cross-Origin-Opener-Policy',
  value: 'same-origin'
}
```

Isolates browsing context from cross-origin windows.

#### CORP (Cross-Origin-Resource-Policy)

```javascript
{
  key: 'Cross-Origin-Resource-Policy',
  value: 'same-origin'
}
```

Controls which origins can load this resource.

---

## CORS Configuration

### Overview

CORS (Cross-Origin Resource Sharing) controls which origins can access your API.

### Configuration Types

#### 1. Strict CORS (Authentication Endpoints)

```typescript
// lib/cors-middleware.ts
export const STRICT_CORS_CONFIG: CORSConfig = {
  origin: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://yourdomain.com',
    'https://www.yourdomain.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};
```

**Use for:**
- Authentication endpoints (`/api/auth/*`)
- Admin endpoints (`/api/admin/*`)
- User management (`/api/users/*`)

#### 2. Public CORS (Read-Only APIs)

```typescript
export const PUBLIC_CORS_CONFIG: CORSConfig = {
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
  maxAge: 86400,
};
```

**Use for:**
- Public train data (`/api/trains/*`)
- Station information
- Schedule queries
- Read-only endpoints

#### 3. Development CORS

```typescript
export const DEV_CORS_CONFIG: CORSConfig = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 0, // No caching in development
};
```

**Use for:**
- Local development
- Testing
- Debugging

### CORS Middleware Usage

#### Basic Usage

```typescript
// app/api/some-endpoint/route.ts
import { withCORS, createOPTIONSHandler } from '@/lib/cors-middleware';

// Handle preflight
export const OPTIONS = createOPTIONSHandler();

// Wrap handler with CORS
export const GET = withCORS(async (request) => {
  return NextResponse.json({ data: 'hello' });
});
```

#### With Custom Config

```typescript
import { withCORS, createOPTIONSHandler, STRICT_CORS_CONFIG } from '@/lib/cors-middleware';

export const OPTIONS = createOPTIONSHandler(STRICT_CORS_CONFIG);

export const POST = withCORS(async (request) => {
  // Handler logic
}, STRICT_CORS_CONFIG);
```

#### With RBAC

```typescript
import { withCORS } from '@/lib/cors-middleware';
import { withPermission } from '@/lib/rbac-middleware';
import { Permission } from '@/lib/rbac-config';

export const GET = withCORS(
  withPermission(Permission.USER_LIST, async (request, user) => {
    // Handler logic
  }),
  STRICT_CORS_CONFIG
);
```

### CORS Request Flow

```
1. Browser sends OPTIONS preflight request
   ↓
2. createOPTIONSHandler() returns 204 with CORS headers
   ↓
3. Browser validates CORS headers
   ↓
4. Browser sends actual request (GET, POST, etc.)
   ↓
5. withCORS() wraps handler and adds CORS headers to response
   ↓
6. Response sent to browser
```

### CORS Headers Explained

| Header | Purpose |
|--------|---------|
| `Access-Control-Allow-Origin` | Which origin can access the resource |
| `Access-Control-Allow-Methods` | Which HTTP methods are allowed |
| `Access-Control-Allow-Headers` | Which request headers are allowed |
| `Access-Control-Expose-Headers` | Which response headers JavaScript can access |
| `Access-Control-Allow-Credentials` | Whether cookies/auth can be sent |
| `Access-Control-Max-Age` | How long to cache preflight response |

---

## Implementation Details

### File Structure

```
train-tracker/
├── next.config.mjs                          # Global security headers
├── lib/
│   ├── security-headers.ts                  # Security headers utilities
│   └── cors-middleware.ts                   # CORS middleware
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── route.ts                 # STRICT_CORS_CONFIG
│   │   ├── admin/
│   │   │   └── users/
│   │   │       └── route.ts                 # STRICT_CORS_CONFIG
│   │   ├── trains/
│   │   │   └── search/
│   │   │       └── route.ts                 # PUBLIC_CORS_CONFIG
│   │   └── security/
│   │       ├── comments/
│   │       │   └── route.ts                 # Default CORS
│   │       └── headers-check/
│   │           └── route.ts                 # Headers verification
│   └── headers-demo/
│       └── page.tsx                         # Interactive demo
```

### Security Headers Application

Security headers are applied at **three levels**:

#### 1. Global (Next.js Config)

```javascript
// next.config.mjs
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        // All security headers
      ]
    }
  ];
}
```

Applies to **all routes** by default.

#### 2. API Route Level

```typescript
// app/api/*/route.ts
import { getSecurityHeaders } from '@/lib/security-headers';

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ data });
  
  // Apply security headers
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
```

Applies to **specific API routes**.

#### 3. Middleware Level

```typescript
// middleware.ts
import { getSecurityHeaders } from '@/lib/security-headers';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
```

Applies to **all routes matching middleware config**.

### Environment-Specific Configuration

```typescript
// lib/security-headers.ts
export function getSecurityHeaders(): Record<string, string> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  const headers: Record<string, string> = {
    'Strict-Transport-Security': HSTS_HEADER,
    'Content-Security-Policy': generateCSPString(),
    // ... other headers
  };
  
  if (isDevelopment) {
    // Relax CSP in development
    headers['Content-Security-Policy'] = generateCSPString({
      'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
    });
  }
  
  return headers;
}
```

---

## Testing & Verification

### 1. Interactive Demo Page

Visit: **http://localhost:3000/headers-demo**

Features:
- ✅ Real-time header verification
- ✅ Protocol check (HTTP vs HTTPS)
- ✅ Security score calculation
- ✅ CORS preflight testing
- ✅ Detailed header information

### 2. Browser DevTools

#### Check Response Headers

```javascript
// Open DevTools → Network tab
// Reload page
// Click any request
// View "Response Headers" section
```

Look for:
- `strict-transport-security`
- `content-security-policy`
- `x-frame-options`
- `x-content-type-options`

#### Check CSP Violations

```javascript
// Open DevTools → Console tab
// Look for CSP violation warnings
```

### 3. Command Line Testing

#### Test HSTS Header

```bash
curl -I https://yourdomain.com
```

Look for:
```
strict-transport-security: max-age=63072000; includeSubDomains; preload
```

#### Test CORS Preflight

```bash
curl -X OPTIONS https://yourdomain.com/api/auth/login \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Look for:
```
access-control-allow-origin: https://example.com
access-control-allow-methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

#### Test All Headers

```bash
curl -I https://yourdomain.com | grep -E "(strict-transport|content-security|x-frame|x-content)"
```

### 4. Online Security Scanners

#### SecurityHeaders.com

1. Visit: https://securityheaders.com
2. Enter your domain
3. Review security score (aim for A+)

#### Mozilla Observatory

1. Visit: https://observatory.mozilla.org
2. Enter your domain
3. Review detailed security analysis

#### SSL Labs

1. Visit: https://www.ssllabs.com/ssltest/
2. Enter your domain
3. Review SSL/TLS configuration (aim for A+)

### 5. Automated Testing

```typescript
// __tests__/security-headers.test.ts
describe('Security Headers', () => {
  it('should include HSTS header', async () => {
    const response = await fetch('http://localhost:3000');
    const hsts = response.headers.get('strict-transport-security');
    expect(hsts).toContain('max-age=63072000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });
  
  it('should include CSP header', async () => {
    const response = await fetch('http://localhost:3000');
    const csp = response.headers.get('content-security-policy');
    expect(csp).toContain("default-src 'self'");
  });
  
  it('should include X-Frame-Options', async () => {
    const response = await fetch('http://localhost:3000');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  });
});
```

---

## Best Practices

### 1. HTTPS Everywhere

✅ **DO:**
- Use HTTPS in production
- Redirect HTTP to HTTPS
- Use HSTS with long max-age
- Submit to HSTS preload list

❌ **DON'T:**
- Serve mixed content (HTTP resources on HTTPS pages)
- Use self-signed certificates in production
- Skip SSL certificate validation

### 2. CSP Configuration

✅ **DO:**
- Start with strict policy: `default-src 'self'`
- Add directives as needed
- Monitor CSP violations
- Use nonces for inline scripts in production

❌ **DON'T:**
- Use `'unsafe-inline'` or `'unsafe-eval'` in production
- Allow `*` (all sources)
- Ignore CSP violations

### 3. CORS Configuration

✅ **DO:**
- Use specific origins for authentication endpoints
- Set `credentials: true` only when needed
- Use different configs for different endpoints
- Cache preflight responses with `maxAge`

❌ **DON'T:**
- Use `origin: '*'` with `credentials: true`
- Allow all methods unnecessarily
- Expose sensitive headers

### 4. Header Maintenance

✅ **DO:**
- Review headers quarterly
- Update CSP as features change
- Test headers after deployments
- Monitor security scanner results

❌ **DON'T:**
- Set headers once and forget
- Copy configurations blindly
- Ignore security warnings

---

## Troubleshooting

### CSP Blocking Resources

**Problem:** CSP blocks legitimate resources.

**Solution:**
1. Check browser console for CSP violations
2. Identify blocked resource (script, style, image, etc.)
3. Update CSP directive to allow the source:
   ```typescript
   'script-src': ["'self'", 'https://trusted-cdn.com']
   ```

### CORS Preflight Failing

**Problem:** Browser blocks API requests with CORS error.

**Solution:**
1. Ensure OPTIONS handler exists:
   ```typescript
   export const OPTIONS = createOPTIONSHandler();
   ```
2. Check origin is in allowed list
3. Verify methods match
4. Check credentials setting matches request

### HSTS Not Working

**Problem:** Browser not redirecting HTTP to HTTPS.

**Solution:**
1. Verify HTTPS is working
2. Check HSTS header is present
3. Clear browser HSTS cache:
   - Chrome: `chrome://net-internals/#hsts`
   - Enter domain and click "Delete"
4. Wait for max-age to expire or retest

### Headers Not Appearing

**Problem:** Security headers missing from responses.

**Solution:**
1. Check next.config.mjs is properly configured
2. Verify headers() function is exported
3. Restart development server
4. Clear Next.js cache: `rm -rf .next`
5. Check middleware is not stripping headers

### Mixed Content Warnings

**Problem:** HTTPS page loading HTTP resources.

**Solution:**
1. Update resource URLs to HTTPS
2. Use protocol-relative URLs: `//example.com/image.jpg`
3. Add `upgrade-insecure-requests` to CSP:
   ```typescript
   'upgrade-insecure-requests': []
   ```

---

## Security Checklist

### Pre-Deployment

- [ ] HTTPS certificate installed and valid
- [ ] HTTP redirects to HTTPS
- [ ] HSTS header configured with long max-age
- [ ] CSP configured and tested
- [ ] CORS restricted to known origins
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] Permissions-Policy configured
- [ ] Cross-origin policies configured

### Post-Deployment

- [ ] Test with SecurityHeaders.com (score: A+)
- [ ] Test with Mozilla Observatory
- [ ] Test with SSL Labs (score: A+)
- [ ] Verify CORS from allowed origins
- [ ] Check CSP violations in production
- [ ] Monitor security logs
- [ ] Submit to HSTS preload list

---

## Additional Resources

### Documentation

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

### Tools

- [SecurityHeaders.com](https://securityheaders.com) - Header scanner
- [Mozilla Observatory](https://observatory.mozilla.org) - Security analysis
- [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL/TLS testing
- [HSTS Preload](https://hstspreload.org/) - HSTS preload list

### Related Guides

- [RBAC_IMPLEMENTATION_GUIDE.md](./RBAC_IMPLEMENTATION_GUIDE.md) - Authentication & authorization
- [OWASP_COMPLIANCE_GUIDE.md](./OWASP_COMPLIANCE_GUIDE.md) - Input sanitization & XSS prevention
- [SECURITY_TESTING_GUIDE.md](./SECURITY_TESTING_GUIDE.md) - Security testing procedures

---

## Summary

This implementation provides:

✅ **HTTPS Enforcement** with HSTS preload eligibility  
✅ **XSS Protection** with comprehensive CSP  
✅ **Clickjacking Protection** with X-Frame-Options  
✅ **MIME-Sniffing Protection** with X-Content-Type-Options  
✅ **CORS Protection** with environment-specific configs  
✅ **Cross-Origin Isolation** with COEP/COOP/CORP  
✅ **Feature Control** with Permissions-Policy  
✅ **Interactive Testing** with /headers-demo page  

Your application now has **enterprise-grade transport security** that complements the existing RBAC and input sanitization layers for complete protection.
