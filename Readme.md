 Conversion
# Millions of Local Trains - Environment-Aware Deployment

This guide explains how the project separates development, staging, and production builds while keeping all secrets outside of git. The goal is to keep the deployment story simple, repeatable, and cloud ready.

## Environment files

| Environment | File | How it is used | Example base URL |
| --- | --- | --- | --- |
| Development | `.env.development` | Loaded by `npm run dev` and `npm run build:development` through the `dotenv` CLI. | `http://localhost:3000` |
| Staging | `.env.staging` | Loaded by `npm run build:staging`. | `https://staging.api.million-trains.example` |
| Production | `.env.production` | Loaded by `npm run build` and `npm run build:production`. | `https://api.million-trains.example` |
| Reference | `.env.example` | Checked in template you copy when creating the real files. | Replace with your own host |

### RapidAPI configuration

Add the following keys to every environment file so the new API routes can proxy RapidAPI safely. Only `RAPIDAPI_KEY` is required; the rest let you override hosts or endpoints if RapidAPI changes URLs.

| Variable | Required? | Purpose / Default |
| --- | --- | --- |
| `RAPIDAPI_KEY` | ✅ | RapidAPI key issued for the IRCTC project. |
| `RAPIDAPI_HOST` | Optional | Defaults to `irctc1.p.rapidapi.com`. |
| `RAPIDAPI_LIVE_STATUS_URL` | Optional | Overrides `https://HOST/api/v1/liveTrainStatus`. |
| `RAPIDAPI_SEARCH_STATION_URL` | Optional | Overrides `https://HOST/api/v1/searchStation`. |
| `RAPIDAPI_TRAINS_BETWEEN_URL` | Optional | Overrides `https://HOST/api/v3/trainBetweenStations`. |
| `RAPIDAPI_SEARCH_TRAIN_URL` | Optional | Overrides `https://HOST/api/v1/searchTrain`. |
| `RAPIDAPI_TRAIN_SCHEDULE_URL` | Optional | Overrides `https://HOST/api/v1/getTrainSchedule`. |
| `RAPIDAPI_PNR_STATUS_URL` | Optional | Overrides `https://HOST/api/v3/getPNRStatus`. |
| `RAPIDAPI_SEAT_AVAILABILITY_URL` | Optional | Overrides `https://HOST/api/v1/checkSeatAvailability`. |
| `RAPIDAPI_SEAT_AVAILABILITY_V2_URL` | Optional | Overrides `https://HOST/api/v2/checkSeatAvailability`. |
| `RAPIDAPI_TRAIN_CLASSES_URL` | Optional | Overrides `https://HOST/api/v1/getTrainClasses`. |
| `RAPIDAPI_FARE_URL` | Optional | Overrides `https://HOST/api/v1/getFare`. |
| `RAPIDAPI_TRAINS_BY_STATION_URL` | Optional | Overrides `https://HOST/api/v1/getTrainsByStation`. |
| `RAPIDAPI_LIVE_STATION_URL` | Optional | Overrides `https://HOST/api/v1/getLiveStation`. |

All real `.env*` files are gitignored. Copy the example file, adjust the values, and store the filled versions only in your secret manager or deployment platform.

## Secure secret management

- **GitHub Actions**: store secrets like `DATABASE_URL` or Supabase keys inside *Repository Settings → Secrets and variables*. During the workflow, export them before running `npm run build:staging` or `npm run build:production`.
- **AWS Systems Manager Parameter Store**: keep long lived credentials there, and inject them into the build container with `aws ssm get-parameter --with-decryption`. Feed the values into the environment when running the Next.js commands.
- **Azure Key Vault**: create secrets for each environment (e.g., `train-tracker--staging--database-url`). Use a managed identity in your pipeline to fetch them at build time.
- Never write keys inside source files. The pages use `process.env.NEXT_PUBLIC_API_BASE_URL`, so whichever environment file or secret store defines it will take effect without code changes.

## Build and verification commands

```bash
npm run dev                # development server with .env.development
npm run build:development  # local production build against dev services
npm run build:staging      # staging build (CI/CD recommended)
npm run build:production   # final build for release
npm run build              # alias for production build
```

After each build, run `npx next start` (or deploy to your platform) with the same environment variables present at runtime. CI pipelines should fail fast if any variable is missing, so wire up your workflow to check for required keys before running the commands.

## Prisma database workflow

