#Requires -Version 7.0
[CmdletBinding()]
param(
    [string]$Expected = $env:EXPECTED_OAUTH_REDIRECTS,
    [string]$Actual = $env:OAUTH_REDIRECT_URIS
)

if (-not $Expected) {
    $Expected = "http://localhost:5173/auth/callback/google,https://productifyai.vercel.app/auth/callback/google"
}

if (-not $Actual) {
    $Actual = $Expected
}

function Normalize-List {
    param([string]$Value)
    return $Value.Split(',') |
        ForEach-Object { $_.TrimEnd('/').Trim() } |
        Where-Object { $_ } |
        Sort-Object -Unique
}

$expectedList = Normalize-List -Value $Expected
$actualList = Normalize-List -Value $Actual

if (@($expectedList) -ceq @($actualList)) {
    Write-Host "✅ OAuth redirect URIs match expected list:"
    $expectedList | ForEach-Object { Write-Host "  $_" }
    exit 0
}

Write-Error "❌ OAuth redirect URIs mismatch!"
Write-Host "Expected:"
$expectedList | ForEach-Object { Write-Host "  $_" }
Write-Host "Actual:"
$actualList | ForEach-Object { Write-Host "  $_" }
exit 1


