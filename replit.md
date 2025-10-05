# Productify AI

## Overview
Productify AI is an AI-powered digital product creation platform designed to help users create, manage, and export various professional digital products such as eBooks, online courses, checklists, templates, and lead magnets. The platform has undergone a major transformation to become the most user-friendly and advanced digital product platform, featuring simplified navigation, AI command interface, redesigned dashboard, floating AI coach, and a unified product creation wizard.

## Recent Changes (October 2025)

### Phase 3 Features - Backend Complete (October 5, 2025)
Implemented comprehensive backend infrastructure for Phase 3 advanced features:

**AI Re-Styling System**
- POST /api/ai/restyle - AI-powered theme generation from mood presets (Minimal, Bold, Elegant, Playful, Editorial)
- Generates cohesive themes with fonts, colors (4-color palette), spacing scale, and image style hints
- Plan gating: Plus users get 3 re-styles/day, Pro users get unlimited
- Theme automatically saved to project metadata for persistence
- Analytics tracking for all re-style events

**AI Image Generation**
- POST /api/ai/image - DALL-E 3 integration for generating images from prompts
- Automatic "no text" enforcement in prompts for brand-safe images
- Plan gating: Plus users get 10 images/day, Pro users get 200/day
- Generated images saved to assets with full metadata (source, license, AI prompt)
- Event tracking for analytics and usage monitoring

**Smart Project Search**
- GET /api/projects/search - Advanced search with natural language queries and filters
- Supports: text search (title, niche), type filter, tag filter, date range, status, starred flag
- Pagination support (limit/offset parameters)
- Optimized with proper indexing and ILIKE queries for performance
- Default limit of 50 results to prevent large responses

**Lite Analytics**
- POST /api/analytics/event - Track project-level events (views, exports, AI usage)
- GET /api/analytics/summary - Aggregate analytics for projects and users
- Tracks: views, exports (PDF/PNG/HTML), AI usage (text/images/restyles)
- Per-project summaries and user-wide analytics
- Foundation for "Next Best Action" recommendations

**Database Schema Updates**
- Added `project_events` table with indexed columns (projectId, userId, type, createdAt)
- Enhanced `projects.metadata` with theme, starred, and tags fields
- Updated `assets.metadata` to include AI image source, license, and prompt information
- Proper indexing for performance on high-volume queries

**Backend Infrastructure**
- Storage layer methods for event tracking, search, and AI usage counting
- Rate limiting and plan gating integrated with subscription tiers
- Security: All endpoints authenticated and authorize user access to resources
- Error handling with friendly messages for quota exceeded scenarios

**Next Steps (Frontend UI Required)**
- AI Re-Style UI: Modal with mood selector, prompt input, and preview in Brand Kit panel
- AI Image Generation UI: "Generate with AI" button in Image blocks and cover pages
- Smart Search UI: Global search bar in header with filter controls
- Analytics Dashboard: Project cards with stats and "Next Best Action" widgets

## Recent Changes (October 2025)

### License-Free Stock Photos Migration (October 5, 2025)
Completed migration from Unsplash to 100% license-free stock photo sources for global commercial safety:

**Photo Sources**
- **Pexels (Primary)**: CC0 License, no attribution required, fully free for commercial use
- **Pixabay (Fallback)**: CC0 License, no attribution required, fully free for commercial use
- Both sources accessible via dropdown selector in Assets and AssetPicker components

**Backend Implementation**
- GET /api/pexels/search - Search Pexels photo library
- POST /api/pexels/import - Import Pexels photos to asset library
- GET /api/pixabay/search - Search Pixabay photo library  
- POST /api/pixabay/import - Import Pixabay photos to asset library
- All assets tagged with metadata.source ("pexels" or "pixabay") and metadata.license ("free_commercial")
- Removed unsplash-js dependency and all Unsplash API references

**User Experience**
- Clear CC0 license messaging: "✓ 100% free for commercial use • No attribution required • CC0 License"
- Source badges on imported assets (📸 Pexels, 🖼️ Pixabay)
- Dual-source search available in both Assets page and AssetPicker component
- Seamless photo search, preview, and import workflow

### Canva-Style Template Browsing System (October 5, 2025)
Transformed the Templates page into a professional Canva-style browsing experience with AI-powered discovery:

**Template Discovery Features**
- **For You Section**: AI-powered personalized recommendations based on user's project history and usage patterns
- **Horizontal Scrolling Categories**: Smooth category navigation (Health & Wellness, Business, Marketing, Education, Lifestyle, Social Media)
- **Smart Search**: Real-time template search with filtering across titles, descriptions, and tags
- **Favorites System**: Star/unstar templates with persistent favorites tracking across sessions
- **Recently Used**: Automatic tracking of template usage history for quick access
- **Trending Templates**: Curated section highlighting popular and high-performing templates
- **New Templates**: Showcase of recently added templates

