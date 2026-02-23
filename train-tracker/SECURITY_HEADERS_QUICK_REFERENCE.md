# Security Headers & CORS - Quick Reference

## 🚀 Quick Start

### Add CORS to Your API Route

```typescript
// app/api/your-endpoint/route.ts
import { withCORS, createOPTIONSHandler } from '@/lib/cors-middleware';

// 1. Add OPTIONS handler
export const OPTIONS = createOPTIONSHandler();

// 2. Wrap your handler with withCORS
export const GET = withCORS(async (request) => {
  return NextResponse.json({ data: 'your data' });
});
```

### Choose the Right CORS Config

```typescript
import { STRICT_CORS_CONFIG, PUBLIC_CORS_CONFIG } from '@/lib/cors-middleware';

// For authentication/admin endpoints (strict origins)
export const OPTIONS = createOPTIONSHandler(STRICT_CORS_CONFIG);
export const POST = withCORS(handler, STRICT_CORS_CONFIG);

// For public read-only APIs (allow all origins)
export const OPTIONS = createOPTIONSHandler(PUBLIC_CORS_CONFIG);
export const GET = withCORS(handler, PUBLIC_CORS_CONFIG);
```

### Combine with RBAC

```typescript
import { withCORS, STRICT_CORS_CONFIG } from '@/lib/cors-middleware';
import { withPermission } from '@/lib/rbac-middleware';
import { Permission } from '@/lib/rbac-config';

export const GET = withCORS(
  withPermission(Permission.USER_LIST, async (request, user) => {
    // Your handler logic
  }),
  STRICT_CORS_CONFIG
);
```

---

## 📦 CORS Configurations

### STRICT_CORS_CONFIG
**Use for**: Authentication, Admin, User Management

```typescript
{
  origin: [
    'http://localhost:3000',
    'https://yourdomain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}
```

### PUBLIC_CORS_CONFIG
**Use for**: Public APIs, Train Data, Read-Only Endpoints

```typescript
{
  origin: '*',
  credentials: false,
  methods: ['GET', 'OPTIONS']
}
```

### DEV_CORS_CONFIG
**Use for**: Development Only

```typescript
{
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}
```

---

## 🔒 Security Headers Reference

### Critical Headers

```typescript
'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ..."
'X-Frame-Options': 'DENY'
```

### Medium Priority Headers

```typescript
'X-Content-Type-Options': 'nosniff'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
```

### Cross-Origin Headers

```typescript
'Cross-Origin-Embedder-Policy': 'require-corp'
'Cross-Origin-Opener-Policy': 'same-origin'
'Cross-Origin-Resource-Policy': 'same-origin'
```

---

## 🧪 Testing Commands

### Test HSTS
```bash
curl -I https://yourdomain.com | grep strict-transport
```

### Test CORS Preflight
```bash
curl -X OPTIONS https://yourdomain.com/api/auth/login \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Test All Headers
```bash
curl -I https://yourdomain.com
```

### Test Interactive Demo
```
Visit: http://localhost:3000/headers-demo
```

---

## 🔧 Common Issues

### Issue: CORS Error "No 'Access-Control-Allow-Origin' header"

**Solution**:
```typescript
// Add OPTIONS handler
export const OPTIONS = createOPTIONSHandler();

// Wrap handler with withCORS
export const GET = withCORS(async (request) => {
  // ...
});
```

### Issue: CSP Blocking Your Scripts

**Solution** (Development only):
```typescript
// In next.config.mjs, update CSP for dev
const csp = isDevelopment
  ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
  : "default-src 'self'; script-src 'self';";
```

### Issue: HSTS Not Working

**Solution**:
1. Ensure HTTPS is configured
2. Clear HSTS cache:
   - Chrome: `chrome://net-internals/#hsts`
3. Check header is present: `curl -I https://yourdomain.com`

---

## 📊 Security Score Targets

| Tool | Target | URL |
|------|--------|-----|
| SecurityHeaders.com | A+ | https://securityheaders.com |
| Mozilla Observatory | 90+ | https://observatory.mozilla.org |
| SSL Labs | A+ | https://www.ssllabs.com/ssltest/ |

---

## 📚 Full Documentation

- **Comprehensive Guide**: [HTTPS_SECURITY_GUIDE.md](./HTTPS_SECURITY_GUIDE.md)
- **Implementation Summary**: [HTTPS_IMPLEMENTATION_SUMMARY.md](./HTTPS_IMPLEMENTATION_SUMMARY.md)
- **Main README**: [Readme.md](../Readme.md#https-enforcement--security-headers)

---

## 🎯 Quick Checklist

### Before Deployment
- [ ] All API routes have OPTIONS handler
- [ ] Authentication routes use STRICT_CORS_CONFIG
- [ ] Public routes use PUBLIC_CORS_CONFIG
- [ ] SSL certificate installed
- [ ] HTTP → HTTPS redirect configured

### After Deployment
- [ ] Test with SecurityHeaders.com (expect A+)
- [ ] Verify CORS from allowed origins
- [ ] Check CSP violations in logs
- [ ] Monitor security metrics

---

## 💡 Best Practices

### DO ✅
- Use STRICT_CORS_CONFIG for auth endpoints
- Use PUBLIC_CORS_CONFIG for read-only APIs
- Test CORS with curl before deployment
- Monitor CSP violations
- Keep origin whitelists updated

### DON'T ❌
- Don't use `origin: '*'` with `credentials: true`
- Don't disable CSP in production
- Don't ignore CORS errors
- Don't skip OPTIONS handler
- Don't use `'unsafe-inline'` in production CSP

---

## 🚨 Emergency Fixes

### Disable CSP Temporarily (Dev Only)
```typescript
// next.config.mjs
headers: [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' *;"
  }
]
```

### Allow All Origins Temporarily (Dev Only)
```typescript
// Your route
import { DEV_CORS_CONFIG } from '@/lib/cors-middleware';
export const GET = withCORS(handler, DEV_CORS_CONFIG);
```

⚠️ **Never use these in production!**

---

## 🔗 Resources

- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [HSTS Preload](https://hstspreload.org/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

**Last Updated**: February 2025  
**Version**: 1.0  
**Status**: Production Ready
