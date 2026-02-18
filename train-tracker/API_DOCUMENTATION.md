# Train Tracker API Documentation

## Overview

This document describes the RESTful API for the Train Tracker application. All endpoints follow REST conventions using resource-based naming, standard HTTP methods, and consistent error handling.

### Key Principles

- **Resource-based URLs**: All endpoints use nouns (not verbs) to represent resources
- **Standard HTTP Methods**: GET (read), POST (create), PUT/PATCH (update), DELETE (remove)
- **Consistent Response Format**: All responses follow a standard structure with `success`, `data`, `error`, and `meta` fields
- **Pagination Support**: List endpoints support `page` and `limit` query parameters
- **Meaningful Status Codes**: Responses use appropriate HTTP status codes
- **Field Validation**: Request validation with detailed error messages

---

## API Response Format

### Success Response

All successful responses follow this structure:

```json
{
  "success": true,
  "data": { /* Resource data */ },
  "message": "Operation completed successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "hasMore": true
  }
}
```

### Error Response

All error responses follow this structure:

```json
{
  "success": false,
  "error": "Error message",
  "meta": {
    "validationErrors": {
      "email": "Valid email is required",
      "password": "Password must be at least 6 characters"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| **200** | OK | Successful GET request |
| **201** | Created | Successful POST request (resource created) |
| **400** | Bad Request | Invalid input or validation error |
| **401** | Unauthorized | Authentication required or credentials invalid |
| **403** | Forbidden | User lacks permission to access resource |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists (e.g., email taken) |
| **500** | Internal Server Error | Unexpected server error |

---

## Authentication Endpoints

### Authentication Management

#### POST /api/auth/signup
Create a new user account.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": "user-uuid",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
}
```

**Error Response (400 - Validation):**
```json
{
  "success": false,
  "error": "Validation failed",
  "meta": {
    "validationErrors": {
      "email": "Valid email format is required",
      "password": "Password must be at least 6 characters"
    }
  }
}
```

**Error Response (409 - Email Exists):**
```json
{
  "success": false,
  "error": "An account with that email already exists"
}
```

**Validation Rules:**
- `fullName`: Required, must be a non-empty string
- `email`: Required, must be valid email format
- `password`: Required, minimum 6 characters

---

#### POST /api/auth/login
Authenticate with email and password. Sets session cookie.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "user-uuid",
    "email": "john@example.com"
  }
}
```

**Error Response (400 - Validation):**
```json
{
  "success": false,
  "error": "Validation failed",
  "meta": {
    "validationErrors": {
      "email": "Email is required",
      "password": "Password is required"
    }
  }
}
```

**Error Response (401 - Invalid Credentials):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

#### POST /api/auth/logout
Clear session and logout the current user.

**Request Headers:**
```
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

## Train Endpoints

### Search & Information

#### GET /api/trains/search
Search for trains by station name, route, or train number.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | Station name, route, or train number (minimum 2 characters) |
| `page` | number | No | 1 | Page number for pagination |
| `limit` | number | No | 10 | Results per page (max 100) |

**Example Request:**
```bash
GET /api/trains/search?query=Mumbai&page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Trains found",
  "data": [
    {
      "trainName": "Rajdhani Express",
      "trainNumber": "12001",
      "from": {
        "code": "BCT",
        "name": "Mumbai Central"
      },
      "to": {
        "code": "NDLS",
        "name": "New Delhi"
      },
      "travelTime": "16:30",
      "runDays": "Mon, Wed, Fri",
      "trainType": "Express"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "hasMore": true
  }
}
```

**Error Response (400 - Validation):**
```json
{
  "success": false,
  "error": "Validation failed",
  "meta": {
    "validationErrors": {
      "query": "Search query is required and must be at least 2 characters"
    }
  }
}
```

**Pagination Notes:**
- Results are automatically paginated based on `page` and `limit` parameters
- The `meta` field includes `hasMore` to indicate if additional results exist
- Maximum limit is 100 results per page

---

## Contact Request Endpoints

