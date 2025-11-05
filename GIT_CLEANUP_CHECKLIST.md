# Git & Workspace Cleanup Checklist for ProductifyAI

## Current Status Summary

### Main Branch (`replit-agent`)
- ✅ **Clean** - No uncommitted changes
- ⚠️ **Ahead by 2 commits** - Needs push to origin

### Worktrees Found
1. **aGNdu** (`ops/uptime-main`) - Has untracked files (build artifacts)
2. **aT6aP** (`2025-10-30-fwh8-aT6aP`) - ✅ Clean
3. **CNTrM** (`2025-10-30-6wqd-CNTrM`) - ✅ Clean

### Issues Identified
- Worktree `aGNdu` has untracked files: `.github/workflows/build.yml`, `client/`, `dist/`, `node_modules/`
- Most are build artifacts (`dist/`, `node_modules/`) that should be ignored
- Main branch needs push to sync with remote

---

## PowerShell Commands to Execute

### Step 1: Clean Worktree `aGNdu` (ops/uptime-main)
```powershell
# Check if .github/workflows/build.yml needs to be committed
git -C C:/Users/bionic/.cursor/worktrees/ProductifyAI/aGNdu status --short

# If build.yml is legitimate, add it (otherwise skip)
git -C C:/Users/bionic/.cursor/worktrees/ProductifyAI/aGNdu add .github/workflows/build.yml
git -C C:/Users/bionic/.cursor/worktrees/ProductifyAI/aGNdu commit -m "sync: add workflow files"

# Clean untracked files (ignores gitignored files)
git -C C:/Users/bionic/.cursor/worktrees/ProductifyAI/aGNdu clean -fd

# Verify clean
git -C C:/Users/bionic/.cursor/worktrees/ProductifyAI/aGNdu status
```

### Step 2: Push Main Branch (replit-agent)
```powershell
# Push main branch to sync with remote
git push origin replit-agent
```

### Step 3: Remove Stale Worktrees (Optional - only if branches are merged/stale)
```powershell
# Check if branches are merged
git branch --merged

# Remove worktree for aT6aP (if branch is stale)
git worktree remove --force C:/Users/bionic/.cursor/worktrees/ProductifyAI/aT6aP

# Remove worktree for CNTrM (if branch is stale)
git worktree remove --force C:/Users/bionic/.cursor/worktrees/ProductifyAI/CNTrM
```

### Step 4: Prune Worktrees
```powershell
# Remove any stale worktree references
git worktree prune
```

### Step 5: Verify Final State
```powershell
# List all worktrees
git worktree list

# Check main branch status
git status

# Verify workflows exist
Test-Path .github/workflows/build.yml
Test-Path .github/workflows/uptime.yml
```

---

## Complete Cleanup Script (Copy-Paste Ready)

**Option 1: Run the automated script**
```powershell
cd C:\Users\bionic\.cursor\ProductifyAI
.\cleanup-git.ps1
```

**Option 2: Run commands manually**

```powershell
# Navigate to repo root
cd C:\Users\bionic\.cursor\ProductifyAI

# Step 1: Clean aGNdu worktree (remove untracked files)
git -C C:/Users/bionic/.cursor/worktrees/ProductifyAI/aGNdu clean -fd
git -C C:/Users/bionic/.cursor/worktrees/ProductifyAI/aGNdu status

# Step 2: Push main branch
git push origin replit-agent

# Step 3: Prune worktrees
git worktree prune

# Step 4: Verify final state
git worktree list
git status
```

---

## If You Need to Re-add Worktrees Later

```powershell
# Re-add ops/uptime-main worktree
git worktree add C:/Users/bionic/.cursor/worktrees/ProductifyAI/aGNdu ops/uptime-main

# Re-add other worktrees if needed
git worktree add C:/Users/bionic/.cursor/worktrees/ProductifyAI/aT6aP 2025-10-30-fwh8-aT6aP
git worktree add C:/Users/bionic/.cursor/worktrees/ProductifyAI/CNTrM 2025-10-30-6wqd-CNTrM
```

---

## Post-Cleanup Verification

After running cleanup, verify:
1. ✅ `git status` shows clean working tree
2. ✅ `git worktree list` shows only active worktrees
3. ✅ Main branch is synced with remote (`git status` shows "up to date")
4. ✅ GitHub Actions workflows exist and are valid

---

## Notes

- The `dist/` and `node_modules/` files in `aGNdu` are build artifacts and should be ignored (already in `.gitignore`)
- If `.github/workflows/build.yml` exists in `aGNdu` but not in main, decide if it should be merged to main
- Worktrees `aT6aP` and `CNTrM` appear to be temporary branches and can be removed if no longer needed

