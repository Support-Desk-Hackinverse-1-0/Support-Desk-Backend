# 🎫 Ticket Module Documentation

## 📌 Overview

The Ticket Module manages the complete lifecycle of support tickets. It handles:
- **Ticket Creation** - From customer inquiries via widgets
- **Ticket Assignment** - Auto-assignment to available agents
- **Status Management** - Track ticket progress (open → assigned → resolved)
- **Ticket Querying** - Role-based filtering and pagination
- **Agent Assignment** - Admin reassignment capabilities

Tickets serve as the central container for all customer conversations and agent interactions.

---

## 🧠 Responsibilities

### Customers (via Widget)
- ✅ Create tickets with initial inquiry
- ✅ View own tickets
- ✅ Add follow-up messages to tickets

### Agents
- ✅ View assigned tickets
- ✅ View all open tickets in tenant
- ✅ Update ticket status
- ✅ Add replies to tickets

### Admins
- ✅ Create tickets on behalf of customers
- ✅ View all tickets in tenant
- ✅ Update any ticket status
- ✅ Reassign tickets between agents

---

## 🔒 Access Control

### Required Middleware Flow

```
authMiddleware → [agentRoleCheck] → controller
```

**Rules**

| Role | Create | View Own | View All | Assign | Update Status |
|------|--------|----------|----------|--------|---------------|
| Customer | ✓ (via widget) | ✓ | ✗ | ✗ | ✗ |
| Agent | ✓ | ✓ (assigned only) | ✓ (open) | ✗ | ✓ (own tickets) |
| Admin | ✓ | ✓ (all) | ✓ (all) | ✓ | ✓ (all) |

- **Tenant Isolation** - All operations restricted to same `tenantId`
- **Role-Based Filtering** - Agents see different views than admins
- **Cross-tenant access** strictly blocked

---

## 📊 Data Model

### Ticket Schema

```json
{
  "_id": "MongoDB ObjectId",
  "tenantId": "MongoDB ObjectId (ref: Tenant)",
  "customerEmail": "String (valid email)",
  "subject": "String (max 200)",
  "status": "open | assigned | resolved",
  "assignedTo": "MongoDB ObjectId (ref: User) | null",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Ticket Lifecycle

```
┌─────────────────────────────────────────┐
│              CREATED                     │
│        (auto-assigned if agent exists)   │
└────────────────┬────────────────────────┘
                 │
         ┌───────▼───────┐
         │      OPEN     │
         └───────┬───────┘
                 │
     ┌───────────▼───────────┐
     │ Auto-assign to agent? │
     └───────┬───────────┬───┘
             │           │
        YES  │           │ NO
             │           │
    ┌────────▼──────┐    │
    │   ASSIGNED    │    │
    └────────┬──────┘    │
             │           │
             │    ┌──────▼────────┐
             │    │   UNASSIGNED   │
             │    │  (stays OPEN)  │
             │    └────────────────┘
             │
    ┌────────▼──────────────┐
    │  Agent responds       │
    │  Status: ASSIGNED     │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │  Issue Resolved       │
    │  Status: RESOLVED     │
    └───────────────────────┘
```

---

## 🚀 API Endpoints

### 🔹 1. Create Ticket

Creates a new support ticket. Automatically assigns to an available agent if one exists.

**Endpoint**

```
POST /api/tickets
```

**Authentication**

```
Bearer <JWT_TOKEN>
```

**Request Body**

```json
{
  "customerEmail": "customer@example.com",
  "subject": "I can't reset my password"
}
```

**Request Parameters**

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `customerEmail` | String | ✓ | Valid email | Customer's email address |
| `subject` | String | ✓ | Max 200 chars | Ticket subject/title |

**Success Response (201)**

```json
{
  "success": true,
  "message": "Ticket created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "customerEmail": "customer@example.com",
    "subject": "I can't reset my password",
    "status": "assigned",
    "assignedTo": {
      "_id": "507f1f77bcf86cd799439099",
      "name": "John Agent",
      "email": "john@support.com"
    },
    "createdAt": "2024-01-22T10:15:00Z",
    "updatedAt": "2024-01-22T10:15:00Z"
  }
}
```

**Alternative Response (No agents available)**

```json
{
  "success": true,
  "message": "Ticket created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "customerEmail": "customer@example.com",
    "subject": "I can't reset my password",
    "status": "open",
    "assignedTo": null,
    "createdAt": "2024-01-22T10:15:00Z"
  }
}
```

**Error Responses**

```json
{
  "success": false,
  "message": "Valid email required"
}
```

---

### 🔹 2. Get Tickets (List)

Retrieves tickets with role-based filtering and pagination.

**Endpoint**

```
GET /api/tickets
```

**Authentication**

```
Bearer <JWT_TOKEN>
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | String | - | Filter by status: open, assigned, resolved |
| `assigned` | String | - | Show only tickets assigned to "me" |
| `page` | Number | 1 | Page number for pagination |
| `limit` | Number | 10 | Items per page (max 100) |