#### POST /api/contact
Submit a contact or support request.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "category": "technical",
  "fullName": "John Doe",
  "email": "john@example.com",
  "hasTicket": true,
  "referenceCode": "TICKET-12345",
  "message": "I'm having trouble booking a ticket",
  "attachmentUrl": "https://example.com/screenshot.png"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Contact request submitted successfully",
  "data": {
    "id": "request-uuid",
    "category": "technical",
    "fullName": "John Doe",
    "email": "john@example.com",
    "hasTicket": true,
    "referenceCode": "TICKET-12345",
    "message": "I'm having trouble booking a ticket",
    "createdAt": "2026-02-18T10:30:00Z"
  }
}
```

**Error Response (400 - Validation):**
```json
{
  "success": false,
  "error": "Validation failed",
  "meta": {
    "validationErrors": {
      "email": "Valid email address is required",
      "message": "Message is required",
      "referenceCode": "Reference code is required when hasTicket is true"
    }
  }
}
```

**Validation Rules:**
- `fullName`: Required, non-empty string
- `email`: Required, valid email format
- `category`: Required, string
- `message`: Required, non-empty string
- `hasTicket`: Required, boolean
- `referenceCode`: Required if `hasTicket` is true
- `attachmentUrl`: Optional, string URL

---

## API Route Structure

### Current Route Hierarchy

```
/api/
├── auth/
│   ├── login/              POST - User login
│   ├── logout/             POST - User logout
│   └── signup/             POST - User registration
├── trains/
│   ├── search/             GET  - Search trains (with pagination)
│   ├── by-station/         GET  - Get trains by station
│   ├── classes/            GET  - Get train classes
│   ├── schedule/           GET  - Get train schedule
│   ├── live-station/       GET  - Get live station info
│   └── [id]/               GET  - Get specific train details
├── contact/                POST - Submit contact request
├── fare/                   GET  - Get fare information
├── find-trains/            GET  - Find trains (search)
├── pnr-status/             GET  - Check PNR booking status
├── seat-availability/      GET  - Check seat availability
├── train-status/           GET  - Get train real-time status
└── seat-availability/v2/   GET  - Seat availability v2
```

### REST Design Principles Applied

1. **Resource-Based Naming**
   - Use `/trains` not `/getTrain`
   - Use `/contact` not `/submitContact`
   - Use `/search` as a query operation on `/trains`

2. **Consistent HTTP Methods**
   - GET for data retrieval
   - POST for creating new resources
   - PUT/PATCH for updates (when implemented)
   - DELETE for removing resources (when implemented)

3. **Query Parameters**
   - Use `?query=value` for filtering
   - Use `?page=1&limit=10` for pagination
   - Use lowercase parameter names

4. **Response Consistency**
   - All responses have `success` field
   - Errors include detailed validation messages
   - List responses include pagination metadata

---

## Error Handling

### Validation Errors

When incoming data fails validation, the API returns HTTP 400 with detailed field-level errors:

```json
{
  "success": false,
  "error": "Validation failed",
  "meta": {
    "validationErrors": {
      "fieldName": "Field-specific error message"
    }
  }
}
```

### Common Error Scenarios

| Scenario | Status | Error Message | Resolution |
|----------|--------|---------------|------------|
| Missing required field | 400 | Field-specific error | Include all required fields |
| Invalid email format | 400 | Valid email format required | Fix email format |
| Resource not found | 404 | Resource not found | Verify resource ID/existence |
| Email already registered | 409 | Email already exists | Use different email |
| Invalid credentials | 401 | Invalid email or password | Verify email and password |
| Server error | 500 | Internal server error | Retry request later |

---

## Pagination

List endpoints support pagination via query parameters:

```bash
GET /api/trains/search?query=Mumbai&page=2&limit=20
```

**Pagination Parameters:**
- `page`: Page number (default: 1, must be >= 1)
- `limit`: Results per page (default: 10, max: 100)

**Pagination Metadata:**
```json
{
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

**Notes:**
- The first page is always 1 (not 0)
- `hasMore` indicates if additional pages exist
- Maximum limit is capped at 100 to prevent performance issues

---

## Testing the API

### Prerequisites

- Running Train Tracker server on `http://localhost:3000`
- curl or Postman for testing
- Valid JSON request body format

### Using curl

#### Test Authentication

**Signup:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

**Logout:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

#### Test Train Search

**Basic Search:**
```bash
curl -X GET "http://localhost:3000/api/trains/search?query=Mumbai"
```

**Search with Pagination:**
```bash
curl -X GET "http://localhost:3000/api/trains/search?query=Mumbai&page=1&limit=20"
```

**Search with Limit:**
```bash
curl -X GET "http://localhost:3000/api/trains/search?query=Rajdhani&limit=5"
```

#### Test Contact Request

**Submit Contact:**
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "category": "technical",
    "fullName": "John Doe",
    "email": "john@example.com",
    "hasTicket": false,
    "message": "I need help with my booking"
  }'
```

**Submit Contact with Ticket Reference:**
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "category": "billing",
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "hasTicket": true,
    "referenceCode": "TKT-2026021800123",
    "message": "I was charged incorrectly"
  }'
```

