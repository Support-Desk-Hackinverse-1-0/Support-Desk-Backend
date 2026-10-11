# Backend Development Rules & Guidelines

This document outlines the standards, conventions, and best practices for working on the Support Desk Backend.

## Project Overview

The Support Desk Backend is a Node.js/Express application with a multi-tenant architecture, built with MongoDB for data persistence.

**Technology Stack:**
- **Runtime:** Node.js
- **Framework:** Express.js (v5.2.1)
- **Database:** MongoDB with Mongoose (v9.5.0)
- **Authentication:** JWT (JsonWebToken)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator
- **Development:** nodemon (hot reload)

---

## 1. Project Structure

```
Backend/
├── src/
│   ├── app.js              # Express app setup
│   ├── config/             # Configuration files
│   │   ├── config.js       # General config
│   │   └── db.js           # Database connection
│   ├── controllers/        # Request handlers
│   ├── dao/                # Data Access Objects (database queries)
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── service/            # Business logic layer
│   ├── utils/              # Helper utilities
│   └── validation/         # Request validation schemas
├── docs/                   # Documentation
├── package.json            # Dependencies
└── server.js               # Application entry point
```

### Layer Responsibility

| Layer | Purpose |
|-------|---------|
| **Routes** | Define API endpoints and apply validation middleware |
| **Controllers** | Handle HTTP requests, call services, format responses |
| **Services** | Implement business logic, orchestrate data operations |
| **DAO** | Direct database queries and operations |
| **Models** | Define MongoDB schemas and data structure |
| **Validation** | Request body validation rules |
| **Middleware** | Authentication, authorization, logging |
| **Utils** | Reusable helper functions |

---

## 2. Code Style & Conventions

### Naming Conventions

- **Files:** `camelCase` with descriptive names (e.g., `auth.controller.js`, `tenant.dao.js`)
- **Directories:** `lowercase` (e.g., `controllers`, `services`)
- **Variables & Functions:** `camelCase`
- **Classes & Models:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **API Endpoints:** `kebab-case` (e.g., `/api/auth/tenant/register`)

### Import/Export

```javascript
// Prefer named exports in service/DAO files
export const functionName = async (params) => { };

// Use import statements (ES6 modules)
import * as authService from "../service/auth.service.js";
```

### Error Handling

- Use the custom `AppError` class for consistent error handling
- Always provide meaningful error messages and appropriate HTTP status codes
- Catch errors in controllers and format responses

```javascript
import AppError from "../utils/appError.js";

if (!user) {
    throw new AppError("User not found", 404);
}
```

---

## 3. Database & Transactions

### Multi-Tenant Architecture

- Every user belongs to a `tenantId`
- Always filter queries by `tenantId` where applicable
- Use MongoDB sessions for multi-document transactions

### Transactions

When performing multiple database operations that must succeed together:

```javascript
const session = await mongoose.startSession();
try {
    session.startTransaction();
    // Perform operations with { session }
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

---

## 4. Authentication & Authorization

### JWT Token Handling

- Use the `setToken()` utility to set JWT tokens as HTTP-only cookies
- Token payload includes user identification and role information
- Always validate tokens in protected routes via middleware

### Password Security

- Hash passwords using bcryptjs before storing
- Use the `comparePassword()` method (defined in User model) for login verification
- Minimum password length: 6 characters

---

## 4.1 Authentication Middleware Usage

Three authentication middleware are available in `src/middleware/auth.middleware.js`:

### 1. `authMiddleware`

**Purpose:** Verify JWT token and extract user information

**What it does:**
- Extracts JWT token from HTTP-only cookies
- Verifies token signature using JWT_SECRET
- Decodes token and attaches user data to `req.user`
- Returns 401 if token missing or invalid

**Token payload available in `req.user`:**
```javascript
{
  id: "507f1f77bcf86cd799439012",
  email: "admin@acme.com",
  role: "admin",
  tenantId: "507f1f77bcf86cd799439011"
}
```

**Usage in routes:**
```javascript
import { authMiddleware } from '../middleware/auth.middleware.js';

// Apply to a single route
router.get("/api/tickets", authMiddleware, ticketController.getTickets);

// Apply to all routes in a router
router.use(authMiddleware);
router.get("/tickets", ticketController.getTickets);
```

---

### 2. `isAdmin`

**Purpose:** Verify user has admin role (must be used AFTER `authMiddleware`)

**What it does:**
- Checks if `req.user` exists (requires `authMiddleware` first)
- Verifies `req.user.role === 'admin'`
- Returns 403 (Forbidden) if user is not admin

**Usage in routes:**
```javascript
import { authMiddleware, isAdmin } from '../middleware/auth.middleware.js';

// Protect admin-only endpoints
router.patch(
  "/api/admin/users/:userId/approve",
  authMiddleware,    // ← Must come first to set req.user
  isAdmin,           // ← Then check if admin
  adminController.approveUser
);