**Request Examples**

```
# Get all open tickets
GET /api/tickets?status=open

# Get tickets assigned to current agent
GET /api/tickets?assigned=me

# Get resolved tickets with pagination
GET /api/tickets?status=resolved&page=2&limit=25
```

**Success Response (200)**

**For Agents:**
```json
{
  "success": true,
  "message": "Tickets fetched",
  "data": {
    "tickets": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "customerEmail": "customer@example.com",
        "subject": "I can't reset my password",
        "status": "assigned",
        "assignedTo": "507f1f77bcf86cd799439099",
        "createdAt": "2024-01-22T10:15:00Z",
        "updatedAt": "2024-01-22T11:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

**For Admins:**
```json
{
  "success": true,
  "message": "Tickets fetched",
  "data": {
    "tickets": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "customerEmail": "customer@example.com",
        "subject": "I can't reset my password",
        "status": "assigned",
        "assignedTo": {
          "_id": "507f1f77bcf86cd799439099",
          "name": "John Agent",
          "email": "john@support.com"
        },
        "createdAt": "2024-01-22T10:15:00Z",
        "updatedAt": "2024-01-22T11:30:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "customerEmail": "another@example.com",
        "subject": "Billing question",
        "status": "open",
        "assignedTo": null,
        "createdAt": "2024-01-22T09:45:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "totalPages": 3
  }
}
```

---

### 🔹 3. Get Single Ticket

Retrieves a specific ticket with full details including assigned agent.

**Endpoint**

```
GET /api/tickets/:ticketId
```

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticketId` | String | ✓ | MongoDB ObjectId of ticket |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "tenantId": "507f1f77bcf86cd799439000",
    "customerEmail": "customer@example.com",
    "subject": "I can't reset my password",
    "status": "assigned",
    "assignedTo": {
      "_id": "507f1f77bcf86cd799439099",
      "name": "John Agent",
      "email": "john@support.com",
      "role": "agent",
      "isOnline": true
    },
    "createdAt": "2024-01-22T10:15:00Z",
    "updatedAt": "2024-01-22T11:30:00Z"
  }
}
```

**Error Responses**

```json
{
  "success": false,
  "message": "Ticket not found"
}
```

---

### 🔹 4. Update Ticket Status

Updates the status of a ticket. Agents can only update tickets assigned to them; admins can update any ticket.

**Endpoint**

```
PATCH /api/tickets/:ticketId/status
```

**Request Body**

```json
{
  "status": "resolved"
}
```

**Request Parameters**

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `status` | String | ✓ | open, assigned, resolved | New ticket status |

**Success Response (200)**

```json
{
  "success": true,
  "message": "Ticket status updated",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "customerEmail": "customer@example.com",
    "subject": "I can't reset my password",
    "status": "resolved",
    "assignedTo": "507f1f77bcf86cd799439099",
    "createdAt": "2024-01-22T10:15:00Z",
    "updatedAt": "2024-01-22T12:00:00Z"
  }
}
```

**Error Responses**

```json
{
  "success": false,
  "message": "You can only update tickets assigned to you"
}
```

```json
{
  "success": false,
  "message": "Status must be one of: open, assigned, resolved"
}
```

---

### 🔹 5. Assign Ticket to Agent

Reassigns a ticket to a different agent. Admin only.

**Endpoint**

```
PATCH /api/tickets/:ticketId/assign
```

**Request Body**

```json
{
  "agentId": "507f1f77bcf86cd799439099"
}
```

**Request Parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agentId` | String | ✓ | MongoDB ObjectId of agent |