### Using Postman

1. **Create Collection**: New → Collection → "Train Tracker API"

2. **Add Authentication Requests**:
   - POST http://localhost:3000/api/auth/signup
   - POST http://localhost:3000/api/auth/login
   - POST http://localhost:3000/api/auth/logout

3. **Add Train Endpoints**:
   - GET http://localhost:3000/api/trains/search?query=Mumbai
   - GET http://localhost:3000/api/trains/search?query=Rajdhani&page=1&limit=10

4. **Add Contact Endpoints**:
   - POST http://localhost:3000/api/contact

5. **Test Each Request**: Click "Send" and verify responses

---

## Best Practices for API Integration

### 1. Always Validate Responses

```javascript
if (response.success) {
  // Process response.data
  console.log(response.data);
} else {
  // Handle error
  console.error(response.error);
  console.error(response.meta?.validationErrors);
}
```

### 2. Handle Pagination

```javascript
// Check if more results exist
if (response.meta?.hasMore) {
  // Fetch next page
  page += 1;
}
```

### 3. Implement Retry Logic

```javascript
// Retry on 500 or network errors
if (response.status >= 500 || networkError) {
  // Implement exponential backoff
  await delay(Math.pow(2, retryCount) * 1000);
  // Retry request
}
```

### 4. Provide User Feedback

```javascript
// Show validation errors
response.meta?.validationErrors?.forEach((field, message) => {
  displayFieldError(field, message);
});

// Show general error
if (!response.success && !response.meta?.validationErrors) {
  displayAlert(response.error);
}
```

### 5. Cache Responses Appropriately

```javascript
// Cache train searches for 5 minutes
const cacheKey = `trains_${query}_${page}`;
const cached = getFromCache(cacheKey);
if (cached && !isExpired(cached)) {
  return cached.data;
}
```

---

## API Naming Conventions

### Route Naming

- **Lowercase**: `/api/trains` (not `/api/Trains`)
- **Plural nouns**: `/api/trains` (not `/api/train`)
- **No hyphens in core resources**: `/api/trains` (not `/api/train-list`)
- **Query parameters for filtering**: `/api/trains/search?query=value`

### Request Fields

- **camelCase**: `{ "fullName": "", "referenceCode": "" }`
- **No underscores**: Use `firstName` not `first_name`
- **Don't repeat resource name**: Use `{ email }` not `{ userEmail }`

### Response Fields

- **Consistent format**: Responses use same casing as requests
- **Include metadata**: Pagination info in `meta` field
- **Success flag**: Always include `success: true|false`

---

## Consistency & Maintainability Benefits

### Why REST Convention Matters

1. **Predictability**: Developers can guess endpoints without documentation
   - `/api/trains/search` is predictable for train search
   - `/api/contact` is clearly for contact submissions

2. **Self-Documenting**: Standard patterns reduce documentation needs
   - HTTP methods clearly indicate operations (GET = read, POST = create)
   - Status codes convey outcomes (201 = created, 404 = not found)

3. **Reduced Integration Errors**: Consistency prevents misunderstandings
   - All endpoints follow same error response format
   - Pagination works identically across all list endpoints
   - Validation errors always in same structure

4. **Easier Onboarding**: New team members understand patterns immediately
   - No need to explain unique conventions for each endpoint
   - Standard HTTP semantics are widely known

5. **Better Debugging**: Consistent logging and errors
   - Error messages follow predictable format
   - Stack traces are easier to trace with standard patterns
   - Monitoring tools understand standard status codes

6. **Long-term Scalability**: Architecture scales with project growth
   - Adding new endpoints follows established patterns
   - Refactoring is straightforward with clear conventions
   - API versions (v2, v3) are easier to implement

---

## Future Enhancements

### Planned Improvements

- [ ] OAuth2 authentication support
- [ ] Rate limiting per API key
- [ ] Webhook support for real-time updates
- [ ] GraphQL endpoint alongside REST
- [ ] API versioning (v1, v2) with deprecation notices
- [ ] Advanced filtering: `/api/trains/search?from=BCT&to=NDLS&date=2026-02-19`
- [ ] Sorting: `/api/trains/search?sort=departure_time&order=asc`
- [ ] Batch operations: `POST /api/trains/batch?ids=12001,12002`

---

## Support & Questions

For API issues or questions:
- Check this documentation first
- Review error messages carefully (they include field-level details)
- Test with curl before integrating into application
- Check server logs for detailed error information

---

**Last Updated:** February 18, 2026  
**API Version:** 1.0  
**Base URL:** `http://localhost:3000/api`
