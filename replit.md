# Productify AI

## Overview
Productify AI is an AI-powered digital product creation platform designed to help users create, manage, and export various professional digital products such as eBooks, online courses, checklists, templates, and lead magnets. The platform aims to be the most user-friendly and advanced digital product platform, featuring simplified navigation, an AI command interface, a redesigned dashboard, a floating AI coach, and a unified product creation wizard. It has undergone a major transformation to enhance the user experience and provide advanced AI-powered creation tools.

## User Preferences
- Modern, clean UI design with purple primary color (#a855f7)
- Dark mode support throughout
- Responsive layout for all screen sizes
- Use shadcn components for consistency
- Minimal animations and smooth transitions
- Professional, productive interface for content creators

## System Architecture

### UI/UX Decisions
The platform features a modern, clean UI design utilizing a purple primary color (#a855f7) and supporting dark mode. It is built to be responsive across all screen sizes, employing shadcn components for consistency and incorporating minimal animations and smooth transitions to provide a professional and productive interface. Key UI elements include a simplified sidebar navigation, an AI Command Bar (Ctrl/Cmd+K), a redesigned dashboard with actionable widgets, and a floating AI Coach. A Canva-style template browsing system with personalized recommendations and a Canva-style interactive editor with drag-and-drop functionality are central to the user experience.

### Technical Implementations
Productify AI is a fullstack application built with React, Vite, TypeScript, Tailwind CSS, and shadcn/ui for the frontend, and Express.js with TypeScript for the backend. It uses PostgreSQL with Drizzle ORM for database management and Replit Auth for authentication. AI capabilities are powered by OpenAI GPT-5, featuring a specialized "Digital Product AI Coach" that provides guidance for creating and monetizing digital products. The system includes a rich text editor (TipTap), drag-and-drop functionality (@hello-pangea/dnd), and robust auto-save with optimistic caching. It supports multi-format exports (PDF, DOCX, HTML) and includes a comprehensive asset library system.

### Feature Specifications
- **Digital Product Creation**: AI-powered generation and editing of eBooks, online courses, checklists, templates, and lead magnets, utilizing a unified 4-step creation wizard.
- **AI Tools**: AI Re-Styling System for theme generation, AI Image Generation (DALL-E 3), Smart Project Search with natural language queries, and AI-powered content improvement (polish, shorten, expand).
- **Template Management**: Canva-style template browsing with personalized recommendations, smart search, favorites, and AI auto-generation of content.
- **Content Editing**: Canva-style interactive editor with drag-and-drop sections, WYSIWYG editing, undo/redo, autosave, and AI integration.
- **Asset Management**: Import from Pexels/Pixabay, search, and manage assets with commercial-free licensing.
- **Analytics**: Lite analytics for tracking project-level events (views, exports, AI usage) and summary reporting.
- **AI Coach**: Interactive chat assistant providing context-aware guidance and real-time assistance.
- **Platform Navigation**: Simplified sidebar, universal AI Command Bar (Ctrl/Cmd+K) for rapid navigation, and a redesigned dashboard.

### System Design Choices
The project architecture emphasizes modularity and clear separation between client and server. The database schema is designed to support complex digital products, brand kits, projects, sections, assets, template metadata, and versioning. Key tables include `users`, `brand_kits`, `projects`, `sections`, `assets`, `project_versions`, `templateFavorites`, `templateUsage`, and `project_events`. API routes are structured RESTfully, covering authentication, brand kits, projects, sections, assets, versions, and template interactions. Error handling is robust, providing user-friendly toast notifications.

## External Dependencies
- **AI**: OpenAI GPT-5 (requires `OPENAI_API_KEY` secret), DALL-E 3 for image generation.
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Rich Text Editor**: TipTap
- **Drag & Drop**: @hello-pangea/dnd
- **Stock Photos**: Pexels API (primary), Pixabay API (fallback) for 100% license-free commercial use.
- **PDF Generation**: pdf-lib
- **DOCX Generation**: docx.js
- **Markdown Processing**: markdown-it
- **ZIP Archiving**: jszip