# ProductifyAI API Documentation

## Overview

ProductifyAI is a comprehensive platform for creating and managing digital products. This API provides endpoints for product management, AI content generation, video creation, and more.

**Base URL:** `http://localhost:5050` (development)  
**API Version:** 1.0.0  
**Content-Type:** `application/json`

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "ok": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "ok": false,
  "error": "Error message"
}
```

## Authentication

Currently, the API does not require authentication for basic operations. Future versions will implement JWT-based authentication.

## Endpoints

### Health Check

#### GET /health/db
Check database connectivity and health status.

**Response:**
```json
{
  "status": "Connected",
  "timestamp": "2025-10-17T10:37:17.116287+00",
  "service": "ProductifyAI Database"
}
```

**Status Codes:**
- `200 OK` - Database is connected
- `500 Internal Server Error` - Database connection failed

---

### Products Management

#### GET /products
Retrieve all products.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 2,
      "ownerId": 1,
      "title": "The Complete Guide to Learn productivity techniques",
      "kind": "eBook",
      "price": "19.99",
      "published": false,
      "createdAt": "2025-10-14T23:13:07.192Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Products retrieved successfully
- `500 Internal Server Error` - Server error

#### GET /products/:id
Retrieve a specific product by ID.

**Parameters:**
- `id` (integer, required) - Product ID

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": 2,
    "ownerId": 1,
    "title": "The Complete Guide to Learn productivity techniques",
    "kind": "eBook",
    "price": "19.99",
    "published": false,
    "createdAt": "2025-10-14T23:13:07.192Z"
  }
}
```

**Status Codes:**
- `200 OK` - Product found
- `404 Not Found` - Product not found
- `500 Internal Server Error` - Server error

#### POST /products
Create a new product.

**Request Body:**
```json
{
  "ownerId": 1,
  "title": "Product Title",
  "kind": "eBook",
  "price": "29.99",
  "published": false
}
```

**Parameters:**
- `ownerId` (integer, required) - Owner user ID
- `title` (string, required) - Product title
- `kind` (string, required) - Product type (eBook, course, template, video-pack)
- `price` (string, optional) - Product price (default: "0")
- `published` (boolean, optional) - Publication status (default: false)

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": 3,
    "ownerId": 1,
    "title": "Product Title",
    "kind": "eBook",
    "price": "29.99",
    "published": false,
    "createdAt": "2025-10-17T10:35:34.810Z"
  }
}
```

**Status Codes:**
- `201 Created` - Product created successfully
- `500 Internal Server Error` - Server error

#### PUT /products/:id
Update an existing product.

**Parameters:**
- `id` (integer, required) - Product ID

**Request Body:**
```json
{
  "title": "Updated Product Title",
  "kind": "course",
  "price": "39.99",
  "published": true
}
```

**Parameters:**
- `title` (string, optional) - Product title
- `kind` (string, optional) - Product type
- `price` (string, optional) - Product price
- `published` (boolean, optional) - Publication status

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": 3,
    "ownerId": 1,
    "title": "Updated Product Title",
    "kind": "course",
    "price": "39.99",
    "published": true,
    "createdAt": "2025-10-17T10:35:34.810Z"
  }
}
```

**Status Codes:**
- `200 OK` - Product updated successfully
- `404 Not Found` - Product not found
- `500 Internal Server Error` - Server error

#### DELETE /products/:id
Delete a product.

**Parameters:**
- `id` (integer, required) - Product ID

**Response:**
```json
{
  "ok": true,
  "data": {
    "message": "Product deleted"
  }
}
```

**Status Codes:**
- `200 OK` - Product deleted successfully
- `404 Not Found` - Product not found
- `500 Internal Server Error` - Server error

---

### AI Product Builder

#### POST /api/ai/generate
Generate complete AI products with layout, pricing, and marketing funnel.

**Request Body:**
```json
{
  "topic": "Productivity Techniques",
  "type": "ebook",
  "audience": "Small business owners",
  "tone": "professional",
  "goal": "Increase team efficiency by 50%"
}
```

**Parameters:**
- `topic` (string, required) - Main topic for the product
- `type` (string, optional) - Product type: "ebook", "template", "course" (default: "ebook")
- `audience` (string, optional) - Target audience
- `tone` (string, optional) - Writing tone: "professional", "casual", "friendly", "authoritative"
- `goal` (string, optional) - Desired outcome/goal

**Response:**
```json
{
  "ok": true,
  "data": {
    "projectId": "proj_1234567890_abc123",
    "title": "The Complete Guide to Productivity Techniques",
    "layout": {
      "cover": {
        "title": "The Complete Guide to Productivity Techniques",
        "subtitle": "A comprehensive ebook for Small business owners",
        "imageUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600",
        "backgroundColor": "#3B82F6"
      },
      "sections": [
        {
          "id": "intro",
          "title": "Introduction",
          "content": "Welcome to this comprehensive guide...",
          "order": 1,
          "type": "heading"
        }
      ]
    },
    "sell": {
      "price": 29.99,
      "currency": "EUR",
      "cta": "Get Instant Access",
      "salesBlurb": "Transform your productivity skills with this comprehensive ebook..."
    },
    "funnel": {
      "playbook": "A step-by-step playbook to master productivity in 30 days",
      "emails": [
        {
          "subject": "Welcome to your productivity journey!",
          "content": "Thank you for purchasing our ebook...",
          "sendAfter": 0
        }
      ]
    }
  }
}
```

