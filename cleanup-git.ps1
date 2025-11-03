# Git & Workspace Cleanup Script for ProductifyAI
# Run this script in PowerShell from the repo root

Write-Host "=== ProductifyAI Git Cleanup ===" -ForegroundColor Green
Write-Host ""

# Navigate to repo root
$repoRoot = "C:\Users\bionic\.cursor\ProductifyAI"
Set-Location $repoRoot

# Step 1: Clean worktree aGNdu (ops/uptime-main)
Write-Host "Step 1: Cleaning worktree aGNdu (ops/uptime-main)..." -ForegroundColor Cyan
$worktreePath = "C:/Users/bionic/.cursor/worktrees/ProductifyAI/aGNdu"

# Check current status
Write-Host "  Checking status..." -ForegroundColor Yellow
git -C $worktreePath status --short

# Clean untracked files (this will respect .gitignore)
Write-Host "  Cleaning untracked files (respects .gitignore)..." -ForegroundColor Yellow
git -C $worktreePath clean -fd

# Verify clean
Write-Host "  Verifying clean state..." -ForegroundColor Yellow
$status = git -C $worktreePath status --porcelain
if ($status) {
    Write-Host "  WARNING: Worktree still has changes:" -ForegroundColor Red
    Write-Host $status
    Write-Host "  You may need to commit or discard these changes manually." -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Worktree is clean" -ForegroundColor Green
}
Write-Host ""

# Step 2: Push main branch (replit-agent)
Write-Host "Step 2: Syncing main branch (replit-agent)..." -ForegroundColor Cyan
$currentBranch = git branch --show-current
if ($currentBranch -eq "replit-agent") {
    $status = git status --porcelain
    if ($status) {
        Write-Host "  WARNING: Main branch has uncommitted changes:" -ForegroundColor Red
        Write-Host $status
        Write-Host "  Please commit or stash these changes before pushing." -ForegroundColor Yellow
    } else {
        $aheadCount = (git rev-list --count origin/replit-agent..HEAD 2>$null)
        if ($aheadCount -gt 0) {
            Write-Host "  Branch is ahead by $aheadCount commit(s). Pushing..." -ForegroundColor Yellow
            git push origin replit-agent
            Write-Host "  ✓ Pushed successfully" -ForegroundColor Green
        } else {
            Write-Host "  ✓ Branch is up to date with remote" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  Current branch is: $currentBranch (not replit-agent)" -ForegroundColor Yellow
    Write-Host "  Switch to replit-agent branch to push: git checkout replit-agent" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Remove stale worktrees (optional - uncomment if needed)
Write-Host "Step 3: Checking for stale worktrees..." -ForegroundColor Cyan
Write-Host "  Current worktrees:" -ForegroundColor Yellow
git worktree list

Write-Host ""
Write-Host "  To remove stale worktrees, uncomment these lines:" -ForegroundColor Yellow
Write-Host "  # git worktree remove --force C:/Users/bionic/.cursor/worktrees/ProductifyAI/aT6aP" -ForegroundColor Gray
Write-Host "  # git worktree remove --force C:/Users/bionic/.cursor/worktrees/ProductifyAI/CNTrM" -ForegroundColor Gray
Write-Host ""

# Step 4: Prune worktrees
Write-Host "Step 4: Pruning stale worktree references..." -ForegroundColor Cyan
git worktree prune
Write-Host "  ✓ Pruned stale references" -ForegroundColor Green
Write-Host ""

# Step 5: Final verification
Write-Host "Step 5: Final verification..." -ForegroundColor Cyan
Write-Host "  Worktrees:" -ForegroundColor Yellow
git worktree list
Write-Host ""
Write-Host "  Main branch status:" -ForegroundColor Yellow
git status
Write-Host ""

# Verify workflows exist
Write-Host "  Workflow files:" -ForegroundColor Yellow
if (Test-Path ".github/workflows/build.yml") {
    Write-Host "  ✓ .github/workflows/build.yml exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ .github/workflows/build.yml missing" -ForegroundColor Red
}
if (Test-Path ".github/workflows/uptime.yml") {
    Write-Host "  ✓ .github/workflows/uptime.yml exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ .github/workflows/uptime.yml missing" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Cleanup Complete ===" -ForegroundColor Green

