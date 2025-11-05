Write-Host "Cleaning Cursor worktrees..." -ForegroundColor Cyan
git worktree prune
git fetch --prune

$wt = git worktree list
$paths = $wt | % { ($_ -split ' ')[0] }

foreach ($p in $paths) {
  if ($p -like "*\.cursor\worktrees\*") {
    git worktree remove --force "$p" 2>$null
    Write-Host "Removed: $p"
  }
}

Write-Host "Done."

