# 🚀 Render Deployment Guide - Contacts Module Update

## Overview

This guide will help you deploy your updated event management platform with the new **unified Contacts module** to Render.

## ✅ Pre-Deployment Checklist

### Backend Changes

- ✅ Contact model added to `backend/app.py`
- ✅ Contact API endpoints (GET, POST, PUT, DELETE)
- ✅ Migration script created (`migrate_to_contacts.py`)
- ✅ auto_init.py updated to import Contact model
- ✅ Database schema includes Contact table

### Frontend Changes

- ✅ Contacts.jsx component created
- ✅ Contact routes added to App.jsx
- ✅ Contacts navigation link in Layout.jsx
- ✅ API service includes Contact methods

## 📋 Deployment Steps

### Step 1: Commit Your Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add unified Contacts module with type filtering

- Add Contact model (replaces Client/Supplier separation)
- Create Contacts API endpoints with type filtering
- Build Contacts UI with tabs and badges
- Migrate existing suppliers to Contact table
- Add contact_type field (client/fournisseur/both)
- Update navigation and routing"

# Push to main branch
git push origin main
```

### Step 2: Render Auto-Deployment

Render is configured for **automatic deployment** from your GitHub repository. Once you push, Render will:

1. ✅ Detect the new commit on `main` branch
2. ✅ Trigger backend rebuild
3. ✅ Trigger frontend rebuild
4. ✅ Run database migrations automatically

**Timeline**: Deployment typically takes 5-10 minutes.

### Step 3: Monitor Deployment

#### Backend Deployment Logs

```
1. Go to: https://dashboard.render.com
2. Click: "event-management-backend"
3. Watch: Build & Deploy logs
4. Look for:
   ✅ "pip install -r requirements.txt" - Dependencies installed
   ✅ "python reset_render_db.py" - Database reset
   ✅ "python auto_init.py" - Sample data created
   ✅ "Starting gunicorn" - Server started
```

#### Frontend Deployment Logs

```
1. Go to: https://dashboard.render.com
2. Click: "event-management-frontend"
3. Watch: Build & Deploy logs
4. Look for:
   ✅ "npm install" - Dependencies installed
   ✅ "npm run build" - Vite build completed
   ✅ "Preview server started" - Ready to serve
```

### Step 4: Database Initialization

Your `start.sh` script automatically:

1. **Resets the database** (`reset_render_db.py`)
   - Drops all tables
   - Creates fresh schema with Contact table
2. **Initializes with sample data** (`auto_init.py`)
   - Creates admin user
   - Creates sample suppliers (migrated to Contacts)
   - Creates categories and products
   - Contact table includes all data

### Step 5: Verify Deployment

#### Test Backend

```bash
# Health check
curl https://event-management-backend.onrender.com/api/health

# Test Contact endpoint
curl -X POST https://event-management-backend.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@event.com","password":"admin123"}'

# Get JWT token from response, then:
curl https://event-management-backend.onrender.com/api/contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Frontend

1. Visit: `https://event-management-frontend.onrender.com`
2. Login: `admin@event.com` / `admin123`
3. Navigate to: **Contacts** (in sidebar)
4. Verify:
   - ✅ Page loads without errors
   - ✅ Sample contacts displayed
   - ✅ Filtering tabs work (All, Clients, Fournisseurs, Both)
   - ✅ Create new contact works
   - ✅ Edit/Delete operations work

## 🗄️ Database State After Deployment

```
Contact Table:
├─ 7 Sample Suppliers (from auto_init.py)
│  ├─ EventPro Solutions (fournisseur)
│  ├─ TechStand Equipment (fournisseur)
│  ├─ Display & Design Co (fournisseur)
│  ├─ Furniture Plus (fournisseur)
│  ├─ Lighting Experts (fournisseur)
│  ├─ Tech Innovators (fournisseur)
│  └─ Global Trade Co (fournisseur)
└─ 0 Clients (create manually or via migration)

Old Tables (Preserved):
├─ Supplier (empty after reset)
└─ Client (empty after reset)
```

## 🔧 Troubleshooting

### Issue 1: Build Fails with Import Error

**Symptom**: `ModuleNotFoundError: No module named 'flask_sqlalchemy'`

**Solution**: Ensure `requirements.txt` is complete:

```txt
Flask==2.3.3
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.0.5
Flask-JWT-Extended==4.5.3
reportlab==4.0.4
Pillow==10.0.1
python-dotenv==1.0.0
bcrypt==4.0.1
marshmallow==3.20.1
gunicorn==21.2.0
psycopg2-binary==2.9.9
```

### Issue 2: Contact Model Not Found

**Symptom**: `ImportError: cannot import name 'Contact' from 'app'`

**Solution**: Verify `backend/app.py` exports Contact:

```python
# After Contact model definition
from app import app, db, User, Contact, Supplier, Client, ...
```

### Issue 3: Database Table Missing

**Symptom**: `no such table: contact`

**Solution**:

1. Check `start.sh` runs `reset_render_db.py`
2. Verify `db.create_all()` is called
3. Check logs for database errors

### Issue 4: Frontend Can't Reach Backend

**Symptom**: Network errors, CORS issues

**Solution**: Check environment variables:

```yaml
# render.yaml - Frontend
envVars:
  - key: VITE_API_URL
    value: https://event-management-backend.onrender.com

# render.yaml - Backend
envVars:
  - key: FRONTEND_URL
    value: https://event-management-frontend.onrender.com
```

### Issue 5: 404 on /contacts Route

**Symptom**: Frontend routing doesn't work

**Solution**: Ensure Vite preview serves SPA correctly:

```json
// vite.config.js should have:
preview: {
  port: process.env.PORT || 4173,
  host: '0.0.0.0'
}
```

