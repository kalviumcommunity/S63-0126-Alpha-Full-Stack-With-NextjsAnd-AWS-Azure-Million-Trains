# Security Testing Guide

Quick reference for testing the Input Sanitization & OWASP Compliance features.

## 🧪 Manual Testing

### 1. Test XSS Prevention (Interactive Demo)

**Visit:** `http://localhost:3000/security-demo`

**Test Attacks:**
1. Click "Script Tag Attack" button
2. Submit the comment
3. Verify script is removed (no alert appears)
4. Check "Show Original Input" to see before/after

**Expected Result:** All attacks are sanitized, no JavaScript executes

---

### 2. Test API Sanitization

**Endpoint:** `POST /api/security/comments`

```bash
# Test 1: XSS Attack in Comment
curl -X POST http://localhost:3000/api/security/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<script>alert(\"XSS\")</script>Hello World",
    "author": "Test User"
  }'

# Expected Response:
{
  "success": true,
  "data": {
    "content": "Hello World",  // Script removed
    "author": "Test User"
  },
  "meta": {
    "sanitized": true
  }
}
```

```bash
# Test 2: HTML in Username (Should be stripped)
curl -X POST http://localhost:3000/api/security/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Normal comment",
    "author": "John<b>Bold</b>Doe"
  }'

# Expected Response:
{
  "success": true,
  "data": {
    "content": "Normal comment",
    "author": "JohnDoe"  // HTML stripped from name
  }
}
```

```bash
# Test 3: Validation (Too Short)
curl -X POST http://localhost:3000/api/security/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "",
    "author": "A"
  }'

# Expected Response:
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "content": ["Field is required", "Minimum length is 1"],
    "author": ["Minimum length is 2"]
  }
}
```

---

### 3. Test Rate Limiting

```bash
# Run this script to hit rate limit (100 requests/minute)
for i in {1..101}; do
  echo "Request $i"
  curl http://localhost:3000/api/security/comments
done

# On 101st request, expect:
{
  "success": false,
  "error": "Too many requests"
}
# Status: 429 Too Many Requests
# Headers: Retry-After, X-RateLimit-*
```

---

### 4. Test SQL Injection Prevention

**Note:** Prisma automatically prevents SQL injection through parameterized queries.

```bash
# Test SQL Injection Attempt (Safe with Prisma)
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "admin'\'' OR '\''1'\''='\''1"
  }'

# Expected: Query is treated as literal string, no SQL execution
# Prisma: SELECT * FROM table WHERE field = $1
# Parameter: "admin' OR '1'='1" (as string)
```

---

### 5. Test Security Headers

```bash
# Check security headers in response
curl -I http://localhost:3000/api/security/comments

# Expected Headers:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

### 6. Test Input Sanitization Functions

**File:** Create `test-sanitization.ts`

```typescript
import {
  sanitizeStrict,
  sanitizeBasic,
  sanitizeEmail,
  sanitizeURL,
  sanitizeFileName,
} from '@/lib/input-sanitizer';

// Test 1: Strict Sanitization
console.log('Test 1:', sanitizeStrict('<script>alert(1)</script>Hello'));
// Expected: "Hello"

// Test 2: Basic Sanitization
console.log('Test 2:', sanitizeBasic('Hello <b>World</b><script>alert(1)</script>'));
// Expected: "Hello <b>World</b>"

// Test 3: Email Validation
console.log('Test 3:', sanitizeEmail('  JOHN+test@EXAMPLE.COM  '));
// Expected: "john@example.com"

console.log('Test 3b:', sanitizeEmail('invalid-email'));
// Expected: null

// Test 4: URL Validation
console.log('Test 4:', sanitizeURL('javascript:alert(1)'));
// Expected: null

console.log('Test 4b:', sanitizeURL('https://example.com'));
// Expected: "https://example.com"

// Test 5: File Name Sanitization
console.log('Test 5:', sanitizeFileName('../../etc/passwd'));
// Expected: "etcpasswd"

console.log('Test 5b:', sanitizeFileName('file<script>.exe'));
// Expected: "file_script_.exe"
```

Run: `npx tsx test-sanitization.ts`

---

## ✅ Test Checklist

### XSS Prevention
- [ ] Script tags removed
- [ ] Event handlers (onerror, onload) stripped
- [ ] JavaScript protocols (javascript:, data:) blocked
- [ ] SVG scripts sanitized
- [ ] Iframe domain whitelist enforced

### SQL Injection Prevention  
- [ ] Prisma parameterized queries used
- [ ] No raw SQL string concatenation
- [ ] User input treated as data, not SQL code

### Input Validation
- [ ] Email format validated
- [ ] URL protocols restricted
- [ ] File names sanitized (no path traversal)
- [ ] Number ranges enforced
- [ ] String lengths validated

### Security Middleware
- [ ] Rate limiting works (429 after 100 requests)
- [ ] Security headers present in responses
- [ ] Request size limits enforced
- [ ] Header injection attempts blocked

### Output Encoding
- [ ] HTML entities encoded
- [ ] Context-aware encoding (HTML, JS, URL, CSS)
- [ ] DOMPurify sanitization works
- [ ] React auto-escaping functional

---

## 🔍 Verification Commands

```bash
# Check for vulnerabilities
npm audit

# Run TypeScript type checking
npx tsc --noEmit

# Check for common security issues (install snyk)
npx snyk test

# Test API endpoints
npm run test:api  # If you have API tests
```

---

## 📊 Expected Test Results

All tests should PASS with these results:

| Test Category | Expected Outcome |
|--------------|------------------|
| XSS Attacks | All scripts removed, content preserved |
| SQL Injection | Treated as literal strings, no execution |
| Rate Limiting | 429 error after 100 requests |
| Input Validation | Invalid inputs rejected with clear errors |
| Security Headers | All headers present in responses |
| File Upload | Path traversal blocked, names sanitized |

---

## 🐛 Troubleshooting

**Issue:** XSS still executes  
**Solution:** Check that you're using `SafeHTML` component or sanitization functions

**Issue:** Rate limit not working  
**Solution:** Clear in-memory store or restart server (use Redis in production)

**Issue:** SQL injection test unclear  
**Solution:** Check Prisma query logs, input should be in $1 parameter

**Issue:** Security headers missing  
**Solution:** Ensure API routes use `withSecurity()` wrapper

---

## 🚀 Production Checklist

Before deploying:

- [ ] Update all dependencies (`npm update`)
- [ ] Run security audit (`npm audit fix`)
- [ ] Test with real attack vectors
- [ ] Enable Content Security Policy headers
- [ ] Switch rate limiting to Redis
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set up security monitoring/alerts
- [ ] Review audit logs regularly
- [ ] Document security incident response plan

---

## 📚 Additional Resources

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [XSS Filter Evasion Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

**Last Updated:** February 23, 2026  
**Next Review:** March 23, 2026
