#Requires -Version 7.0
[CmdletBinding()]
param(
    [string]$BaseUrl = $env:API_BASE_URL,
    [string]$Origins = $env:EXPECTED_FRONTEND_ORIGINS
)

if (-not $BaseUrl) {
    $BaseUrl = "https://productifyai-api.onrender.com"
}

if (-not $Origins) {
    $Origins = "http://localhost:5173,https://productifyai.vercel.app"
}

$endpoint = "$BaseUrl/healthz"
$originList = $Origins.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }

foreach ($origin in $originList) {
    Write-Host "🔐 Testing CORS preflight against $endpoint"
    Write-Host "   Origin: $origin"

    $headers = @{
        "Origin" = $origin
        "Access-Control-Request-Method" = "GET"
    }

    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method Options -Headers $headers -UseBasicParsing -TimeoutSec 20
        $allowOrigin = $response.Headers["Access-Control-Allow-Origin"]
        if ($allowOrigin -and ($allowOrigin -eq $origin -or $allowOrigin -eq "*")) {
            Write-Host "   ✅ Access-Control-Allow-Origin=$allowOrigin"
        } else {
            Write-Error "❌ CORS preflight returned unexpected origin header: '$allowOrigin'"
            exit 2
        }
    }
    catch {
        Write-Error "❌ CORS preflight failed: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Error "Response body:`n$($reader.ReadToEnd())"
        }
        exit 1
    }
}

Write-Host "✅ All origins passed CORS preflight checks"
exit 0