**Success Response (200)**

```json
{
  "success": true,
  "message": "Ticket reassigned successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "customerEmail": "customer@example.com",
    "subject": "I can't reset my password",
    "status": "assigned",
    "assignedTo": {
      "_id": "507f1f77bcf86cd799439099",
      "name": "Jane Supervisor",
      "email": "jane@support.com"
    },
    "updatedAt": "2024-01-22T12:30:00Z"
  }
}
```

**Error Responses**

```json
{
  "success": false,
  "message": "agentId is required"
}
```

```json
{
  "success": false,
  "message": "Agent not found in this tenant"
}
```

---

## 📊 Business Logic

### Auto-Assignment Algorithm

When a ticket is created, the system:

1. Queries for agents with `role: agent or admin` AND `isApproved: true`
2. Assigns to the first available agent found
3. Sets ticket status to `assigned`
4. If no agent available, leaves ticket `open` and `assignedTo: null`

```javascript
const agent = await User.findOne({
  tenantId,
  role: { $in: ['agent', 'admin'] },
  isApproved: true
});
```

### Status Transitions

**Valid State Transitions:**

```
open       → assigned, resolved
assigned   → open, resolved
resolved   → open (reopen)
```

**Automatic Transitions:**

- First message from agent → automatically sets status to `assigned`
- Status update to `resolved` → closes ticket for further replies

---

## 🔐 Security Considerations

1. **Tenant Isolation** - All queries include `tenantId` filter
2. **Role-Based Access** - Agents can only see assigned tickets unless admin
3. **Email Validation** - Customer emails are validated on creation
4. **Audit Trail** - All status changes are timestamped in `updatedAt`
5. **Assignment Validation** - New agent must belong to same tenant

---

## 📈 Performance Optimization

1. **Indexing**
   - `tenantId: 1` - Fast tenant filtering
   - `customerEmail: 1` - Quick customer lookup
   - `status: 1` - Status-based filtering
   - `assignedTo: 1` - Agent ticket retrieval

2. **Pagination** - Default 10 items per page, max 100 prevents memory issues

3. **Denormalization** - Agent info returned with ticket to reduce DB queries

---

## 🎯 Integration Points

- **Message Module** - Tickets are containers for messages
- **AI Service** - AI processes messages and can escalate to tickets
- **User Module** - Agents/admins must exist in User collection
- **Tenant Module** - Tickets belong to specific tenants

---

## 📝 Common Workflows

### Customer Submitting Issue via Widget

```
1. Customer sends message via widget
   POST /api/messages/send
   
2. Backend creates ticket
   POST /api/tickets (internal)
   
3. Ticket auto-assigned to agent
   status: "assigned"
   
4. Agent receives notification
   Can view via GET /api/tickets/?assigned=me
```

### Agent Resolving Ticket

```
1. Agent views ticket messages
   GET /api/messages/agent/:ticketId
   
2. Agent sends reply
   POST /api/messages/agent/reply/:ticketId
   
3. Agent marks as resolved
   PATCH /api/tickets/:ticketId/status
   { status: "resolved" }
   
4. Customer sees resolution
   Ticket no longer accepts new replies
```

### Admin Reassigning Ticket

```
1. Admin views all tickets
   GET /api/tickets
   
2. Admin finds overloaded agent
   
3. Admin reassigns ticket
   PATCH /api/tickets/:ticketId/assign
   { agentId: "new_agent_id" }
   
4. Ticket status remains assigned
   Assigned to new agent
```

---

## 📊 Metrics & Monitoring

Track these KPIs for support operations:

- **Ticket Volume** - Total tickets created per day/month
- **Resolution Time** - Time from creation to resolved status
- **Agent Load** - Average tickets per agent
- **Assignment Rate** - % of tickets auto-assigned vs. unassigned
- **Status Distribution** - % in open, assigned, resolved states

