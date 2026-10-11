# 🔐 Admin Module Documentation

## 📌 Overview

The Admin Module provides administrative control over users and system analytics within a **multi-tenant Support Desk platform**.

It ensures:

* Role-based access control (RBAC)
* Strict tenant isolation
* Secure user management

---

## 🧠 Responsibilities

Admin can:

* View all users in their tenant
* Approve or reject agents
* Assign roles (admin / agent)
* View system statistics

---

## 🔒 Access Control

### Required Middleware Flow

```
authMiddleware → isAdmin → tenantMiddleware → controller
```

### Rules

* Only users with `role = admin` can access
* All operations must be restricted to the same `tenantId`
* Cross-tenant access is strictly blocked

---

## 🚀 API Endpoints

---

### 🔹 1. Get All Users

**Endpoint**

```
GET /api/admin/users
```

**Query**

```json
{
  "tenantId": "507f1f77bcf86cd799439011"
}
```

**Response**

```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Jane Smith",
      "email": "jane@company.com",
      "role": "agent",
      "isApproved": false,
      "isOnline": true
    }
  ]
}
```

---

### 🔹 2. Approve / Reject User

**Endpoint**

```
PATCH /api/admin/users/:userId/approve
```

**Example**

```
PATCH /api/admin/users/507f1f77bcf86cd799439013/approve
```

**Body**

```json
{
  "tenantId": "507f1f77bcf86cd799439011",
  "isApproved": true
}
```

**Response**

```json
{
  "success": true,
  "message": "User approval updated",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "isApproved": true
  }
}
```

**Business Rules**

* Cannot approve another admin
* Cannot approve already approved user
* User must belong to same tenant

---

### 🔹 3. Update User Role

**Endpoint**

```
PATCH /api/admin/users/:userId/role
```

**Example**

```
PATCH /api/admin/users/507f1f77bcf86cd799439013/role
```

**Body**

```json
{
  "tenantId": "507f1f77bcf86cd799439011",
  "role": "admin"
}
```

**Response**

```json
{
  "success": true,
  "message": "User role updated",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "role": "admin"
  }
}
```

**Business Rules**

* Cannot change own role
* Only `admin` or `agent` allowed
* If downgraded to agent → `isApproved = false`

---

### 🔹 4. Get Dashboard Stats

**Endpoint**

```
GET /api/admin/stats
```

**Query**

```json
{
  "tenantId": "507f1f77bcf86cd799439011"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "totalTickets": 45,
    "openTickets": 12,
    "assignedTickets": 18,
    "resolvedTickets": 15,
    "totalAgents": 5,
    "approvedAgents": 4,
    "pendingApproval": 1,
    "resolutionRate": 85.5
  }
}
```

---

## ⚠️ Error Scenarios

### ❌ Invalid User ID

```json
{
  "success": false,
  "message": "Invalid user ID"
}
```

### ❌ Tenant ID Missing

```json
{
  "success": false,
  "message": "Tenant ID not provided"
}
```

### ❌ Unauthorized (Not Admin)

```json
{
  "success": false,
  "message": "Access denied. Admin role required"
}
```

### ❌ Cross-Tenant Access

```json
{
  "success": false,
  "message": "Access denied. User does not belong to this tenant"
}
```

---

## 🔄 Request Flow

```
Client Request
   ↓
Route
   ↓
Validation (express-validator)
   ↓
authMiddleware (JWT verification)
   ↓
isAdmin (role check)
   ↓
tenantMiddleware (tenant validation)
   ↓
Controller
   ↓
Service (business logic)
   ↓
Database (MongoDB)
```

---

## ✅ Best Practices

* Always use `req.user.tenantId` internally (do not trust client input)
* Validate all request data
* Never expose sensitive fields (passwords)
* Keep business logic inside service layer
* Use consistent API response format

---

## 📌 Summary

This module ensures:

* Secure admin-level operations
* Strict multi-tenant isolation
* Scalable backend architecture

It forms the **control layer of the entire system**.
