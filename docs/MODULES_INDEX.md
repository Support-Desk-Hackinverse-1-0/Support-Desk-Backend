# 📚 Backend Modules Index

Complete reference guide for all Support Desk Backend modules.

---

## 📋 Module Overview

| Module | Purpose | Authentication | Access Level |
|--------|---------|-----------------|--------------|
| **Auth Module** | User registration, login, tenant management | Public/JWT | Admin, Users |
| **Admin Module** | User management, role assignment, statistics | JWT | Admin only |
| **Chat Widget** | Widget creation, configuration, API key management | JWT | Admin only |
| **Ticket Module** | Support ticket lifecycle management | JWT/API Key | Agents, Admins, Customers |
| **Message Module** | Customer-agent communication within tickets | JWT/API Key | Agents, Admins, Customers |
| **Public Routes** | Widget configuration retrieval for embedding | None | Public |

---

## 🔐 Authentication Methods

### 1. No Authentication (Public)
**Used by:** Public Routes
- Widget config retrieval
- Knowledge base queries
- Anyone can access with API key

### 2. API Key Authentication
**Used by:** Message Module (customer endpoints), Ticket Module (customer creation)
- `X-API-Key` header or query parameter
- Scoped to specific tenant
- Rate-limited per key

### 3. JWT Authentication
**Used by:** Auth, Admin, Chat Widget, Ticket, Message (agent endpoints)
- Bearer token in `Authorization` header
- Role-based access control (admin/agent)
- Tenant-scoped operations

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────┐
│                 ROUTES                          │
│         (Express Route Definitions)              │
├─────────────────────────────────────────────────┤
│          MIDDLEWARE & VALIDATION                │
│  (Auth, Role Check, Request Validation)         │
├─────────────────────────────────────────────────┤
│               CONTROLLERS                       │
│        (HTTP Request Handlers)                  │
├─────────────────────────────────────────────────┤
│                SERVICES                         │
│        (Business Logic & Orchestration)         │
├─────────────────────────────────────────────────┤
│              DAO LAYER                          │
│        (Database Access Objects)                │
├─────────────────────────────────────────────────┤
│               MODELS                            │
│    (Mongoose Schemas & Database Structure)      │
├─────────────────────────────────────────────────┤
│              MONGODB                            │
│         (Data Persistence)                      │
└─────────────────────────────────────────────────┘
```

---

## 📦 Directory Structure Reference

```
Backend/
├── src/
│   ├── routes/              # Express route definitions
│   │   ├── auth.routes.js
│   │   ├── admin.routes.js
│   │   ├── ticket.routes.js
│   │   ├── message.routes.js
│   │   ├── chatWidget.routes.js
│   │   └── public.routes.js
│   │
│   ├── controllers/         # HTTP request handlers
│   │   ├── auth.controller.js
│   │   ├── admin.controller.js
│   │   ├── ticket.controller.js
│   │   ├── message.controller.js
│   │   ├── chatWidget.controller.js
│   │   └── widgetConfig.controller.js
│   │
│   ├── service/            # Business logic layer
│   │   ├── auth.service.js
│   │   ├── admin.service.js
│   │   ├── ticket.service.js
│   │   ├── message.service.js
│   │   ├── ai.service.js
│   │   └── storage.service.js
│   │
│   ├── dao/                # Database access objects
│   │   ├── user.dao.js
│   │   ├── tenant.dao.js
│   │   ├── ticket.dao.js
│   │   ├── message.dao.js
│   │   ├── chatWidget.dao.js
│   │   └── apiKey.dao.js
│   │
│   ├── models/             # Mongoose schemas
│   │   ├── user.model.js
│   │   ├── tenant.model.js
│   │   ├── ticket.model.js
│   │   ├── message.model.js
│   │   ├── chatWidget.model.js
│   │   └── apiKey.model.js
│   │
│   ├── middleware/         # Custom middleware
│   │   ├── auth.middleware.js
│   │   ├── apiKey.middleware.js
│   │   ├── roleCheck.middleware.js
│   │   └── validateRequest.js
│   │
│   ├── validation/         # Request validation schemas
│   │   ├── auth.validation.js
│   │   ├── ticket.validation.js
│   │   ├── message.validation.js
│   │   ├── chatWidget.validation.js
│   │   └── admin.validation.js
│   │
│   ├── config/             # Configuration files
│   │   ├── config.js
│   │   ├── db.js
│   │   ├── multer.js
│   │   └── vectorDb.js
│   │
│   ├── utils/              # Helper utilities
│   │   ├── appError.js
│   │   ├── getEmbeddings.js
│   │   ├── setToken.js
│   │   └── validate.js
│   │
│   └── app.js              # Express app setup
│
├── docs/                   # Documentation
│   ├── AUTH_MODULE.md
│   ├── ADMIN.MODULE.md
│   ├── CHAT_WIDGET_MODULE.md
│   ├── MESSAGE_MODULE.md
│   ├── TICKET_MODULE.md
│   ├── PUBLIC_ROUTES.md
│   └── BACKEND_RULES.md
│
├── package.json
└── server.js              # Application entry point
```

---

## 🔄 Data Flow Examples

### Example 1: Customer Sending Message via Widget

```
Customer on Website
        ↓
  widget.js (public/widget.js)
        ↓
  POST /api/public/widget-config (get styling)
        ↓
  Customer types message
        ↓
  POST /api/messages/send (API Key auth)
        ↓
  messageController.sendMessage()
        ↓
  messageService.addMessage()
        ↓
  aiService.processCustomerMessage()
        ↓
  Create Ticket OR Send AI Response
        ↓
  messageDAO.createMessage()
        ↓
  MongoDB: Insert Message Document
        ↓
  Response sent back to Customer
