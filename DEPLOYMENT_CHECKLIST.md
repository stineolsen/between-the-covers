# 🚀 Quick Deployment Checklist

Use this checklist to deploy your bookclub app step by step.

## ☐ 1. MongoDB Atlas Setup (15 minutes)

- [ ] Create MongoDB Atlas account
- [ ] Create free M0 cluster
- [ ] Create database user and save password
- [ ] Allow network access from anywhere (0.0.0.0/0)
- [ ] Get connection string
- [ ] Replace `<password>` in connection string with your actual password
- [ ] Save connection string somewhere safe

**Connection String Format:**
```
mongodb+srv://username:PASSWORD@cluster.xxxxx.mongodb.net/bookclub?retryWrites=true&w=majority
```

---

## ☐ 2. Backend Deployment - Railway (20 minutes)

- [ ] Create Railway account (use GitHub)
- [ ] Create new project from GitHub repo
- [ ] Set root directory to `backend`
- [ ] Add environment variables:
  - [ ] `NODE_ENV` = `production`
  - [ ] `PORT` = `5000`
  - [ ] `MONGODB_URI` = (your MongoDB connection string)
  - [ ] `JWT_SECRET` = (generate random 32+ char string)
  - [ ] `JWT_EXPIRE` = `7d`
  - [ ] `FRONTEND_URL` = `https://temp.vercel.app` (will update later)
- [ ] Deploy and verify it's running
- [ ] Copy your Railway backend URL
- [ ] Save Railway URL: ___________________________________

**Generate JWT Secret (pick one method):**
```bash
# In terminal (Mac/Linux):
openssl rand -base64 32

# Or use online generator:
https://www.random.org/strings/
```

---

## ☐ 3. Frontend Deployment - Vercel (10 minutes)

- [ ] Create Vercel account (use GitHub)
- [ ] Import GitHub repository
- [ ] Configure project:
  - [ ] Framework: Vite
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
- [ ] Add environment variable:
  - [ ] `VITE_API_URL` = (your Railway backend URL)
- [ ] Deploy
- [ ] Copy your Vercel frontend URL
- [ ] Save Vercel URL: ___________________________________

---

## ☐ 4. Update Backend with Frontend URL (2 minutes)

- [ ] Go back to Railway
- [ ] Update `FRONTEND_URL` environment variable with your Vercel URL
- [ ] Save (Railway will auto-redeploy)
- [ ] Wait for redeployment to complete

---

## ☐ 5. Create Admin User (5 minutes)

**Option A - Using Railway CLI (Recommended):**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seed script
railway run npm run seed:admin
```

**Option B - Using Railway Dashboard:**
1. Go to Railway dashboard
2. Click on your backend service
3. Open terminal/console
4. Run: `npm run seed:admin`

**Default Admin Credentials:**
- Email: `admin@bookclub.com`
- Password: `admin123`

⚠️ **IMPORTANT:** Change password after first login!

---

## ☐ 6. Test Everything (10 minutes)

- [ ] Visit your Vercel frontend URL
- [ ] Homepage loads correctly
- [ ] Login with admin credentials works
- [ ] Change admin password
- [ ] Create a test book with cover image
- [ ] Book cover image displays correctly
- [ ] Create a test meeting
- [ ] Register a new member (test registration)
- [ ] Post a review
- [ ] Check shop page

---

## ☐ 7. Security & Post-Deployment

- [ ] Change admin password to something secure
- [ ] Verify JWT_SECRET is random and secure (not "admin123" or similar)
- [ ] Test CORS is working (no console errors)
- [ ] Verify MongoDB IP whitelist is correct
- [ ] Enable 2FA on MongoDB Atlas (optional but recommended)
- [ ] Enable 2FA on Vercel (optional but recommended)
- [ ] Enable 2FA on Railway (optional but recommended)

---

## 📝 Important URLs to Save

| Service | URL | Notes |
|---------|-----|-------|
| Frontend (Vercel) | https://__________________ | Your main app URL |
| Backend (Railway) | https://__________________ | API endpoint |
| MongoDB Atlas | https://cloud.mongodb.com | Database dashboard |
| Railway Dashboard | https://railway.app | Backend hosting |
| Vercel Dashboard | https://vercel.com/dashboard | Frontend hosting |

---

## 🎉 You're Live!

Once all checkboxes are complete, your app is deployed and ready for your book club!

**Next Steps:**
1. Share the Vercel URL with your book club members
2. Add your favorite books to the library
3. Schedule your first meeting
4. Enjoy reading together! 📚

---

## 🆘 Common Issues

### "Cannot connect to database"
→ Check MongoDB Atlas network access allows 0.0.0.0/0 or Railway IPs
→ Verify MONGODB_URI is correct with password replaced

### "CORS error in browser console"
→ Check FRONTEND_URL in Railway matches your Vercel URL exactly
→ Make sure there's no trailing slash

### "File uploads not working"
→ Check Railway logs for errors
→ Verify file size isn't too large (5MB limit)

### "Admin seed script failed"
→ Make sure MONGODB_URI is correct
→ Check Railway logs for specific error message

---

**Need the full guide?** See [DEPLOYMENT.md](./DEPLOYMENT.md)