**Template Preview & AI Auto-Generation**
- **Preview Modal**: Click any template to see detailed preview with sections, stats, and structure
- **Use This Template**: One-click AI generation that creates complete product with pre-filled content
- **AI Content Generation**: GPT-4 powered generation of 300-500 words per section
- **Instant Editor Access**: Automatically opens Canva-style editor after generation
- **Smart Fallbacks**: Graceful degradation when API key is missing or AI generation fails
- **Template-to-Editor Flow**: Seamless experience from browsing → preview → AI generation → editing

**Template Catalog**
- 18 professionally curated templates across 6 categories
- Rich metadata: categories, tags, icons, tier requirements (Free/Plus/Pro)
- Template types: eBooks, online courses, checklists, lead magnets, workbooks, templates
- Preview data with structured sections and content

**Backend Infrastructure**
- Database schema: `templateFavorites` and `templateUsage` tables for tracking
- API routes: GET templates, recommendations, favorites toggle, usage tracking
- AI-powered recommendations: Analyzes user project types and recent usage to suggest relevant templates
- Curated fallback system ensures quality recommendations for new users

**Technical Implementation**
- TanStack Query for efficient data fetching and caching
- Optimistic updates for instant favorite toggling
- Real-time search filtering with debouncing
- Horizontal scroll navigation with smooth animations
- Grid layout with hover interactions and visual feedback

**Routes**
- `/templates` - Canva-style template browsing page

### Canva-Style Interactive Editor (October 5, 2025)
Built a professional Canva-style editor for digital products (ebooks, workbooks, courses, landing pages) with the following features:

**Editor Layout**
- **Left Panel**: Drag-and-drop sections outline for easy reordering
- **Center Canvas**: Rich WYSIWYG TipTap editor with inline text editing and formatting
- **Right Panel**: AI Tools with 4 tabs (Edit/Improve, Images, Brand Kit, AI Suggestions)
- **Top Bar**: Save, Undo/Redo, Export, Preview, Settings with keyboard shortcuts

**Core Features**
- Live preview updates with instant visual feedback
- Autosave every 5 seconds with dirty flag tracking
- Undo/Redo functionality (Ctrl+Z, Ctrl+Y)
- Keyboard shortcuts: Ctrl+S (Save), Ctrl+Z (Undo), Ctrl+Y (Redo)
- Smooth transitions and animations for AI-generated updates
- Version history integration for project snapshots

**AI Integration**
- Polish Content: Improve clarity, flow, and professional tone
- Improve Writing: Enhance quality, engagement, and persuasiveness
- Make Shorter: Concise editing while preserving key points
- Expand Content: Add details, examples, and depth
- Full draft generation with GPT-5 streaming
- Section-level regeneration with brand tone application
- Image suggestions and regeneration

**Technical Implementation**
- TipTap rich text editor with custom extensions (Image, Link, TextAlign, Color)
- React Hook Form for content management
- TanStack Query for efficient data fetching and caching
- @hello-pangea/dnd for drag-and-drop functionality
- Real-time autosave with debouncing and optimistic updates

**Routes**
- `/projects/:id` - New Canva-style editor (default)
- `/projects/:id/classic` - Classic text-based editor (legacy)

## Recent Changes (October 2025)

### Major Platform Transformation - UX Revolution
The platform has been completely redesigned to deliver a best-in-class user experience:

**1. Simplified Sidebar Navigation**
- Restructured into MAIN sections (Dashboard, Create Product, Content Studio, Launch & Sales, Performance)
- Organized TOOLS & SETTINGS sections for clarity
- Merged Assets under Brand Kit for streamlined access
- Moved Upgrade button to header for visibility

**2. AI Command Bar (Ctrl/Cmd+K)**
- Universal keyboard shortcut for rapid navigation
- Natural language support with intelligent routing
- Autocomplete for pages and actions using cmdk library
- Instant access to any feature from anywhere

**3. Redesigned Dashboard**
- Actionable widgets: Generate Offer, Learn Cost Savings
- Real-time progress tracker using project metadata
- Recent activity feed from actual projects
- Motivational Quick Actions section for productivity

**4. Floating AI Coach**
- Persistent bottom-right chat bubble with expand/minimize controls
- Context-aware greetings based on current page location
- Streaming SSE chat functionality for real-time assistance
- Unique message IDs (crypto.randomUUID) for reliable rendering

**5. Unified Product Creation Wizard**
- 4-step wizard with horizontal progress indicator
- Step 1: Product type selection (6 types: ebook, course, checklist, leadmagnet, workbook, template)
- Step 2: Basic info (title, tone of voice)
- Step 3: Details (niche, audience, goal)
- Step 4: Review and create
- Auto-saves to localStorage for progress preservation
- Proper validation at each step
- Seamless integration with projects schema

### Technical Improvements
- All features architect-approved and production-ready
- Fixed dashboard progress logic to use metadata flags
- Resolved FloatingAICoach ID collision bug with crypto.randomUUID()
- Proper functional setState updates for message history preservation
- DashboardLayout integration for consistent UX across all pages

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
- **Stock Photos**: Pexels API (primary), Pixabay API (fallback) - 100% free for commercial use, no attribution required

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