## 🎯 Post-Deployment Tasks

### 1. Test Contact CRUD

- ✅ Create a client contact
- ✅ Create a fournisseur contact
- ✅ Create a "both" contact
- ✅ Edit contact type
- ✅ Delete contact
- ✅ Search contacts
- ✅ Filter by type

### 2. Verify Statistics

- ✅ Check statistics cards update correctly
- ✅ Verify counts match filtered results
- ✅ Test "Both" type counts appear in both categories

### 3. Test Existing Features

- ✅ Login/logout still works
- ✅ Stand creation works
- ✅ Invoice creation works
- ✅ Products management works
- ✅ User management works

### 4. Performance Check

- ✅ Contact list loads quickly
- ✅ Filtering is instant
- ✅ Search is responsive
- ✅ No console errors

## 🔐 Security Notes

### Production Environment Variables (Already Set)

```yaml
SECRET_KEY: Auto-generated by Render
JWT_SECRET_KEY: Auto-generated by Render
DATABASE_URL: Auto-configured PostgreSQL connection
FLASK_ENV: production
```

### Admin Credentials

```
Email: admin@event.com
Password: admin123

⚠️ CHANGE AFTER FIRST LOGIN!
```

## 📊 Render Configuration (render.yaml)

Your current configuration is optimized:

```yaml
Backend: ✅ Auto-deploys from main branch
  ✅ Runs on Python runtime
  ✅ Executes start.sh (db init)
  ✅ Connects to PostgreSQL database
  ✅ CORS configured for frontend

Frontend: ✅ Auto-deploys from main branch
  ✅ Runs on Node runtime
  ✅ Vite build for production
  ✅ Connects to backend API

Database: ✅ PostgreSQL managed by Render
  ✅ Auto-backups enabled
  ✅ Frankfurt region (low latency)
```

## 🚦 Deployment Status Indicators

### Backend Health Check

```bash
curl https://event-management-backend.onrender.com/api/health

Expected Response:
{
  "status": "healthy",
  "database": "connected"
}
```

### Frontend Health Check

```bash
curl https://event-management-frontend.onrender.com

Expected Response:
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ...
```

## 📱 Mobile Testing

After deployment, test on mobile:

1. Visit site on mobile browser
2. Test Contacts page responsive layout
3. Verify cards stack properly
4. Test dialog forms on small screens
5. Check touch interactions work

## 🔄 Rollback Procedure

If deployment fails:

```bash
# Option 1: Rollback in Render Dashboard
1. Go to: https://dashboard.render.com
2. Select service (backend or frontend)
3. Click: "Rollback to Previous Deploy"

# Option 2: Revert Git Commit
git revert HEAD
git push origin main
# Render will auto-deploy previous version
```

## 📈 Monitoring

### Check Logs

```bash
# Backend logs
render logs -s event-management-backend

# Frontend logs
render logs -s event-management-frontend

# Database logs
render logs -d event-management-db
```

### Key Metrics to Watch

- **Response Time**: Should be < 500ms
- **Error Rate**: Should be < 1%
- **Database Connections**: Should stay below 20
- **Memory Usage**: Should stay below 512MB

## 🎉 Success Criteria

Deployment is successful when:

- ✅ Backend health check returns 200 OK
- ✅ Frontend loads without errors
- ✅ Login works with admin credentials
- ✅ Contacts page displays correctly
- ✅ Can create/edit/delete contacts
- ✅ Type filtering works (All, Clients, Fournisseurs, Both)
- ✅ Visual badges display correctly
- ✅ Search functionality works
- ✅ Statistics update in real-time
- ✅ No console errors in browser
- ✅ No errors in Render logs

## 🌟 Next Steps After Deployment

Once deployed successfully:

1. **Update Other Modules**:

   - Modify Invoice creation to use Contact
   - Update Stand orders to use Contact
   - Update Products to link to Contact

2. **Restructure Navigation** (Phase 2):

   - Implement module-based sidebar
   - Move Products to Achats
   - Create Bon de Commande module

3. **Add Settings Page**:

   - Category visibility toggles
   - Booth Maker preferences
   - Company information

4. **User Training**:
   - Share CONTACTS_QUICK_START.md with team
   - Demonstrate type filtering
   - Show "Both" contact use cases

## 🆘 Need Help?

### Render Dashboard

https://dashboard.render.com

### Render Documentation

https://render.com/docs

### Common Commands

```bash
# View services
render services list

# Trigger manual deploy
render deploy -s event-management-backend

# View environment variables
render env -s event-management-backend

# Database shell
render psql event-management-db
```

## ✅ Deployment Checklist

Before pushing:

- [ ] All files committed to Git
- [ ] Contact model in app.py
- [ ] Contact API endpoints tested locally
- [ ] Frontend Contacts page tested locally
- [ ] No console errors locally
- [ ] auto_init.py imports Contact
- [ ] requirements.txt up to date

After pushing:

- [ ] Git push successful
- [ ] Render detects new commit
- [ ] Backend build starts
- [ ] Frontend build starts
- [ ] No build errors in logs
- [ ] Services restart successfully
- [ ] Health checks pass
- [ ] Test login on production
- [ ] Test Contacts page on production
- [ ] Verify sample data created

Post-deployment:

- [ ] Change admin password
- [ ] Create production contacts
- [ ] Test all CRUD operations
- [ ] Verify mobile responsiveness
- [ ] Monitor logs for errors
- [ ] Share with team

---

**Ready to Deploy!** 🚀

Just run:

```bash
git add .
git commit -m "feat: Add unified Contacts module"
git push origin main
```

Then monitor your Render dashboard for deployment progress!
