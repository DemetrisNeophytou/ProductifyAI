# Video Builder Service

This service handles AI-powered video generation including promos, tutorials, explainers, and social media content.

## Features

- **Script-to-Video**: Convert text scripts into engaging video content
- **Multiple Styles**: Modern, energetic, professional, creative, and minimal styles
- **Scene Generation**: Automatic scene breakdown and visual prompt generation
- **Template System**: Pre-built video templates for different use cases
- **Rendering Pipeline**: Integration with video rendering engines
- **Branding Support**: Custom logos, colors, and fonts

## Architecture

```
video-builder/
├── README.md                 # This file
├── video-builder-service.ts  # Main service implementation
├── scene-generator.ts        # Scene generation logic
├── visual-prompts.ts         # Visual prompt generation
├── renderer.ts               # Video rendering interface
├── template-manager.ts       # Video template management
├── audio-processor.ts        # Audio and voice-over processing
├── templates/                # Video templates
│   ├── promo/
│   ├── tutorial/
│   ├── explainer/
│   ├── social/
│   └── presentation/
└── assets/                   # Shared video assets
    ├── music/
    ├── sound-effects/
    ├── fonts/
    └── graphics/
```

## Usage

```typescript
import { VideoBuilderService } from './video-builder-service';

const videoBuilder = new VideoBuilderService();

const request = {
  script: "Welcome to our productivity guide...",
  type: "tutorial",
  duration: 120,
  style: "modern",
  aspectRatio: "16:9",
  includeSubtitles: true,
  branding: {
    logoUrl: "https://example.com/logo.png",
    primaryColor: "#3B82F6",
    fontFamily: "Inter"
  }
};

const result = await videoBuilder.generateVideo(request);
```

## Configuration

Set the following environment variables:

```env
OPENAI_API_KEY=your_openai_api_key
DALL_E_API_KEY=your_dalle_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
VIDEO_RENDER_ENGINE=remotion
VIDEO_QUALITY=high
VIDEO_FORMAT=mp4
```

## API Endpoints

- `POST /api/video/generate` - Generate complete video
- `POST /api/video/scenes` - Generate video scenes from script
- `POST /api/video/render` - Render video from scenes
- `GET /api/video/status/:id` - Get video generation status
- `GET /api/video/templates` - Get available video templates
- `GET /api/video/config` - Get video builder configuration
- `GET /api/video/preview/:id` - Get video preview
