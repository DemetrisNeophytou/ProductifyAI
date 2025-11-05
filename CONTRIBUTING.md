# Contributing to ProductifyAI

## 🚀 Development Workflow

### Branch Strategy

- **`main`** - Production-ready code (protected)
- **`replit-agent`** - Development branch (backup)
- **Feature branches** - `feature/your-feature-name`
- **Fix branches** - `fix/issue-description`

### Pull Request Rules

1. **Never push directly to `main`**
2. **All changes must go through Pull Requests**
3. **Require 1 approval before merging**
4. **All CI checks must pass**
5. **Keep PRs small and focused** (< 500 lines when possible)

---

## 📝 Commit Naming Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes
- **security**: Security fixes

### Examples

```bash
feat(auth): add Google OAuth login
fix(api): resolve rate limiting issue
docs(readme): update setup instructions
security(deps): update vulnerable packages
```

---

## 🔧 Local Development Setup

### Prerequisites

- Node.js 22.x
- pnpm 8.x
- PostgreSQL (or Supabase account)

### Installation

```bash
# Clone the repository
git clone https://github.com/DemetrisNeophytou/ProductifyAI.git
cd ProductifyAI

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Environment Variables

Required variables (see `.env.example` for full list):

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API
VITE_API_URL=http://localhost:5050

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Security
JWT_SECRET=your-jwt-secret-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars
CORS_ORIGIN=http://localhost:5173
```

### Running Locally

```bash
# Development mode (both frontend + backend)
pnpm run dev

# Frontend only
pnpm run dev:client

# Backend only
pnpm run dev:api

# Build for production
pnpm run build

# Run tests
pnpm run test
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:ui

# Run tests in CI mode
pnpm run test:ci
```

### Writing Tests

- Place tests next to the code they test
- Name test files: `*.test.ts` or `*.test.tsx`
- Use descriptive test names

Example:
```typescript
describe('AuthService', () => {
  it('should authenticate user with valid credentials', async () => {
    // Test implementation
  });
});
```

---

## 📋 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project conventions
- [ ] Commit messages follow naming convention
- [ ] All tests pass locally (`pnpm run test:ci`)
- [ ] Type checking passes (`pnpm run check`)
- [ ] No linting errors (`pnpm run lint`)
- [ ] Documentation updated (if needed)
- [ ] Environment variables documented (if new ones added)
- [ ] No secrets committed
- [ ] PR description explains what and why

---

## 🔒 Security Guidelines

### Never Commit Secrets

- Use `.env` files (never commit them)
- Store secrets in:
  - GitHub Secrets (for CI/CD)
  - Vercel Environment Variables (for frontend)
  - Render Environment Variables (for backend)

### Pre-commit Checks

Gitleaks will scan for secrets automatically, but you can run locally:

```bash
# Install gitleaks
brew install gitleaks  # macOS
# or download from: https://github.com/gitleaks/gitleaks/releases

# Scan for secrets
gitleaks detect --source . --verbose
```

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Email: security@productifyai.com

---

## 🏗️ Project Structure

```
ProductifyAI/
├── .github/
│   └── workflows/          # CI/CD workflows
├── client/                 # Frontend (Vite + React)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   └── stores/         # State management
│   └── index.html
├── server/                 # Backend (Express)
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middleware/         # Express middleware
│   └── migrations/         # Database migrations
├── shared/                 # Shared types/schemas
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── test/                   # Test files
```

---

## 🚢 Deployment

### Vercel (Frontend)

- Automatically deploys on push to `main`
- Preview deployments for PRs
- Environment variables configured in Vercel dashboard

### Render (Backend)

- Automatically deploys on push to `main`
- Build command: `pnpm run build`
- Start command: `pnpm run start`
- Environment variables configured in Render dashboard

---

## 📚 Additional Resources

- [Project Documentation](./docs/)
- [API Documentation](./API_DOCS.md)
- [Security Policy](./SECURITY.md)
- [Environment Matrix](./docs/env-matrix.md)

---

## 🤝 Code Review Guidelines

### For Reviewers

- Review within 24 hours
- Check for:
  - Code quality and readability
  - Test coverage
  - Security concerns
  - Performance implications
  - Documentation updates
- Provide constructive feedback
- Approve only when confident

### For Authors

- Respond to feedback promptly
- Don't take criticism personally
- Ask questions if unclear
- Update PR based on feedback
- Request re-review after changes

---

## ❓ Getting Help

- **Documentation**: Check `./docs/` first
- **Issues**: Search existing GitHub issues
- **Questions**: Open a discussion on GitHub
- **Bugs**: Open an issue with reproduction steps

---

**Thank you for contributing to ProductifyAI! 🚀**

