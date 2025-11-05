# Media Generation System

This document describes the AI-powered media generation system for ProductifyAI.

## Overview

The media generation system allows you to:
- Generate AI images using text prompts
- Create media assets for projects
- Manage and organize generated media
- Insert media into project content

## API Endpoints

### POST /api/media/generate

Generate a new media asset using AI.

**Request Body:**
```json
{
  "prompt": "Professional business meeting, modern office setting",
  "projectId": "proj_1234567890_abc123",
  "type": "image",
  "style": "realistic",
  "size": "square"
}
```

**Parameters:**
- `prompt` (string, required) - Text description for media generation (max 1000 chars)
- `projectId` (string, optional) - Associate with a specific project
- `type` (string, optional) - Media type: "image", "video", "audio" (default: "image")
- `style` (string, optional) - Visual style: "realistic", "illustration", "abstract", "minimal"
- `size` (string, optional) - Image dimensions: "square", "landscape", "portrait"

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "media_1234567890_abc123",
    "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1024&h=1024",
    "type": "image",
    "prompt": "Professional business meeting, modern office setting",
    "metadata": {
      "width": 1024,
      "height": 1024,
      "format": "jpeg",
      "size": 750000
    }
  }
}
```

**Status Codes:**
- `201 Created` - Media generated successfully
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Project not found (if projectId provided)
- `500 Internal Server Error` - Generation failed

### GET /api/media

List media assets with optional filtering.

**Query Parameters:**
- `projectId` (string, optional) - Filter by project
- `userId` (string, optional) - Filter by user
- `type` (string, optional) - Filter by media type

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "media_1234567890_abc123",
      "projectId": "proj_1234567890_abc123",
      "userId": "user_123",
      "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1024&h=1024",
      "type": "image",
      "prompt": "Professional business meeting",
      "license": "generated",
      "attribution": null,
      "metadata": {
        "width": 1024,
        "height": 1024,
        "format": "jpeg",
        "size": 750000
      },
      "createdAt": "2025-10-17T10:30:00Z"
    }
  ]
}
```

### GET /api/media/:id

Get a specific media asset by ID.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "media_1234567890_abc123",
    "projectId": "proj_1234567890_abc123",
    "userId": "user_123",
    "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1024&h=1024",
    "type": "image",
    "prompt": "Professional business meeting, modern office setting",
    "license": "generated",
    "attribution": null,
    "metadata": {
      "width": 1024,
      "height": 1024,
      "format": "jpeg",
      "size": 750000
    },
    "createdAt": "2025-10-17T10:30:00Z"
  }
}
```

## Database Schema

### media Table
```sql
CREATE TABLE media (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR REFERENCES projects(id) ON DELETE CASCADE,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  prompt TEXT NOT NULL,
  license VARCHAR(40) DEFAULT 'generated' NOT NULL,
  attribution TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id` - Unique identifier
- `project_id` - Associated project (optional)
- `user_id` - Owner user (optional until auth implemented)
- `url` - Media file URL
- `type` - Media type (image, video, audio)
- `prompt` - Original generation prompt
- `license` - Usage license (default: "generated")
- `attribution` - Attribution text (if required)
- `metadata` - Technical metadata (dimensions, format, size)
- `created_at` - Creation timestamp

## Usage Examples

### 1. Generate an Image
```bash
curl -X POST "http://localhost:5050/api/media/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional business meeting, modern office setting",
    "type": "image",
    "style": "realistic",
    "size": "square"
  }'
```

### 2. Generate Media for a Project
```bash
curl -X POST "http://localhost:5050/api/media/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Productivity workspace with laptop and coffee",
    "projectId": "proj_1234567890_abc123",
    "type": "image",
    "style": "minimal",
    "size": "landscape"
  }'
```

### 3. List All Media
```bash
curl "http://localhost:5050/api/media"
```

### 4. Filter by Project
```bash
curl "http://localhost:5050/api/media?projectId=proj_1234567890_abc123"
```

### 5. Filter by Type
```bash
curl "http://localhost:5050/api/media?type=image"
```

## Frontend Integration

### Media Generation Component
```tsx
const generateMedia = async (prompt: string, projectId?: string) => {
  const response = await fetch('/api/media/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      projectId,
      type: 'image',
      style: 'realistic',
      size: 'square'
    })
  });
  const data = await response.json();
  return data;
};
```

### Media Gallery Component
```tsx
const MediaGallery = ({ projectId }: { projectId?: string }) => {
  const [media, setMedia] = useState([]);
  
  useEffect(() => {
    const fetchMedia = async () => {
      const url = projectId 
        ? `/api/media?projectId=${projectId}`
        : '/api/media';
      const response = await fetch(url);
      const data = await response.json();
      setMedia(data.data);
    };
    fetchMedia();
  }, [projectId]);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {media.map(item => (
        <div key={item.id} className="border rounded p-2">
          <img src={item.url} alt={item.prompt} className="w-full h-32 object-cover" />
          <p className="text-sm mt-2">{item.prompt}</p>
        </div>
      ))}
    </div>
  );
};
```

### Insert into Project
```tsx
const insertMediaIntoProject = async (mediaId: string, projectId: string, position: number) => {
  // This would integrate with the project editor
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      layout: {
        // Add media block at specified position
        sections: [
          // ... existing sections
          {
            id: `media_${mediaId}`,
            type: 'image',
            content: { url: mediaId },
            order: position
          }
        ]
      }
    })
  });
  return response.json();
};
```

## Supported Media Types

### Images
- **Formats**: JPEG, PNG, WebP
- **Sizes**: 
  - Square: 1024x1024
  - Landscape: 1920x1080
  - Portrait: 1080x1920
- **Styles**: Realistic, Illustration, Abstract, Minimal

### Videos (Future)
- **Formats**: MP4, WebM
- **Durations**: 15s, 30s, 60s
- **Aspect Ratios**: 16:9, 9:16, 1:1

### Audio (Future)
- **Formats**: MP3, WAV
- **Durations**: 30s, 60s, 120s
- **Quality**: 128kbps, 256kbps, 320kbps

## Rate Limiting

- **Media Generation**: 5 requests per minute per IP
- **Media Listing**: 100 requests per minute per IP

## Storage

Media files are stored in:
- **Development**: Mock URLs (Unsplash)
- **Production**: Supabase Storage or AWS S3

## Integration with AI Services

### Current Implementation
- Mock image generation using Unsplash API
- Placeholder URLs for development

### Production Integration
```typescript
// OpenAI DALL-E Integration
const generateWithDALLE = async (prompt: string) => {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard"
  });
  return response.data[0].url;
};

// Midjourney Integration (via API)
const generateWithMidjourney = async (prompt: string) => {
  const response = await fetch('https://api.midjourney.com/v1/imagine', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MIDJOURNEY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });
  return response.json();
};
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "ok": false,
  "error": "Error message describing what went wrong"
}
```

Common error codes:
- `400` - Bad Request (invalid prompt, unsupported type)
- `404` - Not Found (media asset not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error (generation failed)

## Future Enhancements

1. **Advanced AI Integration**
   - OpenAI DALL-E 3
   - Midjourney API
   - Stable Diffusion
   - Runway ML

2. **Video Generation**
   - Text-to-video AI
   - Template-based video creation
   - Automated editing

3. **Audio Generation**
   - Text-to-speech
   - Background music generation
   - Sound effects

4. **Media Management**
   - Bulk operations
   - Collections and tags
   - Version control
   - Usage analytics

---

*Last updated: October 17, 2025*