### 1. Configure `DATABASE_URL`
- Add the connection string (include `?sslmode=require` for Supabase) to whichever `.env.*` file matches the command you are running. Prisma itself reads `.env` by default, so export `DATABASE_URL` manually or create a `.env` shim when working locally.
- Example local URL: `postgresql://postgres:postgres@localhost:5432/traintracker`. Example Supabase URL: `postgresql://postgres:<password>@<host>:5432/postgres?sslmode=require`.

### 2. Create and apply migrations
Run the migration suite anytime the schema changes. The three existing steps are:

```bash
npx prisma migrate dev --name init_schema
npx prisma migrate dev --name contact_request
npx prisma migrate dev --name add-updated-at
```

`add-updated-at` introduces the `updatedAt @updatedAt` columns on both `User` and `ContactRequest`, enabling basic audit tracking.

### 3. Modify or extend the schema
- Change `prisma/schema.prisma` (for example, add a `Project` model) and generate a new migration with `npx prisma migrate dev --name add_project_table`.
- Use `--create-only` if reviewers should inspect the SQL before it is applied to shared databases.
- After every migration, refresh the Prisma Client so TypeScript picks up the latest types: `npx prisma generate`.

### 4. Rollback or reset safely
- Local reset: `npx prisma migrate reset` drops the database, reapplies all migrations, and optionally reruns the seed script.
- Targeted rollback: `npx prisma migrate resolve --rolled-back <migration_folder>` marks a migration as rolled back without deleting files (useful when a production deploy fails and you revert manually).
- Always test destructive changes against staging first and keep cloud snapshots (Supabase backups, AWS RDS snapshots, etc.) before running irreversible migrations in production.

### 5. Seed deterministic data
- `prisma/seed.ts` uses `ts-node --esm` to insert two demo users plus two contact requests in an idempotent fashion (fixed IDs + `upsert`).
- Invoke it directly or let `prisma migrate reset` call it automatically:

```bash
npx prisma db seed
```

Running the seed multiple times simply updates the existing rows, so you get predictable fixtures for manual testing.

### 6. Verify via Prisma Studio

```bash
npx prisma studio
```

This opens a browser UI where you can confirm that migrations created the expected columns and that the seed data shows up without duplicates.

## Transactions and query optimization (2.16)

### Transaction scenarios
- **User signup**: [train-tracker/app/api/auth/signup/route.ts](train-tracker/app/api/auth/signup/route.ts) uses `prisma.$transaction` to create the user and an `AuditEvent` record atomically.
- **Contact requests**: [train-tracker/app/api/contact/route.ts](train-tracker/app/api/contact/route.ts) uses `prisma.$transaction` to create the `ContactRequest` and an `AuditEvent` log together.

### Rollback logic
- Both routes wrap the transaction in `try/catch`. If the audit insert fails, Prisma rolls back the primary write so no partial records exist.
- **Rollback verification idea**: temporarily set `eventType` to `null` in either route, trigger the API, and confirm neither the main record nor the audit event is persisted.

### Indexes added
- `User.createdAt` to support chronological queries.
- `ContactRequest.email`, `ContactRequest.category`, and `ContactRequest.createdAt` for common support filters.
- `AuditEvent.eventType`, `AuditEvent.entityType`, and `AuditEvent.createdAt` for audit dashboards.

Update Prisma after the schema change:

```bash
npx prisma migrate dev --name add_indexes_and_audit_events
```

### Query optimizations
- Login route now selects only `id` and `password` to avoid over-fetching.
- Transactional routes return only the fields required for the response.

### Performance comparison
- Capture a baseline log using `DEBUG="prisma:query" npm run dev` before applying indexes.
- Re-run after migration and compare query latency in the terminal output.

### Anti-patterns avoided
- N+1 reads by keeping contact and audit writes in a single transaction.
- Full-table scans by adding indexes for frequently filtered fields.

### Production monitoring reflection
- Track query latency p95/p99, error rates, and slow-query logs in Postgres.
- Use Prisma query logging in staging plus managed DB tools (RDS Performance Insights, Azure Query Performance) for deeper analysis.

### Example terminal session

```bash
$ npx prisma migrate dev --name add-updated-at
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres" ...
Applying migration `20260202094500_add_updated_at`
The following migration(s) have been applied:
  20260202094500_add_updated_at

$ npx prisma db seed
Environment variables loaded from .env.local
Running seed command `ts-node --esm prisma/seed.ts` ...
Seed data inserted successfully
``` 

Capture the successful command output (or screenshots) when recording your walkthrough so reviewers can see the migrations and seeding in action.

### Production reflection
- Keep automated backups enabled for every managed Postgres instance and practice restoring them.
- Promote schema changes through dev → staging → production so you can validate both the migration SQL and the seed script against production-sized data before the real release train departs.
- Restrict who can run `prisma migrate reset` against production (ideally never) and gate deployment pipelines so migrations happen inside controlled CI/CD jobs, not on laptops.