**Status Codes:**
- `201 Created` - Product generated successfully
- `400 Bad Request` - Invalid request parameters
- `500 Internal Server Error` - Generation failed

---

### Video Builder

#### POST /api/video/generate
Generate video scenes from a script.

**Request Body:**
```json
{
  "script": "Welcome to our productivity guide. Today we'll cover the top 5 techniques that successful entrepreneurs use to stay organized and efficient. First, let's talk about time blocking..."
}
```

**Parameters:**
- `script` (string, required) - Video script text (max 10,000 characters)

**Response:**
```json
{
  "ok": true,
  "data": {
    "videoId": "vid_1234567890_abc123",
    "scenes": [
      {
        "id": "scene_intro",
        "caption": "Welcome to our presentation",
        "duration": 3,
        "order": 1
      },
      {
        "id": "scene_1",
        "caption": "Welcome to our productivity guide.",
        "duration": 4,
        "order": 2
      },
      {
        "id": "scene_2",
        "caption": "Today we'll cover the top 5 techniques that successful entrepreneurs use to stay organized and efficient.",
        "duration": 8,
        "order": 3
      },
      {
        "id": "scene_outro",
        "caption": "Thank you for watching!",
        "duration": 3,
        "order": 4
      }
    ],
    "totalDuration": 18
  }
}
```

**Status Codes:**
- `201 Created` - Video scenes generated successfully
- `400 Bad Request` - Invalid script or validation failed
- `500 Internal Server Error` - Generation failed

---

### Projects Management

#### GET /api/projects/:id
Get a specific project by ID.

**Parameters:**
- `id` (string, required) - Project ID

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "proj_1234567890_abc123",
    "userId": null,
    "type": "ebook",
    "title": "The Complete Guide to Productivity Techniques",
    "status": "draft",
    "layout": {
      "cover": {
        "title": "The Complete Guide to Productivity Techniques",
        "subtitle": "A comprehensive ebook for Small business owners"
      },
      "sections": [...]
    },
    "metadata": {
      "niche": "productivity",
      "goal": "Increase team efficiency by 50%",
      "audience": "Small business owners",
      "tone": "professional"
    },
    "createdAt": "2025-10-17T10:30:00Z",
    "updatedAt": "2025-10-17T10:30:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - Project found
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Server error

#### PUT /api/projects/:id
Update a project (save layout/canvas JSON).

**Parameters:**
- `id` (string, required) - Project ID

**Request Body:**
```json
{
  "title": "Updated Product Title",
  "layout": {
    "cover": {
      "title": "New Title",
      "subtitle": "New Subtitle"
    },
    "sections": [...]
  },
  "status": "final",
  "metadata": {
    "customField": "value"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "proj_1234567890_abc123",
    "userId": null,
    "type": "ebook",
    "title": "Updated Product Title",
    "status": "final",
    "layout": {...},
    "metadata": {...},
    "createdAt": "2025-10-17T10:30:00Z",
    "updatedAt": "2025-10-17T10:35:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - Project updated successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Update failed

---

### File Management

#### POST /api/files/upload
Upload files (images, documents, etc.).

**Request:** Multipart form data

**Response:**
```json
{
  "ok": true,
  "data": {
    "fileId": "file_123",
    "url": "https://storage.example.com/files/file_123.jpg",
    "size": 1024000,
    "type": "image/jpeg"
  }
}
```

---

### Payment Processing

#### POST /api/payments/create-intent
Create payment intent for product purchase.

**Request Body:**
```json
{
  "productId": 1,
  "amount": 2999,
  "currency": "usd"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "clientSecret": "pi_123_secret_456",
    "amount": 2999,
    "currency": "usd"
  }
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "ok": false,
  "error": "Invalid request parameters"
}
```

#### 404 Not Found
```json
{
  "ok": false,
  "error": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "ok": false,
  "error": "Internal server error"
}
```

## Rate Limiting

- **General API:** 100 requests per minute per IP
- **AI Generation:** 10 requests per minute per IP
- **File Upload:** 5 requests per minute per IP

## CORS

The API supports CORS for the following origins:
- `http://localhost:3000` (development)
- `https://yourdomain.com` (production)

## Examples

### Creating a Product
```bash
curl -X POST http://localhost:5050/products \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": 1,
    "title": "My Awesome eBook",
    "kind": "eBook",
    "price": "19.99",
    "published": false
  }'
```

### Updating a Product
```bash
curl -X PUT http://localhost:5050/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "published": true
  }'
```

### Deleting a Product
```bash
curl -X DELETE http://localhost:5050/products/1
```

### Generating AI Product
```bash
curl -X POST http://localhost:5050/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Productivity Techniques",
    "type": "ebook",
    "audience": "Small business owners",
    "tone": "professional",
    "goal": "Increase team efficiency by 50%"
  }'
```

### Generating Video Scenes
```bash
curl -X POST http://localhost:5050/api/video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "script": "Welcome to our productivity guide. Today we will cover the top 5 techniques that successful entrepreneurs use to stay organized and efficient."
  }'
```

### Getting a Project
```bash
curl http://localhost:5050/api/projects/proj_1234567890_abc123
```

### Updating a Project
```bash
curl -X PUT http://localhost:5050/api/projects/proj_1234567890_abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Product Title",
    "status": "final",
    "layout": {
      "cover": {
        "title": "New Title",
        "subtitle": "New Subtitle"
      }
    }
  }'
```

## Support

For API support and questions:
- **Documentation:** This file
- **Issues:** GitHub Issues
- **Email:** support@productifyai.com

---

*Last updated: October 17, 2025*