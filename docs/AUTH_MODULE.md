# Authentication Module Documentation

Comprehensive guide to the Auth Module in the Support Desk Backend, including functionality, request/response formats, and implementation details.

---

## Overview

The Auth Module handles user authentication and authorization for the Support Desk application. It supports:
- **Tenant Registration** - Onboard a new tenant with an admin user
- **User Registration** - Register new users within an existing tenant
- **User Login** - Authenticate users and issue JWT tokens
- **Get Tenant** - Retrieve tenant details by slug
- **Get Current User** - Retrieve currently logged-in user details

### Key Features
- Multi-tenant support with tenant-user relationships
- JWT-based authentication
- Password hashing with bcryptjs
- Request validation with express-validator
- Transaction-based operations for data consistency

---

## Architecture

### Module Structure

```
src/
├── routes/auth.routes.js         # Route definitions
├── controllers/auth.controller.js # Request handlers
├── service/auth.service.js       # Business logic
├── validation/auth.validation.js # Input validation
└── dao/
    ├── tenant.dao.js             # Tenant database operations
    └── user.dao.js               # User database operations
```

### Data Flow

```
HTTP Request
    ↓
Route (+ Validation)
    ↓
Controller (request → response)
    ↓
Service (business logic)
    ↓
DAO (database operations)
    ↓
MongoDB
```

---

## API Endpoints

### 1. Register Tenant with Admin

**Endpoint:** `POST /api/auth/tenant/register`

**Access:** Public

**Description:** Create a new tenant and register an admin user for that tenant.

#### Request Body

```json
{
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "supportEmail": "support@acme.com",
  "adminName": "John Doe",
  "adminEmail": "admin@acme.com",
  "password": "securePassword123"
}
```

#### Request Parameters

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `name` | String | ✓ | Max 100 chars | Company/Tenant name |
| `slug` | String | ✓ | Lowercase, numbers, hyphens only. Max 100 chars. Must be unique. | URL-friendly identifier for the tenant |
| `supportEmail` | String | ✓ | Valid email format | Tenant support email address |
| `adminName` | String | ✓ | Max 100 chars | Name of the admin user |
| `adminEmail` | String | ✓ | Valid email format. Must be unique. | Email of the admin user |
| `password` | String | ✓ | Minimum 6 characters | Admin account password (will be hashed) |

#### Success Response (201)

```json
{
  "success": true,
  "message": "Tenant and admin created successfully",
  "data": {
    "tenant": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "supportEmail": "support@acme.com",
      "createdAt": "2026-04-28T10:30:00Z"
    },
    "adminUser": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "admin@acme.com",
      "role": "admin",
      "tenantId": "507f1f77bcf86cd799439011",
      "isApproved": true,
      "createdAt": "2026-04-28T10:30:00Z"
    }
  }
}
```

#### Error Responses

**400 - Bad Request (Slug exists)**
```json
{
  "success": false,
  "message": "Slug already exists. Please choose a different slug."
}
```

**400 - Bad Request (Email in use)**
```json
{
  "success": false,
  "message": "Email already in use. Please choose a different email."
}
```

**400 - Bad Request (Validation error)**
```json
{
  "success": false,
  "message": "validation error message"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "server error"
}
```

#### Notes
- A JWT token is automatically set as an HTTP-only cookie
- Uses MongoDB transactions to ensure both tenant and admin are created or both fail
- Admin user is automatically given "admin" role

---

### 2. Register User

**Endpoint:** `POST /api/auth/register`

**Access:** Public

**Description:** Register a new user within an existing tenant.

#### Request Body

```json
{
  "name": "Jane Smith",
  "email": "jane@acme.com",
  "password": "userPassword456",
  "tenantId": "507f1f77bcf86cd799439011"
}
```

#### Request Parameters

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `name` | String | ✓ | Max 100 chars | User's full name |
| `email` | String | ✓ | Valid email format. Must be unique. | User's email address |
| `password` | String | ✓ | Minimum 6 characters | User password (will be hashed) |
| `tenantId` | String | ✓ | Valid MongoDB ObjectId | The tenant this user belongs to |

