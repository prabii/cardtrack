# Vercel Environment Variables Setup

To fix gateway and preprocessing issues in the deployed Vercel version, you need to set the following environment variables in your Vercel project settings.

## Required Environment Variables

### 1. API Base URL
**Variable Name:** `VITE_API_URL`  
**Value:** `https://cardtrack.onrender.com/api`  
**Description:** The base URL for your backend API. This ensures all API calls go to the correct backend server.

### 2. Socket URL (Optional)
**Variable Name:** `VITE_SOCKET_URL`  
**Value:** `https://cardtrack.onrender.com`  
**Description:** The URL for Socket.IO connections. If not set, it will default based on the API URL.

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   ```
   VITE_API_URL = https://cardtrack.onrender.com/api
   VITE_SOCKET_URL = https://cardtrack.onrender.com
   ```

4. Make sure to set them for:
   - **Production**
   - **Preview** (if you want them for preview deployments)
   - **Development** (optional, for local testing)

5. After adding the variables, **redeploy** your application:
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Select **Redeploy**

## Verification

After redeploying, check the browser console. You should see logs like:
```
[API Config] Environment: production
[API Config] Hostname: your-app.vercel.app
[API Config] API Base URL: https://cardtrack.onrender.com/api
[API Config] Socket URL: https://cardtrack.onrender.com
[API Config] VITE_API_URL: https://cardtrack.onrender.com/api
```

## Troubleshooting

### If Gateway Still Doesn't Work:
1. Check browser console for API errors
2. Verify backend is accessible: `https://cardtrack.onrender.com/api/gateways`
3. Check CORS settings on backend
4. Verify authentication tokens are being sent correctly

### If Preprocessing Still Doesn't Work:
1. Check browser console for upload/process errors
2. Verify backend endpoint: `https://cardtrack.onrender.com/api/statements`
3. Check file upload size limits
4. Verify backend has necessary PDF processing libraries installed

## Backend Requirements

Make sure your backend (Render) has:
- ✅ CORS enabled for your Vercel domain
- ✅ PDF processing libraries (pdf-parse, pdf-poppler, etc.)
- ✅ File upload handling configured
- ✅ Proper error handling and logging

## Testing Locally

To test with production API locally, create a `.env.local` file:
```
VITE_API_URL=https://cardtrack.onrender.com/api
VITE_SOCKET_URL=https://cardtrack.onrender.com
```

Then restart your dev server.