Commit the entire `prisma/migrations/**` directory so teammates can recreate the same database shape without copying SQL manually.

### Routes command center

Visit `/routes` once the dev server is running to try every RapidAPI feature without exposing your key in the browser. Each widget talks to a dedicated Next.js API route:

- Search train, train-between-stations, and live status queries.
- Train schedule explorer, PNR status v3, seat availability (classic + V2).
- Train classes, fare breakup, trains-by-station, and live station boards.

Because the UI only calls local endpoints, you can rotate RapidAPI keys or host overrides without changing the frontend.

## JWT & Session Management

This project implements a **production-grade dual-token authentication system** with automatic token refresh and comprehensive security features.

### Architecture Overview

- **Access Tokens** (15 min): Short-lived tokens for API authorization
- **Refresh Tokens** (7 days): Long-lived tokens stored in HTTP-only cookies
- **Automatic Refresh**: Client-side logic transparently refreshes expired tokens
- **Token Blacklist**: Logout immediately invalidates both tokens

### Security Features

| Feature | Implementation | Protection Against |
|---------|---------------|-------------------|
| **HTTP-only Cookies** | Refresh tokens stored in cookies with `httpOnly: true` | XSS attacks (JavaScript cannot access) |
| **SameSite Strict** | Cookies use `sameSite: 'strict'` | CSRF attacks (no cross-origin requests) |
| **Token Blacklist** | In-memory Set (Redis-ready) | Token replay after logout |
| **Separate Secrets** | `JWT_SECRET` vs `JWT_REFRESH_SECRET` | Single-point-of-failure compromise |
| **Short Expiry** | Access tokens expire in 15 minutes | Limited attack window if stolen |

### Key Files

```
lib/
├── jwt-utils.ts           # Token generation and verification
├── token-storage.ts       # HTTP-only cookie management
├── token-blacklist.ts     # Token invalidation service
├── auth-fetch.ts          # Client-side auto-refresh hook
└── security-utils.ts      # CSRF protection, security headers

app/api/auth/
├── login/route.ts         # Issues token pair on login
├── refresh/route.ts       # Generates new access token
└── logout/route.ts        # Blacklists tokens and clears cookies
```

### Environment Variables

Add to your `.env.*` files:

```bash
# JWT Secrets (use strong random strings - minimum 32 characters)
JWT_SECRET="your-access-token-secret-min-32-chars"
JWT_REFRESH_SECRET="your-different-refresh-token-secret-min-32-chars"

# Generate with:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Token Flow

```
Login → Generate Token Pair → Store Refresh in Cookie
  ↓
API Request → 401 if Expired → Auto-Refresh → Retry
  ↓
Logout → Blacklist Tokens → Clear Cookies
```

### Usage Example

```typescript
'use client';
import { useAuthFetch } from '@/lib/auth-fetch';

export default function ProtectedComponent() {
  const { fetchWithAuth, isRefreshing } = useAuthFetch();
  
  async function loadData() {
    const response = await fetchWithAuth('/api/protected');
    // Auto-refresh happens transparently on 401
    const data = await response.json();
  }
}
```

### Testing & Demo

- **Documentation**: See [JWT_SESSION_MANAGEMENT.md](train-tracker/JWT_SESSION_MANAGEMENT.md) for comprehensive guide
- **Interactive Demo**: Visit `/jwt-demo` to visualize token refresh flow
- **Testing Guide**: Full testing procedures in documentation

### Production Recommendations

- ✅ Use Redis for token blacklist (not in-memory)
- ✅ Enable HTTPS (required for `secure: true` cookies)
- ✅ Rotate JWT secrets regularly
- ✅ Monitor token refresh rates
- ✅ Set up proper logging for auth events
- ✅ Implement rate limiting on login/refresh endpoints

---

## Role-Based Access Control (RBAC)

This project implements a **comprehensive RBAC system** that works seamlessly with JWT authentication to provide granular permission management across API endpoints and UI components.

### Role Hierarchy

The system defines 6 roles in a hierarchical structure (higher roles inherit all permissions from lower roles):

| Role | Level | Description | Key Permissions |
|------|-------|-------------|-----------------|
| **SUPER_ADMIN** | 100 | Full system access | All permissions (17 total) |
| **ADMIN** | 80 | Administrative functions | User management, train updates, system settings |
| **EDITOR** | 60 | Content management | Create/update trains, manage fare data |
| **USER** | 40 | Standard authenticated user | Read trains, check PNR status, submit contact forms |
| **VIEWER** | 20 | Read-only access | View trains, search stations, read-only operations |
| **GUEST** | 0 | Unauthenticated public | Public pages only |

### Permission System

17 atomic permissions across 5 categories:

- **User Management**: `USER_CREATE`, `USER_READ`, `USER_UPDATE`, `USER_DELETE`, `USER_LIST`
- **Train Data**: `TRAIN_CREATE`, `TRAIN_READ`, `TRAIN_UPDATE`, `TRAIN_DELETE`
- **Contact Management**: `CONTACT_READ`, `CONTACT_DELETE`, `CONTACT_RESPOND`
- **System Operations**: `UPLOAD_FILE`, `DELETE_FILE`, `MANAGE_FARE`
- **Admin Functions**: `SYSTEM_SETTINGS`, `VIEW_AUDIT_LOGS`

### API Protection

Protect routes with three simple patterns:

#### 1. Permission-Based Protection (Recommended)
```typescript
import { withPermission, Permission } from '@/lib/rbac-middleware';

