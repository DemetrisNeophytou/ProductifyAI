# AI Product Builder Service

This service handles AI-powered product generation including eBooks, courses, templates, and video packs.

## Features

- **Smart Content Generation**: Uses AI to create structured, engaging content
- **Multiple Product Types**: Support for eBooks, courses, templates, and video packs
- **Template System**: Pre-built templates for different niches and styles
- **Content Validation**: Ensures quality and consistency
- **Metadata Generation**: Automatic tagging, categorization, and SEO optimization

## Architecture

```
ai-builder/
├── README.md                 # This file
├── ai-builder-service.ts     # Main service implementation
├── content-generator.ts      # AI content generation logic
├── template-manager.ts       # Template management
├── validation-service.ts     # Content validation
├── prompts/                  # AI prompt templates
│   ├── ebook-prompts.ts
│   ├── course-prompts.ts
│   ├── template-prompts.ts
│   └── video-pack-prompts.ts
└── templates/                # Product templates
    ├── productivity/
    ├── business/
    ├── health/
    └── education/
```

## Usage

```typescript
import { AIBuilderService } from './ai-builder-service';

const aiBuilder = new AIBuilderService();

const request = {
  idea: "Learn productivity techniques",
  userId: "user123",
  productType: "eBook",
  niche: "productivity",
  targetAudience: "professionals",
  tone: "professional",
  length: "medium"
};

const result = await aiBuilder.generateProduct(request);
```

## Configuration

Set the following environment variables:

```env
OPENAI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4000
```

## API Endpoints

- `POST /api/ai/generate` - Generate complete product
- `POST /api/ai/outline` - Generate product outline
- `POST /api/ai/content` - Generate content for specific chapter
- `GET /api/ai/templates` - Get available templates
- `GET /api/ai/config` - Get AI builder configuration
