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
Productify AI is a fullstack application built with React, Vite, TypeScript, Tailwind CSS, and shadcn/ui for the frontend, and Express.js with TypeScript for the backend. It uses PostgreSQL with Drizzle ORM for database management and Replit Auth for authentication. AI capabilities are powered by OpenAI GPT-5, featuring an "elite product strategist" AI coach. Key features include a rich text editor (TipTap), drag-and-drop functionality (@hello-pangea/dnd), and robust auto-save with optimistic caching. The system also supports multi-format exports (PDF, DOCX, HTML) and includes a comprehensive asset library system with Unsplash integration. A community platform for digital product creators is integrated with real-time interaction features.

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
- **AI**: OpenAI GPT-5
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