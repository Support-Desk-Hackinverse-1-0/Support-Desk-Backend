# 🎨 Chat Widget Module Documentation

## 📌 Overview

The Chat Widget Module enables administrators to create, manage, and configure custom chat widgets that can be embedded on websites. Each widget is **multi-tenant**, **API-key authenticated**, and includes **customizable styling and behavior**.

Key Features:
- Create and manage chat widgets with custom branding
- Generate and manage API keys for widget authentication
- Customize widget appearance (colors, position, size)
- Track API key usage statistics
- Enable/disable widgets as needed

---

## 🧠 Responsibilities

Admins can:
- ✅ Create new chat widgets
- ✅ Update widget configuration (colors, title, position, etc.)
- ✅ Delete widgets
- ✅ Generate and regenerate API keys
- ✅ Manage multiple API keys per widget
- ✅ View API key usage statistics

---

## 🔒 Access Control

### Required Middleware Flow

```
authMiddleware → adminRoleCheck → controller
```

### Rules

* Only users with `role = admin` can access widget management endpoints
* All operations must be restricted to the same `tenantId`
* Cross-tenant access is strictly blocked

---

## 📊 Data Model

### Chat Widget Schema

```json
{
  "_id": "MongoDB ObjectId",
  "tenantId": "MongoDB ObjectId",
  "name": "String (max 100)",
  "description": "String (max 500)",
  "primaryColor": "#007bff",
  "secondaryColor": "#6c757d",
  "textColor": "#212529",
  "backgroundColor": "#ffffff",
  "borderRadius": "Number (0-50)",
  "position": "bottom-right | bottom-left | top-right | top-left",
  "width": "Number (200-600px)",
  "height": "Number (300-800px)",
  "title": "String (max 50)",
  "subtitle": "String (max 100)",
  "welcomeMessage": "String (max 300)",
  "allowedDomains": ["array of domains"],
  "isActive": "Boolean",
  "apiKey": "String (unique)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 🚀 API Endpoints

### 🔹 1. Create Chat Widget

**Endpoint**

```
POST /api/admin/widgets
```

**Authentication**

```
Bearer <JWT_TOKEN>
```

**Request Body**

```json
{
  "name": "Support Widget",
  "description": "Customer support widget for website",
  "primaryColor": "#007bff",
  "secondaryColor": "#6c757d",
  "textColor": "#212529",
  "backgroundColor": "#ffffff",
  "borderRadius": 8,
  "position": "bottom-right",
  "width": 350,
  "height": 500,
  "title": "Chat with us",
  "subtitle": "We are here to help",
  "welcomeMessage": "Hello! How can we assist you today?",
  "allowedDomains": ["example.com", "www.example.com"]
}
```

**Request Parameters**

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `name` | String | ✓ | Max 100 chars | Widget name/identifier |
| `description` | String | ✗ | Max 500 chars | Widget description |
| `primaryColor` | String | ✗ | Valid hex color | Main widget color |
| `secondaryColor` | String | ✗ | Valid hex color | Secondary accent color |
| `textColor` | String | ✗ | Valid hex color | Text color |
| `backgroundColor` | String | ✗ | Valid hex color | Widget background |
| `borderRadius` | Number | ✗ | 0-50 | Corner rounding (px) |
| `position` | String | ✗ | bottom-right, bottom-left, top-right, top-left | Widget position on page |
| `width` | Number | ✗ | 200-600 | Widget width (px) |
| `height` | Number | ✗ | 300-800 | Widget height (px) |
| `title` | String | ✗ | Max 50 chars | Widget header title |
| `subtitle` | String | ✗ | Max 100 chars | Widget header subtitle |
| `welcomeMessage` | String | ✗ | Max 300 chars | Initial greeting message |
| `allowedDomains` | Array | ✗ | Array of strings | Domains where widget can be embedded |

**Success Response (201)**

```json
{
  "success": true,
  "message": "Chat widget created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Support Widget",
    "apiKey": "sk_test_507f1f77bcf86cd799439011_abc123xyz",
    "primaryColor": "#007bff",
    "position": "bottom-right",
    "width": 350,
    "height": 500
  }
}
```

**Error Responses**

```json
{
  "success": false,
  "message": "Widget name is required"
}
```

---

### 🔹 2. Get All Chat Widgets

**Endpoint**

```
GET /api/admin/widgets
```

**Authentication**

```
Bearer <JWT_TOKEN>
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Number | 1 | Page number for pagination |
| `limit` | Number | 10 | Items per page |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "widgets": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Support Widget",
        "description": "Customer support widget",
        "primaryColor": "#007bff",
        "position": "bottom-right",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### 🔹 3. Get Single Chat Widget

**Endpoint**

