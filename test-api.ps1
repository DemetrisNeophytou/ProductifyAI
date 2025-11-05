$body = @{
  topic = "productivity techniques"
  type = "ebook"
  audience = "remote workers"
  tone = "professional"
  goal = "educate and inform"
  userId = "demo-user"
}

Invoke-RestMethod -Uri "http://localhost:5050/api/ai/generate" -Method POST -Body ($body | ConvertTo-Json) -ContentType "application/json" | ConvertTo-Json -Depth 5