#### Success Response (201)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Jane Smith",
    "email": "jane@acme.com",
    "role": "agent",
    "tenantId": "507f1f77bcf86cd799439011",
    "isApproved": false,
    "createdAt": "2026-04-28T11:15:00Z"
  }
}
```

#### Error Responses

**400 - Bad Request (Email in use)**
```json
{
  "success": false,
  "message": "Email already in use. Please choose a different email."
}
```

**400 - Bad Request (Validation error)**
```json
{
  "success": false,
  "message": "validation error message"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "server error"
}
```

#### Notes
- Default role is "agent" (can be modified after creation)
- New users have `isApproved: false` by default (requires admin approval)
- JWT token is automatically set as an HTTP-only cookie

---

### 3. Login User

**Endpoint:** `POST /api/auth/login`

**Access:** Public

**Description:** Authenticate a user and receive a JWT token.

#### Request Body

```json
{
  "email": "admin@acme.com",
  "password": "securePassword123"
}
```

#### Request Parameters

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `email` | String | ✓ | Valid email format | User's registered email |
| `password` | String | ✓ | Non-empty | User's password |

#### Success Response (200)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "admin@acme.com",
    "role": "admin",
    "tenantId": "507f1f77bcf86cd799439011",
    "isApproved": true
  }
}
```

#### Error Responses

**401 - Unauthorized (Invalid credentials)**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**400 - Bad Request (Validation error)**
```json
{
  "success": false,
  "message": "validation error message"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "server error"
}
```

#### Notes
- Returns user data WITHOUT the password field
- JWT token is automatically set as an HTTP-only cookie
- Includes user role and approval status for authorization checks

---

### 4. Get Tenant Details

**Endpoint:** `GET /api/auth/tenant`

**Access:** Public

**Description:** Retrieve tenant information by slug. Useful for frontend to display tenant branding and verify tenant existence before registration.

#### Request Parameters

| Parameter | Type | Required | Location | Description |
|-----------|------|----------|----------|-------------|
| `slug` | String | ✓ | Query string | Tenant's URL-friendly identifier |

#### Request Example

```javascript
fetch('/api/auth/tenant?slug=acme-corp', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "supportEmail": "support@acme.com",
    "createdAt": "2026-04-28T10:30:00Z"
  }
}
```

#### Error Responses

**400 - Bad Request (Slug not provided)**
```json
{
  "success": false,
  "message": "Tenant slug is required"
}
```

