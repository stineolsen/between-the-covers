# 📚 Between The Covers - Deployment Guide

This guide will walk you through deploying your bookclub webapp to production.

## 🎯 Deployment Overview

- **Frontend**: Vercel
- **Backend**: Railway (recommended) or Render
- **Database**: MongoDB Atlas

> **Why Railway for backend?** Your app uses file uploads (`multer`) for book covers and avatars. Railway provides persistent storage, while Vercel serverless functions are ephemeral.

---

## 📋 Prerequisites

Before starting, make sure you have accounts on:
- [Vercel](https://vercel.com) (for frontend)
- [Railway](https://railway.app) or [Render](https://render.com) (for backend)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (for database)

---

## Step 1: Set Up MongoDB Atlas (Database)

### 1.1 Create a MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new project (e.g., "BookClub")

### 1.2 Create a Database Cluster
1. Click "Build a Database"
2. Choose **M0 Free tier** (perfect for getting started)
3. Select a cloud provider and region (choose one closest to your users)
4. Name your cluster (e.g., "bookclub-cluster")
5. Click "Create Cluster" (takes 3-5 minutes)

### 1.3 Configure Database Access
1. In the left sidebar, click **Database Access**
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `bookclub-admin` (or your choice)
5. **IMPORTANT**: Click "Autogenerate Secure Password" and **save this password**
6. User Privileges: Choose "Atlas admin" or "Read and write to any database"
7. Click "Add User"

### 1.4 Configure Network Access
1. In the left sidebar, click **Network Access**
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (or add specific IPs)
4. Click "Confirm"

### 1.5 Get Your Connection String
1. Click "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: **Node.js**, Version: **6.8 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://bookclub-admin:<password>@bookclub-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace `<password>`** with the password you saved earlier
7. **Save this connection string** - you'll need it for the backend

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub (recommended for easy deployment)

### 2.2 Create a New Project
1. Click "New Project"
2. Choose "Deploy from GitHub repo"
3. Connect your GitHub account if not already connected
4. Select your repository
5. Railway will auto-detect your backend

### 2.3 Configure Root Directory
Since your backend is in a subdirectory:
1. Click on your service
2. Go to **Settings**
3. Find "Root Directory"
4. Set it to: `backend`
5. Click "Save"

### 2.4 Add Environment Variables
1. Go to the **Variables** tab
2. Add the following variables:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://bookclub-admin:<your-password>@bookclub-cluster.xxxxx.mongodb.net/bookclub?retryWrites=true&w=majority
JWT_SECRET=<generate-a-random-secret-key>
JWT_EXPIRE=7d
FRONTEND_URL=https://your-app-name.vercel.app
```

**Important Notes:**
- Replace `MONGODB_URI` with your MongoDB Atlas connection string from Step 1.5
- For `JWT_SECRET`, generate a random string (32+ characters). You can use: `openssl rand -base64 32` or an online generator
- `FRONTEND_URL` will be your Vercel frontend URL (you'll update this in Step 3)

### 2.5 Deploy
1. Railway will automatically deploy when you push to GitHub
2. Or click "Deploy" manually
3. Wait for deployment to complete
4. **Copy your backend URL** (e.g., `https://your-app.railway.app`)

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [Vercel](https://vercel.com/signup)
2. Sign up with GitHub (recommended)

### 3.2 Import Your Repository
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Add Environment Variable
1. In "Environment Variables" section
2. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: Your Railway backend URL from Step 2.5 (e.g., `https://your-app.railway.app`)
   - Select all environments (Production, Preview, Development)

### 3.4 Deploy
1. Click "Deploy"
2. Wait for deployment to complete (1-2 minutes)
3. **Copy your frontend URL** (e.g., `https://your-app.vercel.app`)

### 3.5 Update Backend Environment Variable
1. Go back to Railway
2. Update the `FRONTEND_URL` variable with your Vercel URL
3. Railway will automatically redeploy

---

## Step 4: Create Your Admin User

### Option A: Using the Seed Script (Recommended)

1. Connect to your Railway backend terminal:
   - Go to Railway dashboard
   - Click on your service
   - Click "Connect" or use Railway CLI: `railway run`

2. Run the seed script:
   ```bash
   npm run seed:admin
   ```

3. The script will create an admin user:
   - **Email**: `admin@bookclub.com`
   - **Password**: `admin123`
   - **Username**: `admin`

4. **IMPORTANT**: Log in immediately and change the password!

### Option B: Manual Creation via MongoDB Atlas

1. Go to MongoDB Atlas → Database → Browse Collections
2. Find the `users` collection
3. Click "Insert Document"
4. Add this document (change values as needed):

```json
{
  "username": "admin",
  "email": "your-email@example.com",
  "password": "$2b$10$...",
  "displayName": "Admin User",
  "role": "admin",
  "status": "approved",
  "createdAt": { "$date": "2024-01-01T00:00:00.000Z" }
}
```

Note: The password needs to be bcrypt hashed. Use the seed script (Option A) instead for simplicity.

---

## Step 5: Test Your Deployment

### 5.1 Test Frontend
1. Visit your Vercel URL
2. You should see the homepage

### 5.2 Test Backend Connection
1. Try registering a new user
2. Log in with your admin account (`admin@bookclub.com` / `admin123`)
3. Change the admin password in Profile settings

### 5.3 Test File Uploads
1. As admin, try adding a new book with a cover image
2. Verify the image displays correctly

---

## 🔒 Post-Deployment Security

### Change Default Admin Password
1. Log in as admin
2. Go to Profile → Change Password
3. Use a strong, unique password

### Update JWT Secret
Make sure your `JWT_SECRET` in Railway is a strong random string (32+ characters).

### Review CORS Settings
In `backend/src/app.js`, verify CORS is configured to only allow your Vercel frontend:
```javascript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
})
```

---

## 🔄 Continuous Deployment

Both Railway and Vercel support automatic deployments:

- **Push to main branch** → Automatic deployment
- **Push to other branches** → Preview deployments (Vercel)

---

## 📝 Environment Variables Reference

### Backend (Railway)
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (Vercel)
```bash
VITE_API_URL=https://your-app.railway.app
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Verify MongoDB connection string is correct
- Ensure all environment variables are set

### Frontend can't connect to backend
- Check `VITE_API_URL` in Vercel settings
- Verify CORS settings in backend
- Check browser console for errors

### File uploads not working
- Verify Railway has persistent storage enabled
- Check file size limits (default 5MB in your app)
- Review backend logs during upload

### Admin user creation failed
- Check MongoDB Atlas network access allows Railway IPs
- Verify database user credentials are correct
- Run seed script with Railway CLI for better error messages

---

## 🎉 You're Done!

Your bookclub webapp is now live! Here's what you can do next:

1. ✅ Change admin password
2. ✅ Add your first books
3. ✅ Invite members
4. ✅ Create your first meeting
5. ✅ Share the site with your book club!

---

## 📞 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas

---

**Note**: If you have any custom domain, you can add it in Vercel (frontend) and update the environment variables accordingly.
