# Test canvas data endpoints
$projectId = "proj_1760522103889"

# Test getting canvas data (should return 404 since no canvas data exists yet)
Write-Host "Testing GET canvas data..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5050/api/ai/projects/$projectId/canvas" -Method GET
    Write-Host "Canvas data found: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "No canvas data found (expected): $($_.Exception.Message)"
}

# Test saving canvas data
Write-Host "`nTesting POST canvas data..."
$canvasData = @{
    canvasData = @{
        version = "5.3.0"
        objects = @(
            @{
                type = "text"
                text = "Test Canvas Data"
                left = 100
                top = 100
                fontSize = 24
                fontFamily = "Arial"
                fill = "#000000"
            }
        )
    }
    isAutoSave = $false
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5050/api/ai/projects/$projectId/canvas" -Method POST -Body $canvasData -ContentType "application/json"
    Write-Host "Canvas data saved successfully: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "Failed to save canvas data: $($_.Exception.Message)"
}

# Test getting the saved canvas data
Write-Host "`nTesting GET saved canvas data..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5050/api/ai/projects/$projectId/canvas" -Method GET
    Write-Host "Retrieved canvas data: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "Failed to get canvas data: $($_.Exception.Message)"
}
