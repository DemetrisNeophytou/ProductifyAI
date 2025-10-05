# Productify AI

## Overview
Productify AI is an AI-powered digital product creation platform designed to help users create, manage, and export various professional digital products such as eBooks, online courses, checklists, templates, and lead magnets. The platform aims to be the most user-friendly and advanced digital product platform, featuring simplified navigation, an AI command interface, a redesigned dashboard, a floating AI coach, and a unified product creation wizard. It has undergone a major transformation to enhance the user experience and provide advanced AI-powered creation tools.

### Recent Enhancements (October 2025)
- **Bug Fix - Select Components**: Fixed critical issue where Radix UI Select components with empty string values (`value=""`) caused Vite overlay errors and broke user interactions. Updated AIImageModal and SmartSearch to use meaningful default values ("none", "all") instead of empty strings. Backend routes now properly handle "all" filter values by treating them as undefined (no filtering). This ensures smooth user experience in Create flow, Editor tabs, and filter dropdowns.
- **Google Fonts Integration**: Dynamic font loading from Google Fonts API with fallback to curated popular fonts. Over 100 fonts available for commercial use. Fonts are dynamically loaded when selected and previewed in their actual typeface in both dropdown items and selected state (SelectTrigger). Font loading prevents duplicates using unique link IDs. Pre-loads first 10 fonts for instant preview.
- **Image Export Capabilities**: Added PNG and JPG export formats using html2canvas. All exports automatically apply brand kit styling (colors, fonts).
- **Comprehensive Media Sources**: Integrated Pexels and Pixabay APIs for stock photos, Google Fonts for typography, and Lucide icons - all 100% free for commercial use with no attribution requirements.
- **Enhanced Brand Kit**: Brand kit now includes dynamic font selection from Google Fonts API and applies globally across all templates, exports (PDF, DOCX, HTML, PNG, JPG), and projects. Font previews work correctly in both BrandKit page and BrandKitTab component within the editor.
- **Font Preview System**: Implemented comprehensive font preview system that loads Google Fonts dynamically and displays them in their actual typeface throughout the UI. SelectTrigger components show selected fonts using inline styles, and dropdown items render each font option in its own typeface for easy visual selection.

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
- **Brand Kit System**: Comprehensive brand kit with primary/secondary colors, custom font selection (100+ Google Fonts via API with fallback to curated popular fonts), brand voice/tone settings, and global application across all templates and exports.
- **Multi-Format Export**: Export projects to PDF, DOCX, HTML, PNG, and JPG formats with brand kit styling automatically applied. PNG/JPG exports use html2canvas for high-quality image generation.
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
- **Stock Photos**: Pexels API (requires `PEXELS_API_KEY`), Pixabay API (requires `PIXABAY_API_KEY`) - Both provide 100% free for commercial use, no attribution required.
- **Fonts**: Google Fonts API (optional `GOOGLE_FONTS_API_KEY` - falls back to curated popular fonts list if not provided) - All fonts free for commercial use.
- **Icons**: Lucide React - Open-source, free for commercial use.
- **PDF Generation**: pdf-lib
- **DOCX Generation**: docx.js
- **HTML to Image**: html2canvas (for PNG/JPG exports)
- **Markdown Processing**: markdown-it
- **ZIP Archiving**: jszip