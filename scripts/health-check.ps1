#Requires -Version 7.0
[CmdletBinding()]
param(
    [string]$BaseUrl = $env:API_BASE_URL
)

if (-not $BaseUrl) {
    $BaseUrl = "https://productifyai-api.onrender.com"
}

$healthEndpoint = "$BaseUrl/healthz"

Write-Host "🔍 Checking API health at $healthEndpoint"

try {
    $response = Invoke-WebRequest -Uri $healthEndpoint -UseBasicParsing -TimeoutSec 20
    $status = if ($response.StatusCode -eq 200) { "healthy" } else { "unexpected status $($response.StatusCode)" }
    Write-Host "✅ Health check passed ($status)"
    Write-Output $response.Content
    exit 0
}
catch {
    Write-Error "❌ Health check failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Error "Response body:`n$($reader.ReadToEnd())"
    }
    exit 1
}


