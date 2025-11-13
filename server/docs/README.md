# ProductifyAI Server Documentation

## Overview
ProductifyAI is an AI-powered platform that helps users create, edit, and sell digital products (eBooks, templates, mini-courses, videos, and playbooks).

## Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI API (planned)
- **ORM**: Drizzle ORM

## Project Structure
```
/server
├── index.ts              # Main server entry point
├── db.ts                 # Database connection and configuration
├── .env.example          # Environment variables template
├── routes/               # API route handlers
├── services/             # Business logic services
├── utils/                # Utility functions and helpers
└── docs/                 # Documentation
```

## Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=5050
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp server/.env.example server/.env
# Edit server/.env with your actual values
```

### 3. Start Development Server
```bash
npm run dev:server
```

### 4. Verify Connection
```bash
curl http://localhost:5050/health/db
```

## API Endpoints

### Health Check
- `GET /health/db` - Database connection status

### Base URL
- `GET /` - Server status

## Services

### DatabaseService
Handles all database operations and connection management.

### AIService
Manages AI-powered content generation for products and videos.

## Development

### Scripts
- `npm run dev:server` - Start development server
- `npm run dev:api` - Start API server (alternative)
- `npm run check` - TypeScript type checking

### Logging
The server includes comprehensive logging:
- INFO: General information
- ERROR: Error messages
- WARN: Warning messages
- DEBUG: Debug information (development only)

## Database Schema
The server connects to Supabase PostgreSQL with the following tables:
- `users` - User accounts and profiles
- `products` - Digital products created by users
- `purchases` - Product purchase records

## Security
- CORS enabled for cross-origin requests
- SSL/TLS required for Supabase connection
- Environment variables for sensitive data
- Input validation using Zod schemas

## Future Enhancements
- OpenAI API integration for advanced AI features
- File upload and storage management
- Payment processing with Stripe
- User authentication and authorization
- Rate limiting and security middleware


