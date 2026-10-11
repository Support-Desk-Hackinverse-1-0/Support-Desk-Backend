# 💬 Message Module Documentation

## 📌 Overview

The Message Module handles all communication within support tickets. It manages:
- **Customer messages** submitted through widgets
- **Agent replies** to customer inquiries
- **AI-generated responses and suggestions**
- **Message retrieval** for both widget customers and agents

Messages are tightly coupled with the **Ticket Module** and integrate with the **AI Service** for intelligent responses.

---

## 🧠 Responsibilities

### Customer (Widget Users)
- ✅ Send messages through widget
- ✅ Add follow-up messages to existing tickets
- ✅ View ticket conversation history
- ✅ Query knowledge base for self-service

### Agents
- ✅ View customer conversations
- ✅ Send replies to tickets
- ✅ Get AI-generated reply suggestions
- ✅ View full conversation threads

### Admins
- ✅ Access all functionality agents have
- ✅ Monitor message traffic

---

## 🔒 Access Control

### Customer Routes (API Key Authentication)

```
apiKeyMiddleware → controller
```

### Agent Routes (JWT Authentication)

```
authMiddleware → agentRoleCheck → controller
```

**Rules**
- Customers: Access only their own tickets (email-based)
- Agents: Access only assigned tickets (unless admin)
- Admins: Access all tickets in tenant
- Cross-tenant access strictly blocked

---

## 📊 Data Model

### Message Schema

```json
{
  "_id": "MongoDB ObjectId",
  "ticketId": "MongoDB ObjectId (ref: Ticket)",
  "sender": "customer | agent | ai",
  "message": "String (max 5000 chars)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Message Types

1. **customer** - Message from end customer via widget
2. **agent** - Response from support agent
3. **ai** - Auto-generated response from AI system

---

## 🚀 API Endpoints

---

## 📱 CUSTOMER WIDGET ROUTES (API Key Authentication)

### 🔹 1. Send Customer Message

Creates a new ticket and sends initial message. AI processes the message and either responds or creates a ticket.

**Endpoint**

```
POST /api/messages/send
```

**Authentication**

```
X-API-Key: <API_KEY>
```

**Request Body**

```json
{
  "message": "I can't reset my password",
  "customerEmail": "customer@example.com"
}
```

**Request Parameters**

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `message` | String | ✓ | 1-5000 chars | Customer inquiry |
| `customerEmail` | String | ✓ | Valid email | Customer email address |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "ticketId": "507f1f77bcf86cd799439011",
    "customerEmail": "customer@example.com",
    "subject": "I can't reset my password",
    "aiResponse": "Thank you for contacting support. I can help with password resets...",
    "messageId": "507f1f77bcf86cd799439012",
    "status": "open",
    "createdAt": "2024-01-22T10:15:00Z"
  }
}
```

**Error Responses**

```json
{
  "success": false,
  "message": "Message, customer email, and tenant ID are required"
}
```

---

### 🔹 2. Add Message to Existing Ticket

Adds a follow-up message to an open ticket.

**Endpoint**

```
POST /api/messages/ticket/:ticketId
```

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticketId` | String | ✓ | MongoDB ObjectId of ticket |

**Request Body**

```json
{
  "message": "I've tried the steps you mentioned but it still doesn't work"
}
```

**Success Response (200)**

```json
{
  "success": true,
  "message": "Message added successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "ticketId": "507f1f77bcf86cd799439011",
    "sender": "customer",
    "message": "I've tried the steps but it still doesn't work",
    "createdAt": "2024-01-22T11:20:00Z"
  }
}
```

---

### 🔹 3. Get Ticket Messages

Retrieves all messages in a ticket conversation.

**Endpoint**

```
GET /api/messages/:ticketId
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Number | 1 | Page number |
| `limit` | Number | 50 | Messages per page |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "ticketId": "507f1f77bcf86cd799439011",
    "messages": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "sender": "customer",
        "message": "I can't reset my password",
        "createdAt": "2024-01-22T10:15:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439020",
        "sender": "ai",
        "message": "Thank you for contacting support. I can help with password resets...",
        "createdAt": "2024-01-22T10:15:30Z"
      },
      {
        "_id": "507f1f77bcf86cd799439021",
        "sender": "agent",
        "message": "Let me escalate this to our technical team",
        "createdAt": "2024-01-22T10:45:00Z"
      }
    ],
    "total": 3,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### 🔹 4. Get Customer Tickets

Retrieves all tickets for a customer email.

**Endpoint**

```
GET /api/messages/customer/tickets
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | String | ✓ | Customer email |

**Success Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "customerEmail": "customer@example.com",
      "subject": "I can't reset my password",
      "status": "resolved",
      "createdAt": "2024-01-22T10:15:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439022",
      "customerEmail": "customer@example.com",
      "subject": "Billing question",
      "status": "open",
      "createdAt": "2024-01-21T14:30:00Z"
    }
  ]
}
```

---

### 🔹 5. Query Knowledge Base

Directly query the AI knowledge base without creating a ticket.

**Endpoint**

```
POST /api/messages/kb-query
```

**Request Body**

```json
{
  "query": "How do I reset my password?",
  "topK": 5
}
```

**Request Parameters**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | String | ✓ | - | Search query |
| `topK` | Number | ✗ | 5 | Number of results |

**Success Response (200)**

