# How to Restart the Backend Server

## Current Status
✅ **Server is already running** on port 3003 (Process ID: 29632)

## Option 1: Keep Using Current Server (Recommended)
If the server is working fine, you can just use it as-is. The login should work now.

## Option 2: Restart Server (If Needed)

### Step 1: Find and Kill Existing Process
```powershell
# Find the process using port 3003
Get-NetTCPConnection -LocalPort 3003 | Select-Object OwningProcess

# Kill the process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force

# Or kill all Node.js processes (be careful!)
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 2: Start Server Again
```bash
cd backend
npm start
```

## Quick Restart Script

Create a file `restart-server.ps1` in the backend folder:

```powershell
# Kill existing Node.js processes on port 3003
$processes = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($processes) {
    Write-Host "Stopping existing server processes..."
    $processes | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}

# Start the server
Write-Host "Starting server..."
cd backend
npm start
```

Then run: `.\restart-server.ps1`

## Verify Server is Running

```powershell
Test-NetConnection -ComputerName localhost -Port 3003
```

Should return: `TcpTestSucceeded : True`

## Check Server Health

Open in browser: http://localhost:3003/api/health

Should return: `{"status":"ok"}`

