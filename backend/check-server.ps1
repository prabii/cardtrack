# Quick server status check script

Write-Host "🔍 Checking server status..." -ForegroundColor Cyan
Write-Host ""

# Check if server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend server is running on port 5000" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Backend server is not responding" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "1. Server is still starting (wait a few seconds)" -ForegroundColor White
    Write-Host "2. Server failed to start (check console for errors)" -ForegroundColor White
    Write-Host "3. MongoDB connection issue" -ForegroundColor White
    Write-Host "4. Port 5000 is already in use" -ForegroundColor White
    Write-Host ""
    Write-Host "To start the server, run:" -ForegroundColor Cyan
    Write-Host "   npm start" -ForegroundColor White
}

Write-Host ""
Write-Host "To view server logs, check the terminal where you ran 'npm start'" -ForegroundColor Gray

