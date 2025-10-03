# Productify AI

A comprehensive AI-powered digital product creation platform that empowers users to create, manage, and export professional digital products including eBooks, online courses, checklists, templates, and lead magnets.

## Overview

Productify AI is a fullstack platform that allows users to:
- Create professional digital products using AI (GPT-5)
- Manage brand identity with customizable brand kits
- Edit content with a rich text editor (TipTap)
- Export products in multiple formats (PDF, DOCX, MD, HTML, ZIP)
- Manage assets and versions
- Generate marketing materials automatically
- Collaborate and organize projects

## Recent Changes

**October 3, 2025**
- **Phase 1 Infrastructure Complete**: Migrated from simple product generator to full Productify AI platform
- **Database Schema Update**: Implemented comprehensive schema with 6 new tables:
  - `brand_kits`: Store user brand identity (logo, colors, fonts, tone of voice)
  - `projects`: Main project table supporting multiple product types
  - `sections`: Hierarchical content sections with drag-drop ordering
  - `assets`: File management for images, documents, media
  - `project_versions`: Version control with snapshot restoration
  - `products_old`: Archived old products table for migration
- **Storage Layer Refactored**: Complete rewrite with methods for all new entities
- **API Routes Updated**: New REST endpoints for projects, sections, assets, versions
- **9-Phase Implementation Plan**: Created structured roadmap for full platform development

**October 2, 2024**
- Initial application setup with Replit Auth and OpenAI integration
- Implemented complete authentication flow with session management
- Built basic product generator with AI content generation

## Project Architecture

### Tech Stack

**Core Stack**
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **AI**: OpenAI GPT-5 (via Productifykey environment variable)

**Planned Additions (Phase 2-9)**
- **Rich Text Editor**: TipTap
- **Drag & Drop**: react-beautiful-dnd
- **Export**: pdf-lib, docx.js, markdown-it
- **Image Assets**: Unsplash API
- **UI Components**: Additional shadcn components

### Directory Structure
```
├── client/               # Frontend application
│   └── src/
│       ├── components/   # Reusable React components
│       ├── pages/        # Page components
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utility functions
├── server/               # Backend application
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   ├── replitAuth.ts     # Authentication setup
│   └── openai.ts         # AI integration
└── shared/
    └── schema.ts         # Shared types and schemas
```

## Database Schema

### Core Tables

#### users
- `id` (varchar, UUID primary key)
- `email` (varchar, unique)
- `firstName` (varchar)
- `lastName` (varchar)
- `profileImageUrl` (varchar)
- `createdAt`, `updatedAt` (timestamps)

#### brand_kits
- `id` (varchar, UUID primary key)
- `userId` (varchar, foreign key → users, unique)
- `logoUrl` (varchar, optional)
- `primaryColor` (varchar, hex color)
- `secondaryColor` (varchar, hex color)
- `fonts` (jsonb: { heading, body, accent })
- `toneOfVoice` (text: professional, casual, friendly, etc.)
- `createdAt`, `updatedAt` (timestamps)

#### projects
- `id` (varchar, UUID primary key)
- `userId` (varchar, foreign key → users)
- `type` (varchar: ebook, course, checklist, template, lead_magnet)
- `title` (text)
- `status` (varchar: draft, in_progress, completed, published)
- `metadata` (jsonb: author, description, tags, target_audience, etc.)
- `coverImageUrl` (varchar, optional)
- `backgroundColor` (varchar, optional)
- `createdAt`, `updatedAt` (timestamps)

#### sections
- `id` (varchar, UUID primary key)
- `projectId` (varchar, foreign key → projects)
- `type` (varchar: chapter, lesson, step, module, etc.)
- `title` (text)
- `content` (text, JSON/HTML from TipTap editor)
- `order` (integer, for drag-drop ordering)
- `createdAt`, `updatedAt` (timestamps)

#### assets
- `id` (varchar, UUID primary key)
- `userId` (varchar, foreign key → users)
- `projectId` (varchar, foreign key → projects, optional)
- `type` (varchar: image, document, video, audio)
- `url` (varchar)
- `filename` (varchar)
- `size` (integer, bytes)
- `metadata` (jsonb: dimensions, duration, etc.)
- `createdAt` (timestamp)

#### project_versions
- `id` (varchar, UUID primary key)
- `projectId` (varchar, foreign key → projects)
- `versionNumber` (integer)
- `snapshot` (jsonb: complete project + sections snapshot)
- `createdAt` (timestamp)

#### sessions (unchanged)
- `sid` (varchar, primary key)
- `sess` (jsonb)
- `expire` (timestamp)

#### products_old (archived)
- Old products table from simple generator
- Will be migrated or removed in later phase

## API Routes

### Authentication
- `GET /api/login` - Initiate login flow
- `GET /api/callback` - OAuth callback
- `GET /api/logout` - Logout user
- `GET /api/auth/user` - Get current user (requires auth)

### Brand Kits
- `GET /api/brand-kit` - Get user's brand kit (requires auth)
- `POST /api/brand-kit` - Create/update brand kit (requires auth)