export const DELETE = withPermission(Permission.USER_DELETE, async (request, user) => {
  // Only users with USER_DELETE permission can access
  // Business logic here
  return NextResponse.json({ success: true });
});
```

#### 2. Role-Based Protection
```typescript
import { withRole, Role } from '@/lib/rbac-middleware';

export const GET = withRole(Role.ADMIN, async (request, user) => {
  // Only ADMIN and higher can access
  return NextResponse.json({ data: adminData });
});
```

#### 3. Manual Checking
```typescript
import { requirePermission, Permission } from '@/lib/rbac-middleware';

export async function POST(request: NextRequest) {
  const authResult = await requirePermission(request, Permission.TRAIN_CREATE);
  if (!authResult.allowed) {
    return authResult.response; // Returns 401 or 403 automatically
  }
  // Continue with business logic
}
```

### UI Component Protection

Adapt the UI based on user permissions:

#### Using the Protected Component
```typescript
import { Protected } from '@/hooks/useRBAC';
import { Permission } from '@/lib/rbac-config';

<Protected permission={Permission.USER_DELETE}>
  <button onClick={deleteUser}>Delete User</button>
</Protected>
```

#### Using the useRBAC Hook
```typescript
'use client';
import { useRBAC } from '@/hooks/useRBAC';
import { Permission } from '@/lib/rbac-config';

export default function UserManagement() {
  const rbac = useRBAC();
  
  return (
    <div>
      {rbac.can(Permission.USER_CREATE) && (
        <button>Create User</button>
      )}
      
      {rbac.isAtLeast(Role.ADMIN) && (
        <AdminPanel />
      )}
    </div>
  );
}
```

#### Conditional Rendering
```typescript
const rbac = useRBAC();

// Check single permission
if (rbac.can(Permission.TRAIN_UPDATE)) { /* ... */ }

// Check multiple permissions (any)
if (rbac.canAny([Permission.USER_READ, Permission.USER_LIST])) { /* ... */ }

// Check multiple permissions (all)
if (rbac.canAll([Permission.TRAIN_CREATE, Permission.TRAIN_UPDATE])) { /* ... */ }

// Convenience role checks
if (rbac.isSuperAdmin) { /* ... */ }
if (rbac.isAdmin) { /* ... */ }
```

### Key Files

```
lib/
├── rbac-config.ts         # Role/Permission enums, hierarchy, policy evaluation
└── rbac-middleware.ts     # API protection wrappers (withPermission, withRole, withAuth)

hooks/
└── useRBAC.ts             # Client-side permission checking + Protected component

app/api/admin/
└── users/
    ├── route.ts           # List/Create users (permission-protected)
    └── [id]/route.ts      # Get/Update/Delete user (granular permissions)
