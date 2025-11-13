#Requires -Version 7.0
[CmdletBinding()]
param(
    [string]$BaseUrl = $env:API_BASE_URL,
    [string]$Origin = $env:EXPECTED_FRONTEND_ORIGIN
)

if (-not $BaseUrl) {
    $BaseUrl = "https://productifyai-api.onrender.com"
}

if (-not $Origin) {
    $Origin = "https://productifyai.vercel.app"
}

$success = 0
$failure = 0
$results = @()

function Invoke-Test {
    param(
        [string]$Name,
        [ScriptBlock]$Action
    )

    Write-Host "▶️  $Name"
    try {
        & $Action
        Write-Host "   ✅ Passed"
        return @{ name = $Name; status = "passed" }
    }
    catch {
        Write-Error "   ❌ Failed: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $body = $reader.ReadToEnd()
                if ($body) {
                    Write-Error "   Response body:`n$body"
                }
            } catch {}
        }
        return @{ name = $Name; status = "failed"; error = $_.Exception.Message }
    }
}

$tests = @(
    @{ name = "GET /healthz"; action = {
        $response = Invoke-WebRequest -Uri "$BaseUrl/healthz" -UseBasicParsing -TimeoutSec 20
        if ($response.StatusCode -ne 200) { throw "Expected HTTP 200 but got $($response.StatusCode)" }
    }},
    @{ name = "GET /api/health"; action = {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -UseBasicParsing -TimeoutSec 20
        if ($response.StatusCode -ne 200) { throw "Expected HTTP 200 but got $($response.StatusCode)" }
    }},
    @{ name = "GET /api/v2/ai/health"; action = {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/v2/ai/health" -UseBasicParsing -TimeoutSec 20
        if ($response.StatusCode -ne 200) { throw "Expected HTTP 200 but got $($response.StatusCode)" }
    }},
    @{ name = "HEAD /"; action = {
        $response = Invoke-WebRequest -Uri $BaseUrl -Method Head -TimeoutSec 20
        if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) { throw "Unexpected status $($response.StatusCode)" }
    }},
    @{ name = "Static asset check /public/index.html"; action = {
        if (-not (Test-Path -Path "dist/public/index.html")) {
            throw "dist/public/index.html not found. Run npm run build first."
        }
    }},
    @{ name = "Server bundle check dist/server.js"; action = {
        if (-not (Test-Path -Path "dist/server.js")) {
            throw "dist/server.js not found. Run npm run build first."
        }
    }},
    @{ name = "CORS preflight"; action = {
        & "$PSScriptRoot/cors-test.ps1" -BaseUrl $BaseUrl -Origin $Origin
    }},
    @{ name = "Health script smoke test"; action = {
        & "$PSScriptRoot/health-check.ps1" -BaseUrl $BaseUrl | Out-Null
    }},
    @{ name = "Secrets scan script dry-run"; action = {
        if (-not (Test-Path -Path "$PSScriptRoot/secrets-scan.mjs")) {
            throw "scripts/secrets-scan.mjs not found. Run npm run scan:secrets separately."
        }
    }},
    @{ name = "PDF export dry-run"; action = {
        $tempFile = Join-Path $env:TEMP ("pdf-dry-run-" + [guid]::NewGuid().ToString() + ".ts")
        @"
import { generateBlocksPDF } from '../server/blocks-pdf-export';

const data = {
  projectTitle: 'PDF Smoke Test',
  pages: [{
    id: 'page-1',
    title: 'Sample Page',
    blocks: [{
      id: 'block-1',
      type: 'paragraph',
      order: 1,
      content: { text: 'This is a PDF smoke test.' }
    }]
  }]
};

const run = async () => {
  const buffer = await generateBlocksPDF(data);
  if (!buffer || !(buffer instanceof Uint8Array)) {
    throw new Error('generateBlocksPDF did not return a Uint8Array');
  }
};

run();
"@ | Set-Content -Path $tempFile -Encoding UTF8

        try {
            $command = "npx --yes tsx $tempFile"
            Write-Host "   Running: $command"
            $process = Start-Process -FilePath "npx" -ArgumentList "--yes","tsx",$tempFile -NoNewWindow -Wait -PassThru
            if ($process.ExitCode -ne 0) {
                throw "PDF generation script exited with code $($process.ExitCode)"
            }
        }
        finally {
            Remove-Item -Path $tempFile -ErrorAction SilentlyContinue
        }
    }},
    @{ name = "Origin formatting validation"; action = {
        $cors = $env:CORS_ORIGIN
        if ($cors -and $cors -match "\s") {
            throw "CORS_ORIGIN contains whitespace: '$cors'"
        }
    }},
    @{ name = "Version metadata check"; action = {
        $packageJson = Get-Content package.json | Out-String | ConvertFrom-Json
        if (-not $packageJson.version) {
            throw "package.json missing version field"
        }
    }}
)

foreach ($test in $tests) {
    $result = Invoke-Test -Name $test.name -Action $test.action
    if ($result.status -eq "passed") { $success++ } else { $failure++ }
    $results += $result
}

Write-Host "==============================="
Write-Host "✅ Passed: $success"
Write-Host "❌ Failed: $failure"
Write-Host "==============================="

if ($failure -gt 0) {
    exit 1
}

exit 0


