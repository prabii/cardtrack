# Backend Deployment Checklist for Render

## Issues Fixed

### 1. Bank Model Query Fix
- **Issue:** `statementProcessor.js` was querying Bank with `isDeleted: false`, but Bank model doesn't have this field
- **Fix:** Removed `isDeleted: false` filter from all Bank queries
- **Files Changed:** `backend/services/statementProcessor.js`

### 2. Gateway Routes
- **Status:** Routes are properly defined and exported
- **File:** `backend/routes/gateways.js` - exports router correctly
- **Note:** If getting 404, ensure backend is deployed with latest code

### 3. Bank Summary Service
- **Status:** No `bank.getPublicInfo()` calls found in current code
- **Note:** If error persists, it may be from old deployed code

## Deployment Steps

1. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Check Environment Variables**
   - `MONGODB_URI` - MongoDB connection string
   - `JWT_SECRET` - JWT secret key
   - `JWT_REFRESH_SECRET` - JWT refresh secret
   - `PORT` - Server port (default: 3003)
   - `NODE_ENV` - Set to `production`

4. **Verify PDF Processing Libraries**
   - `pdf-parse` - Should be in package.json
   - `pdf-poppler` - May require system dependencies on Render
   - Check Render logs for PDF processing errors

5. **Redeploy on Render**
   - Go to Render dashboard
   - Click "Manual Deploy" → "Deploy latest commit"
   - Monitor deployment logs for errors

6. **Test Endpoints**
   - Health check: `GET https://cardtrack.onrender.com/api/health`
   - Gateways: `GET https://cardtrack.onrender.com/api/gateways` (requires auth)
   - Bank summaries: `GET https://cardtrack.onrender.com/api/bank-summaries/overall/summary` (requires auth)

## Common Issues

### Gateway 404 Error
- **Cause:** Backend not deployed or routes not registered
- **Solution:** Redeploy backend on Render
- **Check:** Verify route registration in `server.js` line 194

### Bank Summary 500 Error
- **Cause:** Old code calling `bank.getPublicInfo()` or Bank queries with `isDeleted`
- **Solution:** Redeploy with latest code
- **Check:** Verify `backend/services/bankSummaryService.js` and `backend/services/statementProcessor.js`

### Statement Processing Returns 0 Transactions
- **Cause:** PDF processing libraries not available or PDF parsing failing
- **Solution:** 
  1. Check Render logs for PDF processing errors
  2. Verify `pdf-parse` and `pdf-poppler` are installed
  3. Check if PDF file is accessible on Render filesystem
  4. Verify Bank queries are working (fixed `isDeleted` issue)

### PDF Processing Libraries on Render
Render may need system dependencies for `pdf-poppler`. If PDF processing fails:
1. Check Render build logs for missing dependencies
2. Consider using only `pdf-parse` if `pdf-poppler` isn't available
3. Add build commands if needed in Render settings

## Verification

After deployment, check:
- [ ] Health endpoint returns 200
- [ ] Gateway endpoint returns gateways list (not 404)
- [ ] Bank summaries endpoint returns data (not 500)
- [ ] Statement upload works
- [ ] Statement processing extracts transactions
- [ ] Reprocess finds transactions

## Logs to Check

Monitor Render logs for:
- Database connection errors
- PDF processing errors
- Route registration messages
- CORS errors
- Authentication errors