```

### Audit Logging

All RBAC decisions are automatically logged with full context:

```json
{
  "timestamp": "2025-01-08T10:23:45.123Z",
  "event": "RBAC_CHECK",
  "userId": "user-123",
  "userEmail": "jane@example.com",
  "role": "EDITOR",
  "permission": "TRAIN_UPDATE",
  "resource": "/api/admin/trains/express-123",
  "method": "PATCH",
  "allowed": true,
  "reason": "User has explicit permission TRAIN_UPDATE"
}
```

### Testing & Demo

- **Documentation**: See [RBAC_IMPLEMENTATION_GUIDE.md](train-tracker/RBAC_IMPLEMENTATION_GUIDE.md) for comprehensive details
- **Testing Evidence**: Full test suite results in [RBAC_TESTING_EVIDENCE.md](train-tracker/RBAC_TESTING_EVIDENCE.md)
- **Interactive Demo**: Visit `/rbac-demo` to visualize roles and permissions

### Integration with JWT

RBAC works seamlessly with the JWT authentication system:

1. **Login**: JWT payload includes user's role (`{ id, email, role: 'ADMIN' }`)
2. **Token Storage**: Role propagates through access token (15m) and refresh token (7d)
3. **API Request**: Middleware extracts role from JWT → checks permission → allows/denies
4. **UI Adaptation**: Client reads role from localStorage or token → adapts UI elements

### Security Best Practices

- ✅ **Never rely on client-side checks alone** - Always enforce permissions on the server
- ✅ **Check permissions, not roles** - Use `withPermission(Permission.USER_DELETE)` instead of `withRole(Role.ADMIN)`
- ✅ **Validate inputs after auth** - Permission to access ≠ permission to send malicious data
- ✅ **Log all decisions** - Audit trail is critical for security investigations
- ✅ **Use granular permissions** - Easier to grant/revoke specific capabilities than reassign roles

---

## Input Sanitization & OWASP Compliance

This application implements **OWASP-compliant security practices** to protect against XSS, SQL injection, command injection, and other common vulnerabilities.

### Security Layers

Our defense-in-depth strategy includes:

1. **Input Sanitization** (Server-side) - Remove malicious content before storage
2. **Output Encoding** (Client-side) - Escape content before rendering
3. **Parameterized Queries** (Prisma ORM) - Prevent SQL injection automatically
4. **Security Middleware** - Rate limiting, header validation, size limits
5. **Security Headers** - X-Frame-Options, CSP, X-XSS-Protection

### Sanitization Levels

| Level | Use Case | Allowed Tags |
|-------|----------|--------------|
| **STRICT** | Usernames, file names, search queries | None (plain text only) |
| **BASIC** | Comments, chat messages | `b`, `i`, `em`, `strong`, `p`, `br` |
| **MODERATE** | Blog posts, descriptions | Headings, lists, links, blockquotes |
| **RICH** | Articles, documentation | Images, videos, iframes (approved domains) |

### Usage Examples

#### Server-Side Sanitization
```typescript
import { sanitize, SanitizationLevel } from '@/lib/input-sanitizer';
import { withSecurity } from '@/lib/security-middleware';

export const POST = withSecurity(async (request: NextRequest) => {
  const body = await request.json();
  
  // Sanitize inputs
  const cleanComment = sanitize(body.comment, SanitizationLevel.BASIC);
  const cleanEmail = sanitizeEmail(body.email);
  
  // Store safely
  await prisma.comment.create({ data: { text: cleanComment } });
});
```

#### Client-Side Output Encoding
```tsx
import { SafeHTML } from '@/lib/output-encoder';

// Safe HTML rendering with DOMPurify
<SafeHTML html={userGeneratedContent} className="prose" />

// React auto-escapes by default (already safe)
<div>{userName}</div>
```

### XSS Prevention

**Attack Example:**
```html
<!-- User input -->
<script>alert('XSS: ' + document.cookie)</script>

<!-- After sanitization -->
<!-- Empty (script tag removed) -->
```

**Common XSS Vectors Blocked:**
- ✅ Script tags (`<script>`)
- ✅ Event handlers (`onerror`, `onload`, `onclick`)
- ✅ JavaScript protocols (`javascript:`, `data:`)
- ✅ SVG scripts (`<svg onload="...">`)
- ✅ Iframe injection (domain whitelist enforced)

### SQL Injection Prevention

**Prisma Protection (Automatic):**
```typescript
// ✅ SAFE - Prisma parameterizes automatically
await prisma.user.findFirst({
  where: { email: userInput }  // Treated as data, not SQL
});

// ❌ UNSAFE - Never build SQL strings
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
```

**Attack Example:**
```sql
-- User input: admin' OR '1'='1
-- Vulnerable query: SELECT * FROM users WHERE username = 'admin' OR '1'='1'
-- Prisma query: SELECT * FROM users WHERE username = $1
-- Parameter: "admin' OR '1'='1" (treated as literal string)
```

### Key Files

```
lib/
├── input-sanitizer.ts      # 15 sanitization functions (strict → rich)
├── output-encoder.ts       # Context-aware encoding (HTML, JS, URL, CSS)
└── security-middleware.ts  # API protection (rate limit, headers, validation)

