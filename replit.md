# AI Product Creator

A fullstack web application for creating AI-generated digital products with user authentication and AI-powered content generation.

## Overview

This application allows users to:
- Sign up and log in using Replit Auth (supports Google, GitHub, and email/password)
- Generate professional digital products using OpenAI's GPT-5 model
- Manage and download their created products
- Browse product history and manage their account

## Recent Changes

**October 2, 2024**
- Initial application setup with Replit Auth and OpenAI integration
- Implemented complete authentication flow with session management
- Created database schema for users and products
- Built backend API routes for product generation and management
- Designed and implemented frontend with landing page, dashboard, and product creation flow
- Added error handling for AI quota limits and authentication errors

## Project Architecture

### Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **AI**: OpenAI GPT-5

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

## User Preferences

- Modern, clean UI design with purple primary color (#a855f7)
- Dark mode support
- Responsive layout for all screen sizes
- Use shadcn components for consistency
- Minimal animations and smooth transitions

## Database Schema

### Users Table
- id (varchar, UUID primary key)
- email (varchar, unique)
- firstName (varchar)
- lastName (varchar)
- profileImageUrl (varchar)
- createdAt, updatedAt (timestamps)

### Products Table
- id (varchar, UUID primary key)
- userId (varchar, foreign key)
- title (text)
- type (text)
- content (text) - AI-generated content
- prompt (text)
- creativity (text)
- length (integer)
- style (text)
- createdAt (timestamp)

### Sessions Table
- sid (varchar, primary key)
- sess (jsonb)
- expire (timestamp)

## API Routes

### Authentication
- `GET /api/login` - Initiate login flow
- `GET /api/callback` - OAuth callback
- `GET /api/logout` - Logout user
- `GET /api/auth/user` - Get current user (requires auth)

### Products
- `GET /api/products` - Get user's products (requires auth)
- `POST /api/products/generate` - Generate product with AI (requires auth)
- `DELETE /api/products/:id` - Delete product (requires auth)

## Environment Variables

Required secrets:
- `OPENAI_API_KEY` - OpenAI API key for content generation
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret
- `REPL_ID` - Replit application ID
- `REPLIT_DOMAINS` - Comma-separated list of domains

## Development

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

The app will be available at http://localhost:5000

## Features

### Landing Page
- Hero section with AI background image
- Feature showcase
- How it works section
- Footer with links

### Authentication
- Replit Auth integration
- Support for Google, GitHub, and email/password login
- Automatic session management
- Protected routes

### Dashboard
- Statistics overview (products created, downloads, storage)
- Recent products grid
- Quick access to create new products

### Product Creation
- Multiple product types (Text, Graphics, Email, Social Media, Code, Marketing)
- Customizable parameters (creativity, length, style)
- Real-time preview
- AI-powered generation using GPT-5

### Product Management
- Grid view of all products
- Search and filter capabilities
- Download products as files
- Delete products

## Known Limitations

- OpenAI API quota must be available for product generation
- File downloads are currently text-only
- Image generation not yet implemented
- Product editing feature pending

## Error Handling

The application handles:
- Authentication errors (401 Unauthorized)
- AI quota exceeded errors (429 Rate Limit)
- Invalid API key errors
- Network failures
- General server errors

All errors display user-friendly toast notifications.