### Projects
- `GET /api/projects` - Get user's projects (requires auth)
- `POST /api/projects` - Create new project (requires auth)
- `GET /api/projects/:id` - Get single project (requires auth)
- `PATCH /api/projects/:id` - Update project (requires auth)
- `DELETE /api/projects/:id` - Delete project (requires auth)
- `POST /api/projects/:id/duplicate` - Duplicate project (requires auth)

### Sections
- `GET /api/projects/:projectId/sections` - Get project sections (requires auth)
- `POST /api/projects/:projectId/sections` - Create section (requires auth)
- `PATCH /api/sections/:id` - Update section (requires auth)
- `DELETE /api/sections/:id` - Delete section (requires auth)
- `POST /api/sections/reorder` - Reorder sections (requires auth)

### Assets
- `GET /api/assets` - Get user's assets (requires auth)
- `GET /api/projects/:projectId/assets` - Get project assets (requires auth)
- `POST /api/assets` - Upload asset (requires auth)
- `DELETE /api/assets/:id` - Delete asset (requires auth)

### Versions
- `GET /api/projects/:projectId/versions` - Get project versions (requires auth)
- `POST /api/projects/:projectId/versions` - Create version (requires auth)
- `POST /api/versions/:versionId/restore` - Restore version (requires auth)

### Legacy (Temporary)
- `GET /api/products` - Returns empty array (backwards compatibility)
- `POST /api/products/generate` - Legacy generator (returns temp data)

## Environment Variables

Required secrets:
- `Productifykey` - OpenAI API key for content generation (custom variable name)
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret
- `REPL_ID` - Replit application ID
- `REPLIT_DOMAINS` - Comma-separated list of domains

## Implementation Plan

### Phase 1: Foundation & Core Infrastructure ✅
- [x] Database schema design and migration
- [x] Storage layer with all CRUD operations
- [x] API route structure preparation
- [x] OpenAI integration verification

### Phase 2: Install Dependencies & Setup (Current)
- [ ] Install TipTap rich text editor
- [ ] Install react-beautiful-dnd for drag-drop
- [ ] Install pdf-lib, docx.js for exports
- [ ] Install Unsplash API integration
- [ ] Update design guidelines

### Phase 3: Brand Kit Management
- [ ] Brand kit creation/edit UI
- [ ] Logo upload component
- [ ] Color picker integration
- [ ] Font selection interface
- [ ] Tone of voice selector

### Phase 4: Project Creation & Management
- [ ] Project type selection UI
- [ ] Project wizard/form
- [ ] Project dashboard/list view
- [ ] Project detail page
- [ ] Duplicate project feature

### Phase 5: Rich Content Editor
- [ ] TipTap editor integration
- [ ] Section management UI
- [ ] Drag-drop section reordering
- [ ] AI content generation integration
- [ ] Auto-save functionality

### Phase 6: Asset Management
- [ ] Asset library UI
- [ ] File upload system
- [ ] Unsplash integration
- [ ] Asset picker component
- [ ] Image optimization

### Phase 7: Export System
- [ ] PDF export (pdf-lib)
- [ ] DOCX export (docx.js)
- [ ] Markdown export
- [ ] HTML export
- [ ] ZIP multi-file export

### Phase 8: Version Control
- [ ] Version creation UI
- [ ] Version history view
- [ ] Version comparison
- [ ] Restore functionality
- [ ] Auto-versioning

### Phase 9: Marketing & Polish
- [ ] Marketing copy generator
- [ ] Social media assets
- [ ] Landing page builder
- [ ] Analytics dashboard
- [ ] Final polish & testing

## User Preferences

- Modern, clean UI design with purple primary color (#a855f7)
- Dark mode support throughout
- Responsive layout for all screen sizes
- Use shadcn components for consistency
- Minimal animations and smooth transitions
- Professional, productive interface for content creators

## Development

```bash
# Install dependencies
npm install

# Run database migrations (force push to sync new schema)
npm run db:push --force

# Start development server
npm run dev
```

The app will be available at http://localhost:5000

## Features Roadmap

### Current Features
- User authentication (Replit Auth)
- Basic AI product generation
- User dashboard

### Planned Features (9-Phase Plan)
- Brand kit management
- Multi-format project creation
- Rich text editing with TipTap
- Drag-drop content organization
- Multi-format exports (PDF, DOCX, MD, HTML, ZIP)
- Asset management with Unsplash
- Version control and history
- Marketing asset generation
- Collaboration tools

## Known Limitations

- Legacy product generator routes are temporary
- Export features not yet implemented
- Rich text editor pending integration
- Version control UI not built
- Marketing asset generation pending

## Error Handling

The application handles:
- Authentication errors (401 Unauthorized)
- AI quota exceeded errors (429 Rate Limit)
- Invalid API key errors
- Network failures
- General server errors
- Database constraint violations

All errors display user-friendly toast notifications.

## Migration Notes

- Old `products` table renamed to `products_old`
- New schema supports complex digital products
- API routes updated to use `/api/projects` instead of `/api/products`
- Legacy routes maintained for backwards compatibility
- Storage layer completely refactored for new structure