```

### Example 2: Agent Responding to Ticket

```
Agent logs in
        ↓
  POST /api/auth/login
        ↓
  JWT token issued
        ↓
  Agent views dashboard
        ↓
  GET /api/tickets?assigned=me (JWT auth)
        ↓
  ticketController.getTickets()
        ↓
  ticketService.getTickets()
        ↓
  ticketDAO.getTickets()
        ↓
  MongoDB: Query Tickets
        ↓
  Agent clicks on ticket
        ↓
  GET /api/messages/agent/:ticketId
        ↓
  messageController.getAgentTicketMessages()
        ↓
  MongoDB: Fetch Messages
        ↓
  Agent sees conversation
        ↓
  Agent types reply
        ↓
  POST /api/messages/agent/reply/:ticketId
        ↓
  messageService.addAgentReply()
        ↓
  messageDAO.createMessage()
        ↓
  Ticket status auto-updated
        ↓
  Response sent to Agent
```

### Example 3: Admin Managing Widgets

```
Admin logs in
        ↓
  POST /api/auth/login
        ↓
  JWT token issued
        ↓
  Admin navigates to Widgets
        ↓
  GET /api/admin/widgets (JWT + admin check)
        ↓
  chatWidgetController.getChatWidgets()
        ↓
  chatWidgetDAO.getChatWidgetsByTenant()
        ↓
  MongoDB: Query ChatWidgets
        ↓
  Admin sees widget list
        ↓
  Admin clicks "Create Widget"
        ↓
  POST /api/admin/widgets (JWT + admin check)
        ↓
  Validation: createWidgetValidation middleware
        ↓
  chatWidgetController.createChatWidget()
        ↓
  chatWidgetDAO.createChatWidget()
        ↓
  Generate API Key
        ↓
  MongoDB: Insert ChatWidget Document
        ↓
  Response with new widget & API key
