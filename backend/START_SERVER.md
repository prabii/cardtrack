# Starting the Backend Server

## ✅ Dependencies Installed!

The npm dependencies have been successfully installed. You can now start the server.

## 🚀 Start the Server

### Option 1: Using npm (Recommended)
```powershell
npm start
```

### Option 2: Using node directly
```powershell
node server.js
```

## 🔍 Check Server Status

After starting the server, you should see:
```
🚀 Server running on port 5000
✅ MongoDB connected
```

## ⚠️ Common Issues

### Issue 1: MongoDB Connection Error
**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env` file
- If using MongoDB Atlas, check your connection string

### Issue 2: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
- Stop any other process using port 5000
- Or change the PORT in your `.env` file

### Issue 3: Missing Environment Variables
**Error:** `JWT_SECRET is required`

**Solution:**
- Create a `.env` file in the backend directory
- Add required variables:
  ```
  MONGODB_URI=your_mongodb_connection_string
  JWT_SECRET=your_jwt_secret_key
  PORT=5000
  NODE_ENV=development
  ```

## 📝 Quick Check Script

Run this to check if server is running:
```powershell
.\check-server.ps1
```

## ✅ Success Indicators

When the server starts successfully, you'll see:
- ✅ Server running message
- ✅ MongoDB connected message
- ✅ No error messages
- ✅ Can access http://localhost:5000/api/health

---

**Next Step:** Once the server is running, start the frontend in a new terminal window.

