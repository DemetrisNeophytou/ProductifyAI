# Update Supabase Environment Variables
# Run this script to configure your .env file for Supabase authentication

Write-Host "🔧 Supabase Environment Configuration" -ForegroundColor Cyan
Write-Host ""

# Supabase Project ID
$SUPABASE_PROJECT = "dfqssnvqsxjjtyhylzen"
$SUPABASE_URL = "https://$SUPABASE_PROJECT.supabase.co"

Write-Host "📍 Supabase Project: $SUPABASE_PROJECT" -ForegroundColor Green
Write-Host "🔗 Dashboard: https://supabase.com/dashboard/project/$SUPABASE_PROJECT/settings/api" -ForegroundColor Yellow
Write-Host ""

# Prompt for keys
Write-Host "Please provide your Supabase credentials:" -ForegroundColor Cyan
Write-Host "(Get them from the dashboard link above)" -ForegroundColor Gray
Write-Host ""

$ANON_KEY = Read-Host "Enter ANON (public) key"
$SERVICE_KEY = Read-Host "Enter SERVICE_ROLE key"
$DB_PASSWORD = Read-Host "Enter Database Password (starts with Dn17107...)"

# Validate inputs
if ([string]::IsNullOrWhiteSpace($ANON_KEY) -or $ANON_KEY -eq "your_supabase_anon_key_here") {
    Write-Host "❌ Invalid anon key provided" -ForegroundColor Red
    exit 1
}

# Read current .env
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    
    # Update Supabase URLs
    $envContent = $envContent -replace 'VITE_SUPABASE_URL=.*', "VITE_SUPABASE_URL=$SUPABASE_URL"
    $envContent = $envContent -replace 'SUPABASE_URL=https://your-project\.supabase\.co', "SUPABASE_URL=$SUPABASE_URL"
    
    # Update keys
    $envContent = $envContent -replace 'VITE_SUPABASE_ANON_KEY=.*', "VITE_SUPABASE_ANON_KEY=$ANON_KEY"
    $envContent = $envContent -replace 'SUPABASE_SERVICE_ROLE_KEY=.*', "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY"
    
    # Update database URL if password provided
    if (-not [string]::IsNullOrWhiteSpace($DB_PASSWORD)) {
        $DB_URL = "postgresql://postgres:$DB_PASSWORD@db.$SUPABASE_PROJECT.supabase.co:5432/postgres"
        $envContent = $envContent -replace 'DATABASE_URL=.*', "DATABASE_URL=$DB_URL"
    }
    
    # Save updated .env
    $envContent | Set-Content ".env" -NoNewline
    
    Write-Host ""
    Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Updated values:" -ForegroundColor Cyan
    Write-Host "  VITE_SUPABASE_URL=$SUPABASE_URL" -ForegroundColor Gray
    Write-Host "  VITE_SUPABASE_ANON_KEY=$($ANON_KEY.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "  SUPABASE_URL=$SUPABASE_URL" -ForegroundColor Gray
    Write-Host "  SUPABASE_SERVICE_ROLE_KEY=$($SERVICE_KEY.Substring(0, 20))..." -ForegroundColor Gray
    if (-not [string]::IsNullOrWhiteSpace($DB_PASSWORD)) {
        Write-Host "  DATABASE_URL=postgresql://postgres:***@db.$SUPABASE_PROJECT.supabase.co:5432/postgres" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "🚀 Next step: npm run dev:force" -ForegroundColor Yellow
    
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Run: cp env.example .env" -ForegroundColor Yellow
    exit 1
}