```

---

## 🔐 Security Layers

### 1. Authentication Middleware
- **authMiddleware** - Validates JWT token and extracts user info
- **apiKeyMiddleware** - Validates API key and extracts tenant info

### 2. Authorization Middleware
- **adminRoleCheck** - Only allow admin users
- **agentRoleCheck** - Allow admin and agent users
- **roleCheck** - General role-based access control

### 3. Request Validation
- **validateRequest** - Express-validator middleware
- **Validation schemas** - Per-module input validation
- **appError** - Centralized error handling

### 4. Tenant Isolation
- All queries include `tenantId` filter
- Users can only access their own tenant's data
- Cross-tenant requests are blocked

---

## 📊 Entity Relationships

```
┌──────────────┐
│    Tenant    │
└────┬─────────┘
     │
     ├─────────────────┬──────────────┬──────────────┐
     │                 │              │              │
     ↓                 ↓              ↓              ↓
  ┌──────┐       ┌──────────┐   ┌────────┐    ┌──────────────┐
  │ User │       │ ChatWidget│   │ Ticket │    │    Message   │
  └──────┘       └────┬──────┘   └───┬────┘    └──────────────┘
     ↑                │              │
     │                │              └─────────────┬──────────┐
     │                ↓                            │          │
     │           ┌────────┐                   assigned to   contains
     └───────────│ApiKey  │
                 └────────┘
```

**Relationships:**
- **Tenant** → many Users
- **Tenant** → many ChatWidgets
- **Tenant** → many Tickets
- **ChatWidget** → many ApiKeys
- **Ticket** → many Messages
- **Ticket** → assigned to User (optional)
- **Message** → belongs to Ticket

---

## 🚀 Common API Patterns

### Pattern 1: CRUD Operations

```
Create  → POST   /api/resource
Read    → GET    /api/resource/:id
Update  → PUT    /api/resource/:id
Delete  → DELETE /api/resource/:id
List    → GET    /api/resource
```

### Pattern 2: Nested Resources

```
GET    /api/admin/widgets/:widgetId/api-keys
POST   /api/admin/widgets/:widgetId/api-keys
DELETE /api/admin/api-keys/:keyId
```

### Pattern 3: Actions

```
POST   /api/admin/widgets/:widgetId/regenerate-key
POST   /api/messages/agent/ai-suggest/:ticketId
PATCH  /api/tickets/:ticketId/status
PATCH  /api/tickets/:ticketId/assign
```

### Pattern 4: Queries with Filters

```
GET /api/tickets?status=open&page=1&limit=10
GET /api/messages?ticketId=123&page=1&limit=50
```

---

## 📖 Documentation Files

| Document | Purpose | Audience |
|----------|---------|----------|
| **AUTH_MODULE.md** | User registration, login, tenant management | Everyone |
| **ADMIN.MODULE.md** | Admin operations, user management | Admin users |
| **CHAT_WIDGET_MODULE.md** | Widget creation, configuration, API keys | Admin users |
| **TICKET_MODULE.md** | Support ticket lifecycle | Admin, Agents, Customers |
| **MESSAGE_MODULE.md** | Communication within tickets | Admin, Agents, Customers |
| **PUBLIC_ROUTES.md** | Widget embedding for websites | Frontend developers |
| **BACKEND_RULES.md** | Development standards and guidelines | Developers |

---

## 🎯 Quick Start for Developers

### 1. New Module Setup

```
Create files in order:
1. models/      (Mongoose schema)
2. routes/      (Express routes)
3. validation/  (Input validation)
4. controllers/ (Request handlers)
5. service/     (Business logic)
6. dao/         (Database queries)
```

### 2. Error Handling

```javascript
// Use AppError for consistency
import AppError from "../utils/appError.js";

throw new AppError("User not found", 404);
throw new AppError("Unauthorized access", 403);
throw new AppError("Invalid input", 400);
```

### 3. Tenant Isolation

```javascript
// Always include tenantId in queries
const { tenantId } = req.user;
const document = await Model.findOne({ _id: id, tenantId });
```

### 4. Response Format

```javascript
// Success
res.status(200).json({
  success: true,
  data: {...},
  message: "Operation completed"
});

// Error
res.status(400).json({
  success: false,
  message: "Error description"
});
```

---

## 🔗 Related Resources

- **Configuration** - See [BACKEND_RULES.md](BACKEND_RULES.md) for development standards
- **Database** - MongoDB with Mongoose ORM
- **Authentication** - JWT tokens + API keys
- **Validation** - express-validator library
- **Error Handling** - Custom AppError class

---

## 📞 Support

For detailed information on any module:
1. Read the module-specific documentation
2. Check the source code in `src/`
3. Review the database models in `models/`
4. Examine the routes in `routes/`

