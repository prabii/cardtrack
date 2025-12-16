# Vercel Environment Variables Setup

To fix gateway and preprocessing issues in the deployed Vercel version, you need to set the following environment variables in your Vercel project settings.

## Required Environment Variables

### 1. API Base URL
**Variable Name:** `VITE_API_URL`  
**Value:** `https://84.247.136.87/api`  
**Description:** The base URL for your backend API on VPS. This ensures all API calls go to the correct backend server.

### 2. Socket URL (Optional)
**Variable Name:** `VITE_SOCKET_URL`  
**Value:** `https://84.247.136.87`  
**Description:** The URL for Socket.IO connections. If not set, it will default based on the API URL.

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   ```
   VITE_API_URL = https://84.247.136.87/api
   VITE_SOCKET_URL = https://84.247.136.87
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
[API Config] API Base URL: https://84.247.136.87/api
[API Config] Socket URL: https://84.247.136.87
[API Config] VITE_API_URL: https://84.247.136.87/api
```

## Troubleshooting

### If Gateway Still Doesn't Work:
1. Check browser console for API errors
2. Verify backend is accessible: `https://84.247.136.87/api/gateways`
3. Check CORS settings on backend
4. Verify authentication tokens are being sent correctly

### If Preprocessing Still Doesn't Work:
1. Check browser console for upload/process errors
2. Verify backend endpoint: `https://84.247.136.87/api/statements`
3. Check file upload size limits
4. Verify backend has necessary PDF processing libraries installed

## Backend Requirements

Make sure your backend (VPS) has:
- ✅ CORS enabled for your Vercel domain
- ✅ PDF processing libraries (pdf-parse, pdf-poppler, etc.)
- ✅ File upload handling configured
- ✅ Proper error handling and logging

## Testing Locally

To test with production API locally, create a `.env.local` file:
```
VITE_API_URL=https://84.247.136.87/api
VITE_SOCKET_URL=https://84.247.136.87
```

Then restart your dev server.

