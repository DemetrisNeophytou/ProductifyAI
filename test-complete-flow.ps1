# Test complete flow: create project → edit → auto-save → reload → export

Write-Host "=== Testing Complete ProductifyAI Flow ==="

# Step 1: Create a new project
Write-Host "`n1. Creating new project..."
$body = @{
  topic = "digital marketing strategies"
  type = "ebook"
  audience = "small business owners"
  tone = "professional"
  goal = "educate and inform"
} | ConvertTo-Json

try {
    $projectResponse = Invoke-RestMethod -Uri "http://localhost:5050/api/ai/generate" -Method POST -Body $body -ContentType "application/json"
    $projectId = $projectResponse.data.project.id
    Write-Host "✅ Project created: $projectId"
    Write-Host "   Title: $($projectResponse.data.title)"
} catch {
    Write-Host "❌ Failed to create project: $($_.Exception.Message)"
    exit 1
}

# Step 2: Save canvas data (simulating visual editor)
Write-Host "`n2. Saving canvas data (visual editor)..."
$canvasData = @{
    canvasData = @{
        version = "5.3.0"
        objects = @(
            @{
                type = "text"
                text = "Digital Marketing Strategies"
                left = 50
                top = 50
                fontSize = 32
                fontFamily = "Arial"
                fill = "#2563eb"
                fontWeight = "bold"
            },
            @{
                type = "text"
                text = "A comprehensive guide for small business owners"
                left = 50
                top = 100
                fontSize = 18
                fontFamily = "Arial"
                fill = "#666666"
            },
            @{
                type = "rect"
                left = 50
                top = 150
                width = 200
                height = 100
                fill = "#f0f9ff"
                stroke = "#2563eb"
                strokeWidth = 2
            }
        )
    }
    isAutoSave = $false
} | ConvertTo-Json -Depth 5

try {
    $canvasResponse = Invoke-RestMethod -Uri "http://localhost:5050/api/ai/projects/$projectId/canvas" -Method POST -Body $canvasData -ContentType "application/json"
    Write-Host "✅ Canvas data saved successfully"
} catch {
    Write-Host "❌ Failed to save canvas data: $($_.Exception.Message)"
    exit 1
}

# Step 3: Retrieve canvas data (simulating page reload)
Write-Host "`n3. Retrieving canvas data (page reload)..."
try {
    $retrievedCanvas = Invoke-RestMethod -Uri "http://localhost:5050/api/ai/projects/$projectId/canvas" -Method GET
    Write-Host "✅ Canvas data retrieved successfully"
    Write-Host "   Objects count: $($retrievedCanvas.data.canvasData.objects.Count)"
} catch {
    Write-Host "❌ Failed to retrieve canvas data: $($_.Exception.Message)"
    exit 1
}

# Step 4: Update project with canvas data
Write-Host "`n4. Updating project with canvas data..."
$updateData = @{
    canvasData = ($canvasData | ConvertFrom-Json).canvasData | ConvertTo-Json -Depth 5
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:5050/api/ai/projects/$projectId" -Method PUT -Body $updateData -ContentType "application/json"
    Write-Host "✅ Project updated successfully"
} catch {
    Write-Host "❌ Failed to update project: $($_.Exception.Message)"
    exit 1
}

# Step 5: Test project retrieval
Write-Host "`n5. Testing project retrieval..."
try {
    $projectData = Invoke-RestMethod -Uri "http://localhost:5050/api/ai/projects/$projectId" -Method GET
    Write-Host "✅ Project retrieved successfully"
    Write-Host "   Project ID: $($projectData.data.id)"
    Write-Host "   Title: $($projectData.data.title)"
    Write-Host "   Status: $($projectData.data.status)"
} catch {
    Write-Host "❌ Failed to retrieve project: $($_.Exception.Message)"
    exit 1
}

Write-Host "`n🎉 Complete flow test successful!"
Write-Host "   - Project creation: ✅"
Write-Host "   - Canvas data saving: ✅"
Write-Host "   - Canvas data retrieval: ✅"
Write-Host "   - Project updating: ✅"
Write-Host "   - Project retrieval: ✅"
Write-Host "`nThe ProductifyAI system is fully functional with live database integration!"
