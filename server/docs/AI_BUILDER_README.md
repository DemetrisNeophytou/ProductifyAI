# AI Product Builder Documentation

## Overview
The AI Product Builder is a core feature of ProductifyAI that automatically generates complete, sellable digital products (eBooks, courses, templates) from simple topic prompts. The system creates structured content, pricing suggestions, and mini-funnel details.

## Features

### 🎯 **AI Product Generation**
- **Input**: Simple topic prompt + product type
- **Output**: Complete digital product with content, layout, pricing, and sales funnel
- **Types**: eBook, Course, Template
- **Content**: Structured sections with blocks, cover design, and branding

### 📊 **Generated Product Structure**
```json
{
  "title": "The Power of Focus",
  "type": "ebook",
  "layout": {
    "cover": "Professional ebook cover featuring focus with modern design",
    "sections": [
      {
        "id": "intro",
        "title": "Introduction to Focus",
        "content": "This section covers introduction to focus...",
        "blocks": [
          {
            "type": "heading",
            "content": { "text": "Introduction to Focus", "level": 1 },
            "order": 0
          },
          {
            "type": "paragraph",
            "content": { "text": "This section covers introduction to focus..." },
            "order": 1
          }
        ]
      }
    ]
  },
  "sell": {
    "price": 19.99,
    "currency": "EUR",
    "cta": "Get Instant Access",
    "sales_blurb": "Discover how to master focus with this comprehensive ebook..."
  },
  "funnel": {
    "playbook": "lead-magnet-mini-course-offer",
    "emails": [
      "Welcome to The Power of Focus! Here's what you'll learn...",
      "Day 2: The first key insight about focus",
      "Day 3: Common mistakes to avoid with focus",
      "Day 4: Advanced strategies for focus",
      "Day 5: Your next steps to master focus"
    ]
  }
}
```

## API Endpoints

### POST /api/ai/generate
Generate a complete AI product from a topic prompt.

**Request Body:**
```json
{
  "topic": "productivity techniques",
  "type": "ebook",
  "audience": "remote workers",
  "tone": "professional",
  "goal": "educate and inform"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI product generated successfully",
  "data": {
    "title": "The Complete Guide to Productivity Techniques",
    "type": "ebook",
    "layout": { /* layout structure */ },
    "sell": { /* pricing and sales info */ },
    "funnel": { /* email sequence and playbook */ },
    "project": {
      "id": "proj_123",
      "status": "draft",
      "createdAt": "2025-10-15T10:00:00Z"
    }
  }
}
```

### GET /api/ai/projects/:id
Get a specific project with all its content.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "proj_123",
    "userId": "user_456",
    "type": "ebook",
    "title": "The Complete Guide to Productivity Techniques",
    "status": "draft",
    "metadata": { /* project metadata */ },
    "outline": [ /* content outline */ ],
    "brand": { /* brand colors and fonts */ },
    "pages": [
      {
        "id": "page_789",
        "title": "Main Content",
        "order": 0,
        "blocks": [ /* content blocks */ ]
      }
    ]
  }
}
```

### PUT /api/ai/projects/:id
Update a project.

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "final",
  "metadata": { /* updated metadata */ }
}
```

