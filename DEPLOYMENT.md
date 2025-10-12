# Deployment Guide for Render

This guide will walk you through deploying the Event Management Platform to Render with a PostgreSQL database, Flask backend, and React frontend.

## 🚀 Quick Overview

Your application consists of:

- **Backend**: Flask API (Python) with SQLAlchemy and JWT authentication
- **Frontend**: React + Vite with shadcn/ui components
- **Database**: PostgreSQL (managed by Render)
- **PDFs**: ReportLab for generating purchase orders and invoices

---

## 📋 Prerequisites

1. A [Render](https://render.com) account (free tier available)
2. Your GitHub repository with the latest code pushed
3. Basic knowledge of environment variables

---

## 🗄️ Step 1: Create PostgreSQL Database

1. **Go to Render Dashboard**

   - Navigate to https://dashboard.render.com
   - Click **"New +"** → **"PostgreSQL"**

2. **Configure Database**

   - **Name**: `event-management-db`
   - **Database**: `event_management`
   - **User**: `event_admin` (or keep default)
   - **Region**: Choose closest to you (e.g., Frankfurt)
   - **Plan**: Free tier (for testing) or Starter ($7/month for production)

3. **Create Database**
   - Click **"Create Database"**
   - Wait for provisioning (1-2 minutes)
   - **Copy the Internal Database URL** - you'll need this!

---

## 🐍 Step 2: Deploy Backend (Flask API)

1. **Create Web Service**

   - From Render Dashboard, click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Select your `event-management-platform` repository

2. **Configure Backend Service**

   ```
   Name: event-management-backend
   Region: Frankfurt (or your choice)
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt && chmod +x start.sh
   Start Command: bash start.sh
   ```

   **Note**: The `start.sh` script automatically initializes the database with sample data on first run!

3. **Set Environment Variables**
   Click **"Advanced"** → **"Add Environment Variable"** and add:

   | Key              | Value                                     | Notes                |
   | ---------------- | ----------------------------------------- | -------------------- |
   | `FLASK_ENV`      | `production`                              | Production mode      |
   | `SECRET_KEY`     | Click "Generate"                          | Flask session secret |
   | `JWT_SECRET_KEY` | Click "Generate"                          | JWT token secret     |
   | `DATABASE_URL`   | Paste Internal Database URL               | From Step 1          |
   | `FRONTEND_URL`   | `https://YOUR-FRONTEND-NAME.onrender.com` | Update after Step 3  |

   **Important**: For `FRONTEND_URL`, you'll update this after deploying the frontend.

4. **Health Check**

   - **Health Check Path**: `/api/health`
   - This ensures Render knows your service is running

5. **Deploy**

   - Click **"Create Web Service"**
   - Wait for build and deploy (3-5 minutes)
   - Note your backend URL: `https://event-management-backend.onrender.com`
   - **Database automatically initializes with sample data!** ✨

6. **Verify Auto-Initialization**
   - Go to backend service → **Logs** tab
   - You should see initialization messages:
     ```
     🚀 STARTING DATABASE INITIALIZATION
     ✅ Database tables created successfully!
     📦 Creating sample data...
     ✅ Created 3 users, 4 suppliers, 5 categories, 17 products
     ```
   - Check the login credentials in the logs
   - **Default login**: 
     - Email: `admin@event.com`
     - Password: `admin123`
   
   **Note**: The database is now ready with sample data. No manual setup needed!

---

## ⚛️ Step 3: Deploy Frontend (React + Vite)

1. **Create Web Service**

   - From Render Dashboard, click **"New +"** → **"Web Service"**
   - Connect your GitHub repository (same repo)

2. **Configure Frontend Service**

   ```
   Name: event-management-frontend
   Region: Frankfurt (same as backend)
   Branch: main
   Root Directory: (leave empty - uses root)
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm run preview -- --host 0.0.0.0 --port $PORT
   ```

   **Note**: The `vite.config.js` already includes `allowedHosts: 'all'` to allow Render domains.

3. **Set Environment Variables**
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://event-management-backend.onrender.com/api` |

   Replace with your actual backend URL from Step 2.

4. **Deploy**
   - Click **"Create Web Service"**
   - Wait for build and deploy (5-8 minutes - Node builds take longer)
   - Note your frontend URL: `https://event-management-frontend.onrender.com`

---

## 🔄 Step 4: Update Backend CORS Settings

Now that you know your frontend URL, update the backend:

1. Go to backend service → **Environment** tab
2. Update `FRONTEND_URL` to your actual frontend URL:
   ```
   https://event-management-frontend.onrender.com
   ```
3. Click **"Save Changes"**
4. Backend will automatically redeploy

---

## 🧪 Step 5: Test Your Deployment

1. **Test Backend Health Check**

   ```
   Visit: https://event-management-backend.onrender.com/api/health

   Should return:
   {
     "status": "healthy",
     "database": "connected",
     "timestamp": "2025-10-10T..."
   }
   ```

2. **Test Frontend**

   - Visit: `https://event-management-frontend.onrender.com`
   - You should see the login page
   - Register a new admin user
   - Try creating suppliers, products, and purchase orders

3. **Test PDF Generation**
   - Create a purchase order
   - Download PDF to verify ReportLab is working

---

## 📁 Step 6: Create Initial Admin User

Your app needs an initial user to log in:

1. **Option A: Via Backend Shell**

   - Go to backend service → **Shell**
   - Run:

     ```python
     from app import db, User
     from werkzeug.security import generate_password_hash

     admin = User(
         email='admin@example.com',
         password_hash=generate_password_hash('changeme123'),
         name='Administrator',
         role='admin'
     )
     db.session.add(admin)
     db.session.commit()
     print("Admin user created!")
     ```

2. **Option B: Via Registration Page**
   - Just visit the frontend and register normally
   - First user should be made admin

---

## 🔧 Alternative: Using render.yaml (Blueprint)

Instead of manual setup, you can use Infrastructure as Code:

1. **Push render.yaml to GitHub** (already created in root directory)

2. **Create New Blueprint**

   - Go to Render Dashboard
   - Click **"New +"** → **"Blueprint"**
   - Connect your repo
   - Render will automatically:
     - Create PostgreSQL database
     - Deploy backend service
     - Deploy frontend service
     - Set up environment variables

3. **Manual Steps Still Needed**
   - Initialize database (Step 2.6)
   - Create admin user (Step 6)
   - Verify URLs in environment variables

---

## 🔒 Security Best Practices

1. **Never commit secrets**

   - `.env` files are in `.gitignore`
   - Use Render's "Generate" feature for secrets

2. **Use Strong Secrets**

   - `SECRET_KEY` should be 32+ random characters
   - `JWT_SECRET_KEY` should be different from SECRET_KEY

3. **CORS Configuration**

   - Backend only allows requests from your frontend URL
   - Update `FRONTEND_URL` if you change domains

4. **Database Backups**
   - Render Pro plans include automated backups
   - Free tier: manually export your database periodically

---

## 📊 Monitoring & Logs

**Backend Logs**:

- Go to backend service → **Logs** tab
- Filter by error, warning, or info

**Frontend Logs**:

- Go to frontend service → **Logs** tab
- Check for build errors or runtime issues

**Database Metrics**:

- Go to database → **Metrics** tab
- Monitor connections, queries, storage

---

## 🚨 Common Issues & Solutions

### Issue: Backend "Application failed to respond"

**Solution**:

- Check logs for errors
- Verify `DATABASE_URL` is set correctly
- Ensure database tables are created (Step 2.6)
- Check Health Check path is `/api/health`

### Issue: Frontend shows "Cannot connect to backend"

**Solution**:

- Verify `VITE_API_URL` is set correctly
- Backend must include `/api` in the URL
- Check backend CORS allows frontend URL
- Ensure backend is actually running (check health endpoint)

### Issue: PDF generation fails

**Solution**:

- Check backend logs for ReportLab errors
- Ensure `reportlab` and `Pillow` are in `requirements.txt`
- Logo file should exist in `backend/static/logo.png`

### Issue: Database connection errors

**Solution**:

- Use **Internal Database URL** (not External)
- Render provides this automatically
- Check database is running (not suspended)

### Issue: Slow initial load (Cold Start)

**Solution**:

- Free tier services sleep after 15 min of inactivity
- First request wakes them up (takes 30-60 seconds)
- Upgrade to paid plan to keep services always running

### Issue: "This host is not allowed" error

**Error Message**:

```
Blocked request. This host ("your-app.onrender.com") is not allowed.
To allow this host, add "your-app.onrender.com" to `preview.allowedHosts` in vite.config.js.
```

**Solution**:

- This is already fixed in `vite.config.js` with `allowedHosts: 'all'`
- If you still see this error:
  1. Make sure you've pushed the latest code with the updated `vite.config.js`
  2. Trigger a manual redeploy on Render
  3. Clear your browser cache and try again
- The configuration allows all hosts, which is necessary for Render's dynamic URLs

---

## 🔄 Updating Your Deployment

**Automatic Deployment**:
Render watches your GitHub repo. Just:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render automatically rebuilds and redeploys!

**Manual Deployment**:

- Go to service → **Manual Deploy** → **Deploy latest commit**

---

## 💰 Cost Breakdown

**Free Tier** (Good for testing):

- Database: Free (90 days, then $7/month)
- Backend: Free (sleeps after inactivity)
- Frontend: Free (sleeps after inactivity)
- **Total**: $0 for 90 days, then $7/month

**Starter Plan** (Production-ready):

- Database: $7/month
- Backend: $7/month (always running)
- Frontend: $7/month (always running)
- **Total**: $21/month

---

## 📚 Additional Resources

- [Render Python Quickstart](https://render.com/docs/deploy-flask)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [Flask Deployment Checklist](https://flask.palletsprojects.com/en/2.3.x/deploying/)

---

## 🎉 Success Checklist

Before considering your deployment complete, verify:

- [ ] Backend health check responds with `"healthy"`
- [ ] Frontend loads without errors
- [ ] Can register/login successfully
- [ ] JWT tokens are working (refresh page while logged in)
- [ ] Can create suppliers and products
- [ ] Can create purchase orders
- [ ] PDF downloads work correctly
- [ ] Can create invoices (if implemented)
- [ ] All CRUD operations work (create, read, update, delete)
- [ ] Database persists data (refresh page, data remains)

---

## 🆘 Need Help?

1. Check Render logs first (most issues show here)
2. Review this guide's "Common Issues" section
3. Check GitHub Issues for similar problems
4. Render has excellent documentation and support

---

**🎊 Congratulations! Your Event Management Platform is now live!**

Share your URL: `https://event-management-frontend.onrender.com`
