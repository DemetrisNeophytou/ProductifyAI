# Productify AI

## Overview
Productify AI is an AI-powered digital product creation platform designed to help users create, manage, and export various professional digital products such as eBooks, online courses, checklists, templates, and lead magnets. The platform aims to empower users with advanced AI capabilities for content generation, brand management, and efficient product delivery, supporting them in achieving high revenue goals in the digital product space.

## User Preferences
- Modern, clean UI design with purple primary color (#a855f7)
- Dark mode support throughout
- Responsive layout for all screen sizes
- Use shadcn components for consistency
- Minimal animations and smooth transitions
- Professional, productive interface for content creators

## System Architecture

### UI/UX Decisions
The platform features a modern, clean UI design utilizing a purple primary color (#a855f7) and supporting dark mode. It is built to be responsive across all screen sizes, employing shadcn components for consistency and incorporating minimal animations and smooth transitions to provide a professional and productive interface.

### Technical Implementations
Productify AI is a fullstack application built with React, Vite, TypeScript, Tailwind CSS, and shadcn/ui for the frontend, and Express.js with TypeScript for the backend. It uses PostgreSQL with Drizzle ORM for database management and Replit Auth for authentication. AI capabilities are powered by OpenAI GPT-5, featuring a specialized "Digital Product AI Coach" that provides ultra-fast, actionable guidance for creating and monetizing digital products. Key features include a rich text editor (TipTap), drag-and-drop functionality (@hello-pangea/dnd), and robust auto-save with optimistic caching. The system also supports multi-format exports (PDF, DOCX, HTML) and includes a comprehensive asset library system with Unsplash integration. A community platform for digital product creators is integrated with real-time interaction features.

### Feature Specifications
- **Digital Product Creation**: AI-powered generation and editing of eBooks, online courses, checklists, templates, and lead magnets.
- **Brand Identity Management**: Customizable brand kits including logos, colors, fonts, and tone of voice.
- **Content Editing**: Rich text editor for detailed content creation and modification.
- **Asset Management**: Upload, search, and delete assets, with Unsplash integration for images.
- **Version Control**: Snapshotting and restoration of project versions.
- **Export Functionality**: Export products in multiple formats (PDF, DOCX, HTML, with plans for MD and ZIP).
- **Community Platform**: Features for posts, comments, likes, and category-based filtering.
- **AI Coach**: Interactive chat with an AI strategist providing guidance on product development and monetization.
- **Auto-save System**: Ensures data persistence with debouncing, dirty flag tracking, and in-flight edit protection.

### System Design Choices
The project architecture emphasizes modularity with clear separation between client and server. The database schema is designed to support complex digital products, brand kits, projects, sections, assets, and versioning. Core tables include `users`, `brand_kits`, `projects`, `sections`, `assets`, `project_versions`, `community_posts`, `community_comments`, and `community_post_likes`. API routes are structured RESTfully, covering authentication, brand kits, projects, sections, assets, versions, and community interactions. Error handling is robust, providing user-friendly toast notifications for various issues.

## External Dependencies
- **AI**: OpenAI GPT-5 (requires OPENAI_API_KEY secret)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Rich Text Editor**: TipTap
- **Drag & Drop**: @hello-pangea/dnd
- **PDF Generation**: pdf-lib
- **DOCX Generation**: docx.js
- **Markdown Processing**: markdown-it
- **ZIP Archiving**: jszip
- **Image Assets**: Unsplash API

## Configuration Requirements

### OpenAI API Key Setup
The platform requires a valid OpenAI API key to enable AI features:

1. **Add API Key**: Configure `OPENAI_API_KEY` in Replit Secrets (Tools → Secrets)
2. **Get API Key**: Obtain from https://platform.openai.com/api-keys
3. **Required Access**: The key must have access to GPT-5 model for ultra-fast responses
4. **Billing**: Ensure OpenAI account has available credits

### Resilient Error Handling
The application is designed to be resilient:
- **Graceful Degradation**: App starts successfully even without API key configured
- **Clear Error Messages**: Users get helpful guidance when API key is missing/invalid
- **No Crashes**: Missing API key doesn't crash the server - shows friendly error instead
- **Easy Recovery**: Once API key is added to secrets, all AI features work immediately without code changes

### AI Features Requiring API Key
All features powered by GPT-5 for ultra-fast, specialized coaching:
- **AI Coach** - Streaming chat assistant with specialized digital product expertise (GPT-5 powered)
  - Interactive coaching for product creation, launch strategies, and monetization
  - Ready-made templates, frameworks, and exact copy on demand
  - Step-by-step guidance from idea to €100k+ revenue
- **Idea Finder** - 5 AI-generated profitable product ideas
- **Outline Builder** - Tier-based: Free=3-4 chapters, Plus=5-7, Pro=8-12+monetization
- **Content Writer** - Tier-based with multi-format support for Pro
- **Offer Builder** - Pricing strategy with bonuses/upsells
- **Funnel & Launch Planner** - Complete execution roadmap