```
GET /api/admin/widgets/:widgetId
```

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `widgetId` | String | ✓ | MongoDB ObjectId of widget |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Support Widget",
    "description": "Customer support widget",
    "primaryColor": "#007bff",
    "secondaryColor": "#6c757d",
    "textColor": "#212529",
    "backgroundColor": "#ffffff",
    "borderRadius": 8,
    "position": "bottom-right",
    "width": 350,
    "height": 500,
    "title": "Chat with us",
    "subtitle": "We are here to help",
    "welcomeMessage": "Hello! How can we assist you?",
    "allowedDomains": ["example.com"],
    "isActive": true,
    "apiKey": "sk_test_507f1f77bcf86cd799439011_abc123xyz",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 🔹 4. Update Chat Widget

**Endpoint**

```
PUT /api/admin/widgets/:widgetId
```

**Request Body** (same fields as create, all optional)

```json
{
  "title": "Customer Support",
  "primaryColor": "#ff6b6b",
  "position": "bottom-left"
}
```

**Success Response (200)**

```json
{
  "success": true,
  "message": "Chat widget updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Support Widget",
    "title": "Customer Support",
    "primaryColor": "#ff6b6b",
    "position": "bottom-left",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

---

### 🔹 5. Delete Chat Widget

**Endpoint**

```
DELETE /api/admin/widgets/:widgetId
```

**Success Response (200)**

```json
{
  "success": true,
  "message": "Chat widget deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Support Widget"
  }
}
```

---

### 🔹 6. Regenerate API Key

Generates a new primary API key for a widget. Old key becomes invalid.

**Endpoint**

```
POST /api/admin/widgets/:widgetId/regenerate-key
```

**Success Response (200)**

```json
{
  "success": true,
  "message": "API key regenerated successfully",
  "data": {
    "widgetId": "507f1f77bcf86cd799439011",
    "apiKey": "sk_test_507f1f77bcf86cd799439011_new_key_xyz"
  }
}
```

---

### 🔹 7. Get API Keys for Widget

**Endpoint**

```
GET /api/admin/widgets/:widgetId/api-keys
```

**Success Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "widgetId": "507f1f77bcf86cd799439011",
      "name": "Production Key",
      "key": "sk_test_507f1f77bcf86cd799439011_abc123xyz",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "expiresAt": null
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "widgetId": "507f1f77bcf86cd799439011",
      "name": "Testing Key",
      "key": "sk_test_507f1f77bcf86cd799439011_test_key_123",
      "isActive": false,
      "createdAt": "2024-01-20T14:22:00Z",
      "expiresAt": "2024-02-20T14:22:00Z"
    }
  ]
}
```

---

### 🔹 8. Create Additional API Key

**Endpoint**

```
POST /api/admin/widgets/:widgetId/api-keys
```

**Request Body**

```json
{
  "name": "Testing Key",
  "description": "Key for testing environment",
  "rateLimit": 1000,
  "expiresAt": "2024-02-15T00:00:00Z"
}
```

**Request Parameters**

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `name` | String | ✓ | Max 100 chars | Key name |
| `description` | String | ✗ | Max 500 chars | Key description |
| `rateLimit` | Number | ✗ | Min 1 | Requests per minute |
| `expiresAt` | Date | ✗ | ISO 8601 format | Key expiration date |

**Success Response (201)**

```json
{
  "success": true,
  "message": "API key created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "widgetId": "507f1f77bcf86cd799439011",
    "name": "Testing Key",
    "key": "sk_test_507f1f77bcf86cd799439011_test_key_456",
    "isActive": true,
    "createdAt": "2024-01-22T09:15:00Z",
    "expiresAt": "2024-02-15T00:00:00Z"
  }
}
```

---

### 🔹 9. Delete API Key

**Endpoint**

```
DELETE /api/admin/api-keys/:keyId
```

**Success Response (200)**

```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

---

### 🔹 10. Get API Key Statistics

**Endpoint**

```
GET /api/admin/api-keys/:keyId/stats
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "keyId": "507f1f77bcf86cd799439012",
    "name": "Production Key",
    "totalRequests": 15420,
    "requestsThisMonth": 3215,
    "requestsToday": 145,
    "lastUsed": "2024-01-22T15:30:45Z",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🔐 Security Considerations

1. **API Key Rotation** - Regenerate keys periodically for enhanced security
2. **Rate Limiting** - Enforce rate limits on API keys to prevent abuse
3. **Domain Whitelisting** - Only allow widget to load on specified domains
4. **Expiration** - Set expiration dates on temporary API keys
5. **Tenant Isolation** - All operations are tenant-scoped; no cross-tenant access

---

## 📝 Implementation Notes

- Widget configurations are cached in Redis for faster customer-facing loads
- API keys use secure hashing; raw keys are never stored
- Changes to widget styling are applied immediately
- Deleted widgets retain their messages for audit purposes (soft delete)
- API key statistics are aggregated hourly for performance

---

## 🎯 Use Cases

1. **E-commerce Site** - Embed support widget on product pages
2. **SaaS Platform** - Multiple widgets for different product lines
3. **Support Portal** - Widget on help center for customer self-service
4. **Multi-region** - Different widgets for different geographic regions
5. **A/B Testing** - Create multiple widgets with different styling to test engagement