app/
└── security-demo/          # Interactive XSS/SQLi demo
```

### Testing & Demo

- **Documentation**: See [OWASP_COMPLIANCE_GUIDE.md](train-tracker/OWASP_COMPLIANCE_GUIDE.md) for comprehensive details
- **Interactive Demo**: Visit `/security-demo` to try XSS attacks and see real-time sanitization
- **Testing Evidence**: Before/after examples and attack vectors documented

### OWASP Top 10 Coverage

| Vulnerability | Status | Implementation |
|---------------|--------|----------------|
| A01: Broken Access Control | ✅ | RBAC with role/permission checks |
| A02: Cryptographic Failures | ✅ | JWT HS256, bcrypt password hashing |
| A03: Injection | ✅ | Prisma ORM, input sanitization |
| A04: Insecure Design | ✅ | Security-first architecture |
| A05: Security Misconfiguration | ✅ | Security headers, CSP, CORS |
| A06: Vulnerable Components | ⚠️ | Regular `npm audit`, updates |
| A07: Authentication Failures | ✅ | Dual-token JWT, rate limiting |
| A08: Data Integrity Failures | ✅ | Input validation, JWT signatures |
| A09: Logging Failures | ✅ | Structured logging, audit trails |
| A10: SSRF | ✅ | URL validation, domain whitelists |

### Security Best Practices

- ✅ **Always sanitize on input** - Never trust user data
- ✅ **Always encode on output** - Context-aware escaping
- ✅ **Use parameterized queries** - Prisma handles this automatically
- ✅ **Implement rate limiting** - Prevent brute force and DoS
- ✅ **Set security headers** - Browser-level protection
- ✅ **Log security events** - Audit trail for investigations
- ✅ **Update dependencies** - Run `npm audit` regularly
- ✅ **Test with real attacks** - Use the `/security-demo` page

---

## HTTPS Enforcement & Security Headers

### Overview

Layer 3 of our defense-in-depth security strategy: securing **how data travels and renders** in the browser. This complements RBAC (who can access) and input sanitization (what data enters) with transport and rendering security.

### Key Features

#### 🔒 HTTPS/HSTS Enforcement
- **Strict-Transport-Security (HSTS)**: Forces HTTPS connections for 2 years
  - `max-age=63072000` (730 days)
  - `includeSubDomains` - Applies to all subdomains
  - `preload` - Eligible for browser preload list
- **Prevents**: Man-in-the-middle attacks, SSL stripping, protocol downgrades

#### 🛡️ Content Security Policy (CSP)
- **Default Policy**: `default-src 'self'` - Only same-origin resources
- **Script Control**: Restricts JavaScript execution to trusted sources
- **Style Control**: Controls CSS loading and inline styles
- **Image Control**: Limits image sources (self, data URIs, HTTPS)
- **Frame Protection**: `frame-ancestors 'none'` - Blocks clickjacking
- **Prevents**: XSS attacks, code injection, clickjacking, data exfiltration

#### 🌐 CORS Configuration
Three environment-specific configurations:
1. **STRICT_CORS_CONFIG** - Authentication/Admin endpoints
   - Specific origin whitelist
   - Credentials enabled
   - Full method support
2. **PUBLIC_CORS_CONFIG** - Read-only APIs
   - Allow all origins (`*`)
   - No credentials
   - GET/OPTIONS only
3. **DEV_CORS_CONFIG** - Development only
   - Permissive for testing
   - All origins and methods

#### 🔐 Additional Security Headers
- **X-Frame-Options**: `DENY` - Prevents iframe embedding
- **X-Content-Type-Options**: `nosniff` - Blocks MIME-sniffing
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer info
- **Permissions-Policy**: Disables camera, microphone, geolocation
- **COEP/COOP/CORP**: Cross-origin isolation for enhanced security

### Implementation

#### Global Headers (Next.js Config)
```javascript
// next.config.mjs
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Content-Security-Policy', value: '...' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // ... more headers
    ]
  }];
}
```

#### CORS Middleware Usage
```typescript
// API routes with CORS
import { withCORS, createOPTIONSHandler, STRICT_CORS_CONFIG } from '@/lib/cors-middleware';

// Options handler for preflight
export const OPTIONS = createOPTIONSHandler(STRICT_CORS_CONFIG);

// Wrap API handler with CORS
export const POST = withCORS(async (request) => {
  // Your handler logic
}, STRICT_CORS_CONFIG);
```

#### Combined with RBAC
```typescript
// Secure admin endpoint with CORS + permissions
import { withCORS } from '@/lib/cors-middleware';
import { withPermission } from '@/lib/rbac-middleware';