### GET /api/ai/projects?userId=user_123
Get all projects for a user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "proj_123",
      "title": "The Complete Guide to Productivity Techniques",
      "type": "ebook",
      "status": "draft",
      "createdAt": "2025-10-15T10:00:00Z"
    }
  ]
}
```

## Database Schema

### Projects Table
```sql
CREATE TABLE projects (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- ebook, course, template
  title TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, final
  metadata JSONB, -- niche, goal, audience, tone, wordCount, etc.
  brand JSONB, -- primary, secondary, font, logoUrl
  outline JSONB, -- content outline structure
  cover_image_url TEXT,
  background_color TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Pages Table
```sql
CREATE TABLE pages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order INTEGER NOT NULL DEFAULT 0,
  settings JSONB, -- backgroundColor, layout, padding
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Blocks Table
```sql
CREATE TABLE blocks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id VARCHAR NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- heading, paragraph, image, cta, list, quote, table
  content JSONB NOT NULL, -- block content structure
  order INTEGER NOT NULL DEFAULT 0,
  settings JSONB, -- alignment, fontSize, color, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Services

### AIService
Handles AI content generation:
- `generateProductContent()` - Creates complete product content
- `generateFunnelContent()` - Creates sales funnel and email sequences
- Content generation for different product types
- Pricing calculation based on content length
- Brand generation with colors and fonts

### ProjectService
Handles database operations:
- `createProject()` - Creates new project
- `getProject()` - Gets project by ID
- `getProjectWithContent()` - Gets project with pages and blocks
- `updateProject()` - Updates project data
- `getUserProjects()` - Gets all user projects
- `createProductPages()` - Creates pages and blocks from AI content
- `deleteProject()` - Deletes project and all related data

## Content Generation

### Product Types

#### eBook
- **Structure**: Introduction, Fundamentals, Implementation, Advanced, Solutions, Conclusion
- **Price**: €19.99 + €2.50 per section
- **CTA**: "Get Instant Access"
- **Brand**: Blue theme with Inter font

#### Course
- **Structure**: Introduction, Fundamentals, Course Modules, Implementation, Advanced, Solutions, Conclusion
- **Price**: €49.99 + €2.50 per section
- **CTA**: "Start Learning Today"
- **Brand**: Red theme with Poppins font

#### Template
- **Structure**: Introduction, Fundamentals, Implementation, Advanced, Solutions, Conclusion
- **Price**: €29.99 + €2.50 per section
- **CTA**: "Download Now"
- **Brand**: Green theme with Roboto font

### Content Blocks
- **Heading**: H1-H6 headings with level specification
- **Paragraph**: Text content with formatting
- **Image**: Cover images and illustrations
- **CTA**: Call-to-action buttons
- **List**: Bulleted and numbered lists
- **Quote**: Highlighted quotes and testimonials
- **Table**: Data tables and comparisons

## Funnel Generation

### Email Sequences
- **Welcome Email**: Introduction and overview
- **Day 2-5**: Progressive content delivery
- **Value-driven**: Each email provides actionable insights
- **Topic-specific**: Content tailored to the product topic

### Playbooks
- **Default**: "lead-magnet-mini-course-offer"
- **Customizable**: Can be extended for different funnel types
- **Conversion-focused**: Designed to drive sales

## Usage Examples

### Generate an eBook
```bash
curl -X POST http://localhost:5050/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "time management",
    "type": "ebook",
    "audience": "busy professionals",
    "tone": "motivational",
    "goal": "help people manage their time better"
  }'
```

### Get Project Details
```bash
curl http://localhost:5050/api/ai/projects/proj_123
```

### Update Project Status
```bash
curl -X PUT http://localhost:5050/api/ai/projects/proj_123 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "final",
    "title": "The Ultimate Guide to Time Management"
  }'
```

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Future Enhancements

### OpenAI Integration
- Replace mock content generation with real AI
- More sophisticated content creation
- Better topic analysis and content structuring
- Dynamic pricing based on content quality

### Advanced Features
- Multi-language support
- Custom brand kit integration
- A/B testing for CTAs and pricing
- Analytics and conversion tracking
- Template marketplace integration

### Performance
- Caching for frequently generated content
- Background processing for large products
- CDN integration for assets
- Database optimization for large projects

## Development

### Adding New Product Types
1. Update the `generateTitle()` method in AIService
2. Add new type to validation schemas
3. Update pricing logic in `calculatePrice()`
4. Add brand colors in `generateBrand()`
5. Update CTA text in `generateCTA()`

### Adding New Block Types
1. Update the BlockType union in schema
2. Add generation logic in `generateSectionBlocks()`
3. Update content structure interfaces
4. Add rendering logic in frontend

### Testing
```bash
# Test AI generation
npm run test:ai

# Test project operations
npm run test:projects

# Test full integration
npm run test:integration
```

## Support

For issues or questions about the AI Product Builder:
- Check the logs for detailed error messages
- Verify database connectivity
- Ensure all required environment variables are set
- Review the API documentation for proper request formats