**404 - Not Found (Slug doesn't exist)**
```json
{
  "success": false,
  "message": "Tenant not found"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "server error"
}
```

#### Notes
- No authentication required
- Can be called before user registration to verify tenant exists
- Returns only public tenant information (no sensitive data)

---

### 5. Get Current User

**Endpoint:** `GET /api/auth/me`

**Access:** Private (requires authentication)

**Description:** Retrieve the currently authenticated user's profile information. Returns user details from the stored JWT token.

#### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Cookie` | ✓ | HTTP-only cookie containing JWT token |

#### Request Example

```javascript
fetch('/api/auth/me', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'  // Send JWT cookie
})
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "admin@acme.com",
    "role": "admin",
    "tenantId": "507f1f77bcf86cd799439011",
    "isApproved": true,
    "createdAt": "2026-04-28T10:30:00Z"
  }
}
```

#### Error Responses

**401 - Unauthorized (No token provided)**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**401 - Unauthorized (Invalid token)**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

**404 - Not Found (User not found)**
```json
{
  "success": false,
  "message": "User not found"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "server error"
}
```

#### Notes
- Requires valid JWT token in HTTP-only cookie
- Token must be obtained via login or tenant registration
- Useful for frontend to validate user session and display user info
- Returns complete user profile including role and approval status

---

## Data Models

### Tenant Schema

```javascript
{
  _id: ObjectId,
  name: String,              // Company/organization name
  slug: String,              // Unique URL-friendly identifier
  supportEmail: String,      // Tenant's support email
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

### User Schema

```javascript
{
  _id: ObjectId,
  name: String,              // User's full name
  email: String,             // Unique email address
  password: String,          // Hashed password
  role: String,              // "admin", "agent", "user"
  tenantId: ObjectId,        // Reference to tenant
  isApproved: Boolean,       // Admin approval status
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

---

## JWT Token Details

### Token Structure

The JWT token includes:
```javascript
{
  userId: "507f1f77bcf86cd799439012",
  email: "admin@acme.com",
  tenantId: "507f1f77bcf86cd799439011"
}
```

### Token Configuration

- **Storage:** HTTP-only cookie (secure)
- **Expiration:** Configurable (typically 7 days)
- **Algorithm:** HS256 (HMAC SHA-256)
- **Signing Key:** Stored in `JWT_SECRET` environment variable

### Using the Token

The token is automatically included in requests via HTTP-only cookie. For API calls that require authentication, verify the token in middleware:

```javascript
import { verifyToken } from "../utils/verify.js"; // pseudo-code

const protect = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  
  req.user = verifyToken(token);
  next();
};
```

---

## Error Codes & Messages

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Slug already exists | 400 | Tenant slug not unique | Choose a different slug |
| Email already in use | 400 | Email not unique | Use a different email |
| Validation error | 400 | Invalid input format | Check request format |
| Invalid email or password | 401 | Wrong credentials | Verify email and password |
| Server error | 500 | Unexpected error | Check server logs |

---

## Service Layer Functions

### `registerTenantWithAdmin(data)`

**Purpose:** Register a new tenant with an admin user in a single transaction.

**Parameters:**
```javascript
{
  name: String,
  slug: String,
  supportEmail: String,
  adminName: String,
  adminEmail: String,
  password: String
}
```

**Returns:**
```javascript
{
  tenant: Object,     // Created tenant
  adminUser: Object   // Created admin user
}
```

**Throws:** `AppError` if validation fails or database operation fails

---

### `registerUser(data)`

**Purpose:** Register a new user within an existing tenant.

**Parameters:**
```javascript
{
  name: String,
  email: String,
  password: String,
  tenantId: String
}
```

**Returns:** Created user object

**Throws:** `AppError` if email exists or validation fails

---

### `loginUser(email, password)`

**Purpose:** Authenticate a user by email and password.

**Parameters:**
- `email` (String): User's email
- `password` (String): User's plaintext password

**Returns:** User object (with password field excluded)

**Throws:** `AppError` with status 401 if credentials invalid

---

## Common Use Cases

### 1. Complete Tenant Onboarding Flow

```javascript
// Frontend
const response = await fetch('/api/auth/tenant/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'New Company',
    slug: 'new-company',
    supportEmail: 'support@newcompany.com',
    adminName: 'Admin User',
    adminEmail: 'admin@newcompany.com',
    password: 'AdminPass123'
  })
});

// Response includes tenant ID for inviting more users
const { data: { tenant, adminUser } } = await response.json();
```

### 2. User Login

```javascript
// Frontend
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // Include cookies
  body: JSON.stringify({
    email: 'admin@newcompany.com',
    password: 'AdminPass123'
  })
});

const { data: { role, tenantId } } = await response.json();
// JWT token is automatically in HTTP-only cookie
```

### 3. Invite User to Tenant

```javascript
// Admin creates new user for their tenant
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'New Agent',
    email: 'agent@newcompany.com',
    password: 'AgentPass456',
    tenantId: 'TENANT_ID_FROM_REGISTRATION'
  })
});
```

---

## Security Considerations

1. **Password Hashing:** All passwords are hashed using bcryptjs before storage
2. **Email Uniqueness:** Email addresses are globally unique (no duplicates across tenants)
3. **JWT Security:** Tokens are stored in HTTP-only cookies (cannot be accessed via JavaScript)
4. **Input Validation:** All inputs validated before database operations
5. **Error Messages:** Generic error messages for failed logins (don't reveal if email exists)
6. **Transactions:** Tenant + Admin registration is atomic

---

## Troubleshooting

### Issue: "Email already in use"

**Cause:** Email was previously registered

**Solution:** 
- Use a different email address
- Or recover/reset the existing account

### Issue: "Invalid email or password"

**Cause:** Wrong credentials or user doesn't exist

**Solution:**
- Verify email spelling
- Verify password
- Check with admin to confirm account exists

### Issue: "Slug already exists"

**Cause:** Another tenant is using this slug

**Solution:**
- Choose a different slug
- Example: `acme-corp-2`, `acme-solutions`

### Issue: JWT token not persisting

**Cause:** Cookies not enabled or `credentials: 'include'` missing

**Solution:**
- Enable cookies in browser
- Add `credentials: 'include'` to fetch requests
- Check browser DevTools → Application → Cookies

---

## Related Files

- [Backend Rules & Guidelines](./BACKEND_RULES.md)
- [Auth Validation Schema](../src/validation/auth.validation.js)
- [Auth Controller](../src/controller/auth.controller.js)
- [Auth Service](../src/service/auth.service.js)
- [Auth Routes](../src/routes/auth.routes.js)

---

**Last Updated:** April 29, 2026  
**Version:** 1.1.0  
**Maintainer:** Backend Team