export const GET = withCORS(
  withPermission(Permission.USER_LIST, async (request, user) => {
    // Admin logic
  }),
  STRICT_CORS_CONFIG
);
```

### File Structure
```
lib/
├── security-headers.ts       # Security headers utilities
│   ├── HSTS configuration
│   ├── CSP directives
│   ├── generateCORSHeaders()
│   ├── getSecurityHeaders()
│   └── generateSecurityReport()
└── cors-middleware.ts        # CORS middleware
    ├── withCORS()
    ├── createOPTIONSHandler()
    ├── STRICT_CORS_CONFIG
    ├── PUBLIC_CORS_CONFIG
    └── DEV_CORS_CONFIG

app/
├── api/
│   ├── auth/login/          # STRICT_CORS_CONFIG
│   ├── admin/users/         # STRICT_CORS_CONFIG
│   ├── trains/search/       # PUBLIC_CORS_CONFIG
│   └── security/
│       ├── comments/        # Default CORS (demo)
│       └── headers-check/   # Headers verification API
└── headers-demo/
    └── page.tsx             # Interactive headers demo
```

### Testing & Verification

#### 1. Interactive Demo Page
Visit: **http://localhost:3000/headers-demo**
- ✅ Real-time security header verification
- ✅ Protocol check (HTTP vs HTTPS)
- ✅ Security score calculation (0-100%)
- ✅ CORS preflight testing
- ✅ Detailed header information with pass/fail status

#### 2. Manual Testing
```bash
# Test HSTS header
curl -I https://yourdomain.com | grep strict-transport

# Test CORS preflight
curl -X OPTIONS https://yourdomain.com/api/auth/login \
  -H "Origin: https://example.com" \
  -v