// Multiple routes at once
router.use("/api/admin", authMiddleware, isAdmin);
router.patch("/users/:userId/approve", adminController.approveUser);
```

---

### 3. `tenantMiddleware`

**Purpose:** Enforce tenant isolation - prevent users from accessing data of other tenants

**What it does:**
- Extracts tenantId from request parameters
- Verifies user is authenticated (`req.user` must exist)
- Compares `req.user.tenantId` with requested tenant ID
- Returns 403 if user doesn't belong to the tenant

**Important Note for Frontend Developers:**
- **Frontend passes tenantId as a query/body parameter, NOT in the route URL**
- ❌ **Wrong:** `/api/admin/tenants/:tenantId/users`
- ✅ **Correct:** `/api/admin/users` with `{ tenantId: "..." }` in request body or query

**Usage in routes:**
```javascript
import { authMiddleware, isAdmin, tenantMiddleware } from '../middleware/auth.middleware.js';

// Example: Admin getting users in their tenant
router.get(
  "/api/admin/users",
  authMiddleware,        // Verify token
  isAdmin,               // Verify admin role
  tenantMiddleware,      // Verify tenant access (tenantId from params)
  adminController.listUsers
);

// Controller receives:
// req.user = { id, email, role, tenantId }
// req.tenantId = verified tenant ID from params
```

**Frontend Request Example (with query parameter):**
```javascript
// Get all users in tenant
fetch('/api/admin/users?tenantId=507f1f77bcf86cd799439011', {
  method: 'GET',
  credentials: 'include',  // Send JWT cookie
  headers: { 'Content-Type': 'application/json' }
});
```

**Frontend Request Example (with body parameter):**
```javascript
// Approve a user in tenant
fetch('/api/admin/users/507f1f77bcf86cd799439013/approve', {
  method: 'PATCH',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: '507f1f77bcf86cd799439011',  // ← Passed in body
    isApproved: true
  })
});
```

---

### Middleware Chain Examples

**Example 1: Public endpoint (no auth required)**
```javascript
router.post("/api/auth/login", loginValidation, authController.loginUser);
```

**Example 2: Protected endpoint (auth required, any role)**
```javascript
router.get(
  "/api/tickets",
  authMiddleware,
  ticketController.listTickets
);
```

**Example 3: Admin-only endpoint**
```javascript
router.patch(
  "/api/admin/users/:userId/role",
  authMiddleware,
  isAdmin,
  adminController.updateUserRole
);
```

**Example 4: Admin + Tenant isolation**
```javascript
router.get(
  "/api/admin/stats",
  authMiddleware,
  isAdmin,
  tenantMiddleware,  // Ensure admin belongs to requested tenant
  adminController.getTenantStats
);
```

---

## 5. API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation description",
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET/PUT request |
| 201 | Successful POST request (resource created) |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (authentication failed) |
| 403 | Forbidden (authorization failed) |
| 404 | Not found |
| 500 | Server error |

---

## 6. Validation

### Validation Middleware

- Define validation rules in the `validation/` folder
- Use `express-validator` with `body()` for request validation
- Always include a `validateRequest` middleware to check validation results
- Place validation middleware in route definition

```javascript
router.post("/endpoint", validationRules, controllerFunction);
```

### Common Validation Rules

```javascript
body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
```

---

## 7. Comments & Documentation

### Route Documentation

Include JSDoc comments above route definitions:

```javascript
/**
 * @route POST /api/auth/login
 * @desc Login a user and return a JWT token
 * @access Public
 * @body { email, password }
 * @returns {Object} - User details and JWT token
 */
router.post("/login", loginValidation, authController.loginUser);
```

### Function Documentation

Document complex functions with parameters and return types:

```javascript
/**
 * Create a new user with validation
 * @param {Object} userData - User information
 * @param {string} userData.name - User name
 * @param {string} userData.email - User email
 * @returns {Promise<Object>} - Created user object
 */
export const createUser = async (userData) => { };
```

---

## 8. Development Workflow

### Running the Application

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Default port: 3000
```

### Environment Variables

Create a `.env` file in the Backend directory:

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/support-desk
JWT_SECRET=your_secret_key
```

---

## 9. Testing & Debugging

### Console Logging

- Use `console.error()` for errors
- Use `console.log()` for debugging (remove before production)
- Avoid logging sensitive information (passwords, tokens)

### Testing Endpoints

- Use Postman, Thunder Client, or curl for API testing
- Test with valid and invalid data
- Verify error responses and status codes

---

## 10. Security Practices

1. **Never expose sensitive data** in responses (passwords, internal IDs in URLs)
2. **Always validate & sanitize** input from clients
3. **Use HTTPS in production** (configure CORS appropriately)
4. **Protect sensitive routes** with authentication middleware
5. **Keep dependencies updated** - regularly run `npm update`
6. **Use environment variables** for configuration

---

## 11. Common Pitfalls to Avoid

❌ **Don't:**
- Skip tenant validation in multi-tenant queries
- Use `var` instead of `const` or `let`
- Mix callback and async/await patterns
- Forget error handling in async functions
- Commit `.env` files to version control

✅ **Do:**
- Always validate user input
- Use `const` for variables that don't change
- Keep functions focused and single-responsibility
- Use meaningful variable and function names
- Test changes before committing

---

## 12. Git Workflow

- Create feature branches from `main`
- Use descriptive commit messages
- Perform code review before merging
- Keep commits atomic and logical

---

## 13. Resources & References

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [MongoDB Transactions](https://docs.mongodb.com/manual/core/transactions/)

---

**Last Updated:** April 28, 2026
**Version:** 1.0.0
