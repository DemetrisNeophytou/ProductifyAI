# Multilingual & Social Export API

This document describes the multilingual translation and social media export features of ProductifyAI.

## Overview

The multilingual system allows you to:
- Translate projects to different locales
- Generate social media content packs for various platforms
- Maintain original content while creating localized versions

## Translation API

### POST /api/projects/:id/translate

Translate a project to a target locale.

**Query Parameters:**
- `to` (string, required) - Target language code (ISO 2-letter format)
- `force` (boolean, optional) - Force overwrite existing translation (default: false)

**Supported Locales:**
- `en` - English (default)
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- `ar` - Arabic
- `hi` - Hindi

**Response:**
```json
{
  "ok": true,
  "data": {
    "projectId": "proj_1234567890_abc123",
    "from": "en",
    "to": "es",
    "blocks": [
      {
        "id": "translated_block_1_es",
        "content": {
          "text": "Introducción a las técnicas de productividad"
        },
        "locale": "es",
        "originalId": "block_1"
      }
    ]
  }
}
```

**Status Codes:**
- `201 Created` - Translation created successfully
- `400 Bad Request` - Invalid language code
- `404 Not Found` - Project not found
- `409 Conflict` - Translation already exists (use ?force=true)

**Example:**
```bash
curl -X POST "http://localhost:5050/api/projects/proj_123/translate?to=es&force=true"
```

## Social Pack API

### POST /api/social/pack

Generate social media content for multiple platforms.

**Request Body:**
```json
{
  "projectId": "proj_1234567890_abc123",
  "platforms": ["reels", "tiktok", "shorts"],
  "tone": "professional",
  "length": "short",
  "locale": "en"
}
```

**Parameters:**
- `projectId` (string, required) - Project ID to generate content from
- `platforms` (array, required) - Target platforms: "reels", "tiktok", "shorts"
- `tone` (string, optional) - Content tone: "professional", "casual", "energetic", "friendly"
- `length` (string, optional) - Content length: "short", "medium", "long"
- `locale` (string, optional) - Source locale (default: "en")

**Response:**
```json
{
  "ok": true,
  "data": {
    "packId": "pack_1234567890_xyz789",
    "projectId": "proj_1234567890_abc123",
    "platforms": ["reels", "tiktok", "shorts"],
    "payload": {
      "reels": {
        "caption": "🎯 The Complete Guide to Productivity\n\nWant to master this skill?\n\nSwipe up for the full guide!",
        "hashtags": ["#productivity", "#tips", "#guide", "#learn", "#success"],
        "shortScript": "Welcome to our productivity guide. Let's cover the top techniques...",
        "hooks": ["Want to master this skill?", "This changed everything for me"],
        "cta": "Swipe up for the full guide!"
      },
      "tiktok": {
        "caption": "🔥 The Complete Guide to Productivity\n\nPOV: You're about to learn something amazing\n\nFollow for more!",
        "hashtags": ["#fyp", "#viral", "#learn", "#tips", "#hack", "#lifehack"],
        "shortScript": "Welcome to our productivity guide. Today we'll cover...",
        "hooks": ["POV: You're about to learn something amazing", "This is why everyone's talking about it"],
        "cta": "Follow for more!"
      }
    }
  }
}
```

### GET /api/social/pack/:projectId

Get social packs for a project.

**Query Parameters:**
- `locale` (string, optional) - Filter by locale

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "pack_1234567890_xyz789",
      "projectId": "proj_1234567890_abc123",
      "locale": "en",
      "platforms": ["reels", "tiktok"],
      "payload": { ... },
      "createdAt": "2025-10-17T10:30:00Z"
    }
  ]
}
```

## Database Schema

### project_blocks Table
```sql
CREATE TABLE project_blocks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  section VARCHAR(50),
  locale VARCHAR(5) DEFAULT 'en',
  original_id VARCHAR,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### social_packs Table
```sql
CREATE TABLE social_packs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL DEFAULT 'en',
  platforms JSONB NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Usage Examples

### 1. Translate a Project
```bash
# Translate to Spanish
curl -X POST "http://localhost:5050/api/projects/proj_123/translate?to=es"

# Force overwrite existing translation
curl -X POST "http://localhost:5050/api/projects/proj_123/translate?to=es&force=true"
```

### 2. Generate Social Pack
```bash
curl -X POST "http://localhost:5050/api/social/pack" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_1234567890_abc123",
    "platforms": ["reels", "tiktok", "shorts"],
    "tone": "professional",
    "length": "short"
  }'
```

### 3. Get Social Packs
```bash
# Get all packs for a project
curl "http://localhost:5050/api/social/pack/proj_1234567890_abc123"

# Get packs for specific locale
curl "http://localhost:5050/api/social/pack/proj_1234567890_abc123?locale=es"
```

## Frontend Integration

### Translation Component
```tsx
const translateProject = async (projectId: string, locale: string) => {
  const response = await fetch(`/api/projects/${projectId}/translate?to=${locale}`, {
    method: 'POST'
  });
  const data = await response.json();
  return data;
};
```

### Social Pack Component
```tsx
const generateSocialPack = async (projectId: string, platforms: string[]) => {
  const response = await fetch('/api/social/pack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      platforms,
      tone: 'professional',
      length: 'short'
    })
  });
  const data = await response.json();
  return data;
};
```

## Rate Limiting

- **Translation**: 10 requests per minute per IP
- **Social Pack**: 5 requests per minute per IP

## Error Handling

All endpoints return consistent error responses:

```json
{
  "ok": false,
  "error": "Error message describing what went wrong"
}
```

Common error codes:
- `400` - Bad Request (validation failed)
- `404` - Not Found (project doesn't exist)
- `409` - Conflict (translation already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Future Enhancements

1. **Real Translation Service Integration**
   - Google Translate API
   - DeepL API
   - Azure Translator

2. **Advanced Social Features**
   - Platform-specific optimization
   - A/B testing for content
   - Scheduling integration

3. **Content Localization**
   - Cultural adaptation
   - Regional preferences
   - Currency and date formatting

---

*Last updated: October 17, 2025*
