# 🚀 Render Deployment Guide for CardTracker Pro Backend

## **Prerequisites**
- Render account (free tier available)
- MongoDB Atlas account
- Email service (SendGrid recommended)

## **Step 1: Prepare Your Code**

### **1.1 Update CORS for Production**
Edit `backend/server.js` and update the CORS origins:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Development
    'http://localhost:5174',  // Development
    'https://your-frontend-domain.com',  // Production frontend
    'https://your-frontend-domain.vercel.app',  // If using Vercel
    'https://your-frontend-domain.netlify.app',  // If using Netlify
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### **1.2 Environment Variables Setup**
You'll need to set these in Render dashboard:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/cardtracker_pro
JWT_SECRET=your-super-secure-production-jwt-secret-key-change-this-12345
FRONTEND_URL=https://your-frontend-domain.com
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
EMAIL_FROM=noreply@yourdomain.com
```

## **Step 2: Deploy to Render**

### **2.1 Create New Web Service**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `backend` folder as root directory

### **2.2 Configure Service Settings**
- **Name**: `cardtracker-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### **2.3 Set Environment Variables**
In Render dashboard, go to **Environment** tab and add:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Render's default port |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas URI |
| `JWT_SECRET` | `your-secret-key` | Secure JWT secret |
| `FRONTEND_URL` | `https://your-domain.com` | Your frontend URL |
| `SENDGRID_API_KEY` | `SG.xxx` | SendGrid API key |
| `EMAIL_FROM` | `noreply@yourdomain.com` | Sender email |

### **2.4 Advanced Settings**
- **Auto-Deploy**: `Yes` (deploys on git push)
- **Health Check Path**: `/api/health`
- **Plan**: `Free` (or upgrade as needed)

## **Step 3: MongoDB Atlas Setup**

### **3.1 Create MongoDB Atlas Account**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account
3. Create new cluster (free tier available)

### **3.2 Configure Database Access**
1. Go to **Database Access**
2. Add new database user
3. Set username and password
4. Grant **Read and write** permissions

### **3.3 Configure Network Access**
1. Go to **Network Access**
2. Add IP address: `0.0.0.0/0` (allow all IPs for Render)
3. Or add Render's IP ranges

### **3.4 Get Connection String**
1. Go to **Clusters** → **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `cardtracker_pro`

## **Step 4: Email Service Setup (SendGrid)**

### **4.1 Create SendGrid Account**
1. Go to [SendGrid](https://sendgrid.com)
2. Sign up for free account (100 emails/day)
3. Verify your email

### **4.2 Get API Key**
1. Go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Choose **"Restricted Access"**
4. Give **"Mail Send"** permissions
5. Copy the API key (starts with `SG.`)

### **4.3 Verify Sender Identity**
1. Go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Add your domain email
4. Verify the email

## **Step 5: Deploy and Test**

### **5.1 Deploy to Render**
1. Click **"Create Web Service"** in Render
2. Wait for deployment to complete
3. Check logs for any errors

### **5.2 Test Your API**
Your API will be available at:
```
https://cardtracker-backend.onrender.com
```

Test endpoints:
- Health check: `GET /api/health`
- Auth: `POST /api/auth/login`
- Users: `GET /api/users`

### **5.3 Update Frontend**
Update your frontend's API URL to:
```javascript
const API_URL = 'https://cardtracker-backend.onrender.com';
```

## **Step 6: Monitoring and Maintenance**

### **6.1 Monitor Logs**
- Go to Render dashboard
- Click on your service
- Check **Logs** tab for errors

### **6.2 Health Monitoring**
- Render automatically monitors `/api/health`
- Service restarts if health check fails
- Check **Metrics** tab for performance

### **6.3 Database Monitoring**
- Monitor MongoDB Atlas dashboard
- Check connection usage
- Set up alerts for high usage

## **Troubleshooting**

### **Common Issues:**

#### **Build Failures**
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Check build logs in Render dashboard

#### **Runtime Errors**
- Check environment variables
- Verify MongoDB connection
- Check email service configuration

#### **CORS Errors**
- Update CORS origins in server.js
- Add your frontend domain
- Test with different browsers

#### **Database Connection Issues**
- Verify MongoDB Atlas network access
- Check connection string format
- Ensure database user has correct permissions

### **Performance Optimization:**

#### **Free Tier Limitations**
- Render free tier has limitations
- Service sleeps after 15 minutes of inactivity
- Consider upgrading for production use

#### **Database Optimization**
- Use MongoDB indexes
- Optimize queries
- Monitor connection usage

## **Security Checklist**

- [ ] Use strong JWT secret
- [ ] Enable HTTPS (automatic on Render)
- [ ] Restrict CORS origins
- [ ] Use environment variables for secrets
- [ ] Monitor access logs
- [ ] Regular security updates

## **Cost Estimation**

### **Render Pricing:**
- **Free Tier**: $0/month (with limitations)
- **Starter**: $7/month (always on)
- **Standard**: $25/month (better performance)

### **MongoDB Atlas:**
- **Free Tier**: 512MB storage
- **M2**: $9/month (2GB storage)
- **M5**: $25/month (5GB storage)

### **SendGrid:**
- **Free**: 100 emails/day
- **Essentials**: $14.95/month (40k emails)

## **Next Steps**

1. **Deploy Backend** to Render
2. **Test API endpoints** thoroughly
3. **Deploy Frontend** to Vercel/Netlify
4. **Update API URLs** in frontend
5. **Test full application** end-to-end
6. **Set up monitoring** and alerts

## **Support**

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **SendGrid Docs**: https://docs.sendgrid.com

---

**Your CardTracker Pro backend will be live on Render! 🎉**
