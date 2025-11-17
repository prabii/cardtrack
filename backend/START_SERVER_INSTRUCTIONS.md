# How to Start the Backend Server

## Quick Start

### Option 1: Using npm start (Production mode)
```bash
cd backend
npm start
```

### Option 2: Using npm run dev (Development mode with auto-reload)
```bash
cd backend
npm run dev
```

## Verify Server is Running

After starting the server, you should see:
```
MongoDB Connected: ...
🚀 Server running on port 3003
📊 Health check: http://localhost:3003/api/health
🔌 WebSocket server initialized
```

## Check if Server is Running

### Windows PowerShell:
```powershell
Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
```

### Or check in browser:
Open: http://localhost:3003/api/health

Should return: `{"status":"ok"}`

## Troubleshooting

### Port 3003 Already in Use
If you get an error that port 3003 is already in use:

1. Find the process using port 3003:
```powershell
Get-NetTCPConnection -LocalPort 3003 | Select-Object OwningProcess
```

2. Kill the process (replace PID with actual process ID):
```powershell
Stop-Process -Id <PID> -Force
```

3. Start the server again:
```bash
npm start
```

### MongoDB Connection Error
If you see MongoDB connection errors:
- Check your `.env` file has `MONGODB_URI` set
- Verify MongoDB connection string is correct
- Check internet connection

### Server Won't Start
1. Check Node.js is installed:
```bash
node --version
```

2. Install dependencies:
```bash
npm install
```

3. Check for errors in the console output

## Common Issues

### ERR_CONNECTION_REFUSED
- **Cause:** Backend server is not running
- **Solution:** Start the backend server using `npm start` or `npm run dev`

### Port Already in Use
- **Cause:** Another instance of the server is already running
- **Solution:** Kill the existing process or use a different port

### MongoDB Connection Failed
- **Cause:** Database connection string is incorrect or database is unreachable
- **Solution:** Check `.env` file and MongoDB connection string

## Development vs Production

- **Development (`npm run dev`)**: Uses nodemon for auto-reload on file changes
- **Production (`npm start`)**: Runs node directly, no auto-reload

## Keep Server Running

To keep the server running in the background:
- Use a terminal multiplexer (tmux, screen)
- Use PM2: `npm install -g pm2 && pm2 start server.js`
- Or just keep the terminal window open