# Test all security headers
curl -I https://yourdomain.com | grep -E "(strict-transport|content-security|x-frame|x-content)"
```

#### 3. Online Security Scanners
- **SecurityHeaders.com**: https://securityheaders.com (aim for A+)
- **Mozilla Observatory**: https://observatory.mozilla.org
- **SSL Labs**: https://www.ssllabs.com/ssltest/ (aim for A+)

### Security Score

Your application should achieve:
- ✅ **SecurityHeaders.com**: A+ grade
- ✅ **Mozilla Observatory**: 90+ score
- ✅ **SSL Labs**: A+ rating
- ✅ **HSTS Preload**: Eligible for inclusion

### Documentation

- **Full Guide**: [HTTPS_SECURITY_GUIDE.md](train-tracker/HTTPS_SECURITY_GUIDE.md) - Comprehensive implementation details
- **Configuration**: Environment-specific CORS configs
- **Best Practices**: HTTPS everywhere, CSP tuning, CORS restrictions
- **Troubleshooting**: Common issues and solutions

### Defense-in-Depth Summary

| Layer | Purpose | Implementation |
|-------|---------|----------------|
| **Layer 1: RBAC** | WHO can access | 6 roles, 17 permissions, JWT auth |
| **Layer 2: Input Sanitization** | WHAT data enters | 4 levels, XSS prevention, SQL protection |
| **Layer 3: HTTPS/Headers** | HOW data travels | HSTS, CSP, CORS, 12 security headers |

All three layers work together to provide **enterprise-grade security**.

---

## Keeping secrets out of git

- `.gitignore` blocks every `.env*` file while explicitly allowing `.env.example`.
- `.env.example` documents every variable: `NEXT_PUBLIC_API_BASE_URL`, `DATABASE_URL`, Supabase keys, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.
- Developers pull secrets from the approved store, create their local `.env.development`, and never commit it. Auditing the repo shows that no sensitive strings are present.

## Why multi-environment builds help CI/CD

1. **Predictable rollouts**: staging builds mirror production settings, so regressions show up before the release train leaves the station.
2. **Guardrails for secrets**: separating configs prevents leaking production credentials into local laptops.
3. **Faster debugging**: when an issue appears, you can reproduce it with the matching environment file and command instead of toggling flags in code.

## Docker + CI/CD in this project

- **Deterministic builds**: containerizing the Next.js app (builder stage → runtime stage) fixes the Node version, OS packages, and Prisma binaries. Even though the current `Dockerfile` template is empty, the expected flow is `node:20-alpine` for the build stage, `npm run build`, copy `.next` into a lean `node:20-alpine` runtime, and expose port 3000. This locks dependencies so GitHub Actions, local devs, and AWS Fargate all run the same artifact.
- **Composable services**: `docker-compose.yml` is the placeholder for stitching the web container to Postgres or a RapidAPI mock. Running `docker compose up` locally simulates the same network topology we deploy to ECS task definitions or Azure Container Apps.
- **CI/CD as a promotion pipeline**: GitHub Actions builds the Docker image, tags it with the commit SHA, runs `npm run build:staging`, pushes to ECR/ACR, and only then deploys. Each job consumes the `.env.*` file that matches the target, so secrets never leak between stages.
- **Cloud-specific security considerations**: 
	- **AWS**: use OIDC-backed GitHub Actions roles to push to Amazon ECR, inject secrets from Parameter Store/Secrets Manager at task runtime, keep containers inside private subnets behind an ALB, and restrict outbound RapidAPI calls with egress rules.
	- **Azure**: authenticate into Azure Container Registry (ACR) with federated credentials, pull secrets from Key Vault via managed identity, enforce HTTPS-only on App Service/Container Apps, and wire Application Gateway WAF in front.
- **Runtime safeguards**: enable image vulnerability scanning (ECR scan on push or Microsoft Defender for Cloud), pin RapidAPI keys with least privilege, and enforce health probes so ALB/App Gateway drains bad tasks before routing traffic.

When you walk through this section in the video, highlight how Docker guarantees “it runs the same everywhere,” while CI/CD gates every promotion (commit → build → scan → deploy) to keep the AWS/Azure surface locked down.

## Video walkthrough checklist (3-5 minutes)

1. Show the `.env.*` files and how they map to each command.
2. Demonstrate where secrets live (GitHub Secrets, Parameter Store, or Key Vault) and how the pipeline reads them.
3. Run `npm run build:staging` and `npm run build:production`, pointing out the different API targets.
4. Share any misconfigurations you hit (missing env vars, typos) and how the separation made the fix obvious.
5. Explain the Docker + CI/CD flow above, then contrast AWS (ECR + ECS) vs. Azure (ACR + Container Apps) security knobs.
6. Tie in the QuickServe case study plan (below) so the “chain of trust” story is covered end-to-end.

Keep the narration focused on deployment clarity: no hardcoded secrets, minimal scripts, and confident releases.

## Case study: The Never-Ending Deployment Loop (QuickServe)

**Symptoms**
- Pipeline fails with “Environment variable not found” because the CI job builds the container before retrieving secrets or validating `.env`. The app bootstraps Prisma and RapidAPI clients immediately, so missing keys crash the process.
- “Port already in use” errors appear when the previous container still binds to `3000` on the EC2 host/AKS node. Without an orchestrator draining traffic, the new task cannot start.
- Old containers linger on AWS, so half the fleet runs version *N* and the rest *N-1*, producing inconsistent API responses.

**Root causes**
1. **Broken chain of trust**: code merges trigger a build, but there is no signed/tagged image artifact. The deployment phase rebuilds from source, so you cannot guarantee which commit is running.
2. **Secret handoff gap**: secrets live in GitHub but never injected into the runtime environment, causing mid-deployment crashes.
3. **Imperfect orchestration**: containers are launched manually (e.g., `docker run` on EC2) instead of relying on ECS/AKS rolling updates, so stale processes keep ports busy.

**Fix plan**
- **Containerization discipline**: build once inside CI using a multi-stage Dockerfile, tag the image (`quickserve-orders:<sha>`), and push to the registry. Every downstream environment pulls the same digest, ensuring parity.
- **Environment manifest**: define a required-variable contract (`.env.schema` or `dotenv-vault`). The CI job runs a “secret smoke test” before `docker build`, failing fast if AWS Parameter Store/Key Vault does not return a value.
- **Pipeline stages**: 
	1. **Source → Build**: lint/test, build Next.js, bake Docker image, run containerized integration tests.
	2. **Build → Deploy**: sign the image, push to ECR/ACR, promote via deployment jobs that call ECS blue/green or Azure Container Apps revisions.
	3. **Deploy → Runtime**: orchestrator performs rolling updates, health checks gate traffic shifts, and post-deploy jobs verify version headers (`x-quickserve-build`).
- **Operational hygiene**: use `docker compose down --remove-orphans` (local) or ECS `minimumHealthyPercent` to retire old tasks, and pin ports via load balancers instead of the host network.

**Video talking points**
- Walk through the failing pipeline log, point out where the environment variable check should live, and show the updated workflow diagram.
- Demonstrate how versioned images + orchestrated rollouts prevent the “port already in use” issue.
- Emphasize security: IAM roles for GitHub Actions (AWS) or federated credentials (Azure), secret stores, HTTPS-only ingress, and logging for every deployment handoff.

 Backend

This is our new Team project
In which we gonna make a website for checking  correct timing's for Trains.
 main
 main
