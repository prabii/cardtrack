# CardTracker Pro Backend Deployment Script for Windows PowerShell

Write-Host "🚀 Starting CardTracker Pro Backend Deployment..." -ForegroundColor Cyan

# Check if we're in the backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the backend directory" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js is not installed" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: npm is not installed" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Check if server.js exists
if (-not (Test-Path "server.js")) {
    Write-Host "❌ Error: server.js not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ server.js found" -ForegroundColor Green

# Check if required environment variables are set (for production)
if ($env:NODE_ENV -eq "production") {
    Write-Host "🔍 Checking production environment variables..." -ForegroundColor Yellow
    
    $requiredVars = @("MONGODB_URI", "JWT_SECRET", "PORT")
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if (-not $env:$var) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "❌ Error: Missing required environment variables:" -ForegroundColor Red
        $missingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        Write-Host "Please set these variables in your environment" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ All required environment variables are set" -ForegroundColor Green
}

Write-Host "🎉 CardTracker Pro Backend is ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Set environment variables (if not already set)"
Write-Host "2. Run: npm start"
Write-Host "3. Or run: node server.js"
Write-Host ""

