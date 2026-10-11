# 🌐 Public Routes Documentation

## 📌 Overview

The Public Routes module provides **unauthenticated endpoints** for customers embedding chat widgets on their websites. These endpoints require no JWT token or user authentication, only a valid **API Key**.

Key Features:
- ✅ Retrieve widget configuration for embedding
- ✅ No authentication overhead for customer-facing requests
- ✅ CORS-friendly for cross-origin widget loads
- ✅ Cacheable responses for performance

---

## 🧠 Responsibilities

- ✅ Serve widget configurations to website visitors
- ✅ Enable widget JavaScript to fetch styling/branding
- ✅ Support multiple endpoints for flexibility
- ✅ Fast response times for real-time widget loading

---

## 🔒 Access Control

### No Authentication Required

```
GET /api/public/* (No middleware)
```

**Security Notes:**
- Widget config is **public by design** - it's meant to be visible to users
- API key validation happens in the **client** (not in these endpoints)
- Sensitive data (admin info, customer emails) is **never** returned
- CORS headers allow cross-origin requests from whitelisted domains

---

## 📊 Data Model

### Public Widget Configuration

Returns only the **styling and behavioral settings** needed for widget display:

```json
{
  "name": "Support Widget",
  "title": "Chat with us",
  "subtitle": "We are here to help",
  "welcomeMessage": "Hello! How can we assist you?",
  "primaryColor": "#007bff",
  "position": "bottom-right",
  "width": 350,
  "height": 500
}
```

**Excluded from Public Config:**
- ❌ API keys
- ❌ Admin email
- ❌ Tenant information
- ❌ Usage statistics
- ❌ Internal database IDs

---

## 🚀 API Endpoints

### 🔹 1. Get Widget Config by Query Parameter

**Endpoint**

```
GET /api/public/widget-config
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | String | ✓ | Widget API key |

**Request Example**

```
GET /api/public/widget-config?apiKey=sk_test_507f1f77bcf86cd799439011_abc123xyz
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "name": "Support Widget",
    "title": "Chat with us",
    "subtitle": "We are here to help",
    "welcomeMessage": "Hello! How can we assist you today?",
    "primaryColor": "#007bff",
    "secondaryColor": "#6c757d",
    "textColor": "#212529",
    "backgroundColor": "#ffffff",
    "borderRadius": 8,
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
  "message": "API Key is required in query parameter"
}
```

```json
{
  "success": false,
  "message": "Widget not found or inactive"
}
```

---

### 🔹 2. Get Widget Config by Path Parameter

**Endpoint**

```
GET /api/public/widget/:apiKey/config
```

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | String | ✓ | Widget API key |

**Request Example**

```
GET /api/public/widget/sk_test_507f1f77bcf86cd799439011_abc123xyz/config
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "name": "Support Widget",
    "title": "Chat with us",
    "subtitle": "We are here to help",
    "welcomeMessage": "Hello! How can we assist you today?",
    "primaryColor": "#007bff",
    "secondaryColor": "#6c757d",
    "textColor": "#212529",
    "backgroundColor": "#ffffff",
    "borderRadius": 8,
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
  "message": "Widget not found or inactive"
}
```

---

## 💻 Client-Side Usage

### Example: Embedding Widget in HTML

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Store</h1>
    <p>Browse our products...</p>

    <!-- Widget Script -->
    <script>
        // 1. Fetch widget configuration
        const apiKey = 'sk_test_507f1f77bcf86cd799439011_abc123xyz';
        const configUrl = `/api/public/widget-config?apiKey=${apiKey}`;

        fetch(configUrl)
            .then(res => res.json())
            .then(response => {
                if (response.success) {
                    const config = response.data;
                    
                    // 2. Create widget container
                    const widget = document.createElement('div');
                    widget.id = 'chat-widget';
                    widget.style.position = 'fixed';
                    widget.style[config.position.split('-')[0]] = '20px';
                    widget.style[config.position.split('-')[1]] = '20px';
                    widget.style.width = config.width + 'px';
                    widget.style.height = config.height + 'px';
                    widget.style.backgroundColor = config.backgroundColor;
                    widget.style.borderRadius = config.borderRadius + 'px';
                    widget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                    widget.style.zIndex = '9999';
                    
                    // 3. Add widget title
                    const header = document.createElement('div');
                    header.style.backgroundColor = config.primaryColor;
                    header.style.color = config.textColor;
                    header.style.padding = '15px';
                    header.style.fontWeight = 'bold';
                    header.innerHTML = `
                        <div>${config.title}</div>
                        <div style="font-size: 12px; font-weight: normal;">${config.subtitle}</div>
                    `;
                    
                    widget.appendChild(header);
                    document.body.appendChild(widget);
                    
                    // 4. Initialize widget functionality
                    console.log('Widget loaded:', config.name);
                }
            })
            .catch(err => console.error('Error loading widget:', err));
    </script>
</body>
</html>
```

### Example: Vanilla JavaScript Widget