```json
{
  "success": true,
  "message": "Knowledge base query completed",
  "data": [
    {
      "score": 0.95,
      "content": "To reset your password: 1. Click 'Forgot Password' 2. Enter your email 3. Check your inbox...",
      "source": "help_articles",
      "relevance": "very_high"
    },
    {
      "score": 0.87,
      "content": "If you don't receive the reset email, check your spam folder...",
      "source": "faqs",
      "relevance": "high"
    }
  ]
}
```

---

### 🔹 6. Get Widget Configuration

Retrieves widget styling and settings for embedding.

**Endpoint**

```
GET /api/messages/widget-config
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "name": "Support Widget",
    "title": "Chat with us",
    "subtitle": "We are here to help",
    "welcomeMessage": "How can we assist you?",
    "primaryColor": "#007bff",
    "position": "bottom-right",
    "width": 350,
    "height": 500
  }
}
```

---

## 👥 AGENT DASHBOARD ROUTES (JWT Authentication)

### 🔹 7. Get Agent Ticket Messages

Retrieves full conversation thread for agent workspace.

**Endpoint**

```
GET /api/messages/agent/:ticketId
```

**Authentication**

```
Bearer <JWT_TOKEN>
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "ticketId": "507f1f77bcf86cd799439011",
    "ticket": {
      "customerEmail": "customer@example.com",
      "subject": "I can't reset my password",
      "status": "assigned",
      "assignedTo": "507f1f77bcf86cd799439099",
      "createdAt": "2024-01-22T10:15:00Z"
    },
    "messages": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "sender": "customer",
        "message": "I can't reset my password",
        "createdAt": "2024-01-22T10:15:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439020",
        "sender": "ai",
        "message": "Thank you for contacting support. I can help with password resets...",
        "createdAt": "2024-01-22T10:15:30Z"
      },
      {
        "_id": "507f1f77bcf86cd799439021",
        "sender": "agent",
        "message": "I'll help you reset your password. Let me verify your account...",
        "createdAt": "2024-01-22T10:45:00Z"
      }
    ]
  }
}
```

---

### 🔹 8. Send Agent Reply

Agent sends a response to customer.

**Endpoint**

```
POST /api/messages/agent/reply/:ticketId
```

**Request Body**

```json
{
  "message": "I've reset your password. You should receive an email shortly."
}
```

**Request Parameters**

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `message` | String | ✓ | 1-5000 chars | Agent response |

**Success Response (200)**

```json
{
  "success": true,
  "message": "Reply sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439023",
    "ticketId": "507f1f77bcf86cd799439011",
    "sender": "agent",
    "message": "I've reset your password. You should receive an email shortly.",
    "createdAt": "2024-01-22T10:50:00Z"
  }
}
```

**Error Responses**

```json
{
  "success": false,
  "message": "Cannot reply to a resolved ticket. Please reopen it first."
}
```

---

### 🔹 9. Get AI Reply Suggestion

Generates an AI-powered reply suggestion for the agent.

**Endpoint**

```
POST /api/messages/agent/ai-suggest/:ticketId
```

**Success Response (200)**

```json
{
  "success": true,
  "message": "AI suggestion generated",
  "data": {
    "suggestion": "Based on the customer's issue about password reset, here's a suggested response:\n\nThank you for contacting us. I understand you're having trouble resetting your password. Here are the steps to resolve this:\n\n1. Go to the login page and click 'Forgot Password'\n2. Enter your email address\n3. Check your email for a reset link\n4. Follow the link and create a new password\n\nIf you don't receive the email, please check your spam folder. Let me know if this helps!"
  }
}
```

---

## 📝 Implementation Notes

1. **AI Processing** - Customer messages trigger async AI processing to generate suggestions
2. **Message Indexing** - Messages are indexed by `ticketId` and `createdAt` for efficient querying
3. **Ticket Status Transitions** - Messages automatically update ticket status:
   - First agent reply: `open` → `assigned`
   - Reaching resolution: `assigned` → `resolved`
4. **Knowledge Base Integration** - KB queries use vector embeddings for semantic search
5. **Tenant Isolation** - All queries are tenant-scoped

---

## 🔐 Security Considerations

1. **API Key Validation** - Every request validates API key and tenant
2. **Message Sanitization** - All user input is sanitized before storage
3. **Access Control** - Agents can only reply to assigned tickets
4. **Rate Limiting** - API key rate limits apply to message endpoints
5. **Audit Logging** - All message operations are logged for compliance

---

## 🎯 Workflow Examples

### Customer Self-Service Flow

```
1. Customer sends message via widget
   POST /api/messages/send
   
2. AI processes message (async)
   - Searches knowledge base
   - Generates response or escalates to ticket
   
3. Customer checks for responses
   GET /api/messages/:ticketId
   
4. If resolved, customer closes ticket
   (handled by ticket module)
```

### Escalation to Agent Flow

```
1. Customer sends complex query
   POST /api/messages/send
   
2. AI recognizes need for human help
   Creates ticket, assigns to agent
   
3. Agent views ticket & conversation
   GET /api/messages/agent/:ticketId
   
4. Agent gets AI suggestion
   POST /api/messages/agent/ai-suggest/:ticketId
   
5. Agent sends reply
   POST /api/messages/agent/reply/:ticketId
   
6. Customer sees agent reply
   GET /api/messages/:ticketId
```

---

## 📊 Performance Considerations

- Messages are paginated (default 50 per page) for widget views
- Conversation threads for agents load all messages
- KB queries limit results to top-K most relevant (default 5)
- Message data is cached for 5 minutes to reduce DB load
- Indexing on `ticketId` and `createdAt` enables fast retrieval

