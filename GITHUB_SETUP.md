# GitHub Connection Guide

## Why GitHub Backup?
- ✅ Complete version control and history
- ✅ Rollback to any previous state
- ✅ Team collaboration capability
- ✅ Offsite backup (independent of Replit)
- ✅ CI/CD integration ready

## Setup Steps

### Method 1: Using Replit's Built-in Git (Recommended)

1. **Initialize Git in Replit:**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your@email.com"
   git init
   ```

2. **Create .gitignore:**
   Already configured with:
   ```
   node_modules/
   .env
   *.log
   dist/
   .replit
   replit.nix
   ```

3. **Create GitHub Repository:**
   - Go to https://github.com/new
   - Name: `productify-ai`
   - Keep private
   - Don't initialize with README (we have code)
   - Click "Create repository"

4. **Connect Replit to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit - Productify AI MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/productify-ai.git
   git push -u origin main
   ```

5. **Setup GitHub Token (if needed):**
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `repo` (full control)
   - Copy token
   - Use as password when pushing

### Method 2: Using Replit's GitHub Integration

1. **Open Version Control:**
   - Click "Version Control" icon in left sidebar
   - Or use Tools → Version Control

2. **Connect to GitHub:**
   - Click "Connect to GitHub"
   - Authorize Replit
   - Select/create repository
   - Click "Connect"

3. **Initial Push:**
   - Stage all files
   - Write commit message: "Initial commit - Productify AI MVP"
   - Click "Commit and push"

## Regular Backup Workflow

### Daily Commits
```bash
git add .
git commit -m "Description of changes"
git push
```

### Before Major Changes
```bash
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "Add new feature"
git push -u origin feature/new-feature
```

### Replit Checkpoints + GitHub
- Replit checkpoints: Automatic (every session)
- GitHub commits: Manual (you control)
- Use both for maximum safety

## What Gets Backed Up

✅ **Included:**
- All source code (client/ and server/)
- Configuration files
- Database schema (shared/schema.ts)
- Package.json dependencies
- Documentation files

❌ **Excluded (via .gitignore):**
- node_modules/ (reinstalled from package.json)
- .env secrets
- Log files
- Build artifacts

## Emergency Recovery

### Restore from GitHub:
```bash
git clone https://github.com/YOUR-USERNAME/productify-ai.git
cd productify-ai
npm install
# Add environment variables
npm run dev
```

### Restore Specific File:
```bash
git checkout HEAD -- path/to/file
```

### Restore to Previous Commit:
```bash
git log  # Find commit hash
git checkout <commit-hash> -- .
```

## Security Best Practices

1. **Never Commit Secrets:**
   - ✅ Use Replit Secrets
   - ✅ .gitignore includes .env
   - ❌ Never hardcode API keys

2. **Keep Repository Private:**
   - Contains business logic
   - May reveal API structures
   - Keep competitive advantage

3. **Regular Backups:**
   - Commit after each feature
   - Push at end of day
   - Tag major releases

## Integration with Replit Checkpoints

**Replit Checkpoints:** Automatic, includes database
**GitHub Commits:** Manual, code only

**Best Practice:**
1. Make changes
2. Test locally
3. Commit to GitHub (code backup)
4. Replit auto-checkpoint (full backup)

## Useful Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# See changes
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Create tag for release
git tag -a v1.0 -m "Production launch"
git push --tags
```

## Next Steps

After GitHub connection:
1. ✅ Verify first push succeeded
2. ✅ Check repository on GitHub
3. ✅ Set up branch protection rules (optional)
4. ✅ Enable GitHub Actions for CI/CD (optional)
5. ✅ Add collaborators (if team project)