```javascript
// widget.js - Customer's website
class SupportWidget {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.config = null;
    }

    async init() {
        try {
            const response = await fetch(`/api/public/widget/${this.apiKey}/config`);
            const result = await response.json();
            
            if (result.success) {
                this.config = result.data;
                this.render();
            } else {
                console.error('Widget config error:', result.message);
            }
        } catch (error) {
            console.error('Failed to load widget:', error);
        }
    }

    render() {
        const widget = document.createElement('div');
        widget.id = 'support-chat-widget';
        widget.style.cssText = `
            position: fixed;
            ${this.config.position}: 20px;
            width: ${this.config.width}px;
            height: ${this.config.height}px;
            background: ${this.config.backgroundColor};
            border-radius: ${this.config.borderRadius}px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 9999;
            font-family: Arial, sans-serif;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: ${this.config.primaryColor};
            color: ${this.config.textColor};
            padding: 15px;
            border-radius: ${this.config.borderRadius}px ${this.config.borderRadius}px 0 0;
        `;
        header.innerHTML = `
            <h3 style="margin: 0; margin-bottom: 5px;">${this.config.title}</h3>
            <p style="margin: 0; font-size: 12px;">${this.config.subtitle}</p>
        `;

        // Messages area
        const messages = document.createElement('div');
        messages.style.cssText = `
            height: ${this.config.height - 100}px;
            overflow-y: auto;
            padding: 10px;
            background: ${this.config.backgroundColor};
        `;

        // Welcome message
        const welcome = document.createElement('div');
        welcome.style.cssText = `
            padding: 10px;
            background: ${this.config.primaryColor}20;
            border-radius: 5px;
            margin: 10px;
            color: ${this.config.textColor};
        `;
        welcome.textContent = this.config.welcomeMessage;

        messages.appendChild(welcome);

        // Input area
        const input = document.createElement('div');
        input.style.cssText = `
            display: flex;
            padding: 10px;
            border-top: 1px solid #ddd;
            gap: 5px;
        `;
        input.innerHTML = `
            <input type="text" placeholder="Your message..." 
                style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            <button style="padding: 8px 15px; background: ${this.config.primaryColor}; 
                color: white; border: none; border-radius: 4px; cursor: pointer;">
                Send
            </button>
        `;

        widget.appendChild(header);
        widget.appendChild(messages);
        widget.appendChild(input);

        document.body.appendChild(widget);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const widget = new SupportWidget('sk_test_507f1f77bcf86cd799439011_abc123xyz');
    widget.init();
});
```

---

## 🔒 Security Considerations

1. **Public Visibility** - Widget config is intentionally public; don't store secrets there
2. **API Key Scope** - API keys for public endpoints don't grant admin access
3. **Rate Limiting** - Rate limits apply to prevent abuse
4. **CORS** - Only whitelisted domains can load widget
5. **Caching** - Responses are cached (CDN-friendly) since config rarely changes

---

## 🚀 Performance Optimization

1. **HTTP Caching**
   ```
   Cache-Control: public, max-age=3600
   ```
   Client browsers cache widget config for 1 hour

2. **CDN-Friendly**
   - No authentication headers required
   - Idempotent GET requests
   - Cacheable responses

3. **Request Optimization**
   - Use query parameter endpoint for consistency with API keys
   - Use path parameter endpoint for cleaner URLs

---

## 📊 Common Use Cases

### 1. E-commerce Website

```javascript
// On product page
const widgetLoader = async () => {
    const config = await fetch('/api/public/widget-config?apiKey=store_key_123')
        .then(r => r.json());
    
    if (config.success) {
        showWidget(config.data);
    }
};
```

### 2. Help Center Integration

```html
<!-- Add chat to every help page -->
<script>
    fetch('/api/public/widget/help_center_key_456/config')
        .then(r => r.json())
        .then(d => d.success && initWidget(d.data));
</script>
```

### 3. Multi-Region Support

```javascript
// Different widget for each region
const regionKey = {
    'US': 'sk_us_region_key',
    'EU': 'sk_eu_region_key',
    'APAC': 'sk_apac_region_key'
};

const config = await fetch(
    `/api/public/widget-config?apiKey=${regionKey[userRegion]}`
).then(r => r.json());
```

---

## 📋 API Response Caching

### Browser Caching

```
GET /api/public/widget-config?apiKey=xyz HTTP/1.1

HTTP/1.1 200 OK
Cache-Control: public, max-age=3600
ETag: "abc123xyz"
Content-Type: application/json

{ ... config data ... }
```

### Subsequent Request (Cached)

```
GET /api/public/widget-config?apiKey=xyz HTTP/1.1
If-None-Match: "abc123xyz"

HTTP/1.1 304 Not Modified
```

---

## ✅ Testing the Endpoints

### cURL Examples

```bash
# Query parameter endpoint
curl "http://localhost:3000/api/public/widget-config?apiKey=sk_test_123"

# Path parameter endpoint
curl "http://localhost:3000/api/public/widget/sk_test_123/config"

# With pretty-printing
curl "http://localhost:3000/api/public/widget-config?apiKey=sk_test_123" | jq
```

### Browser Console

```javascript
// Fetch widget config
fetch('/api/public/widget-config?apiKey=sk_test_123')
    .then(r => r.json())
    .then(d => console.log(d));
```

