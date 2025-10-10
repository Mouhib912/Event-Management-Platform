# Quick Deploy to Render - TL;DR Version

## 🚀 5-Minute Setup

### 1. Create Database (2 min)

1. Render Dashboard → New PostgreSQL
2. Name: `event-management-db`
3. Copy **Internal Database URL**

### 2. Deploy Backend (2 min)

1. New Web Service → Connect GitHub repo
2. Settings:
   ```
   Root Directory: backend
   Build: pip install -r requirements.txt
   Start: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
   ```
3. Environment Variables:
   - `DATABASE_URL` = Your DB URL
   - `SECRET_KEY` = Generate
   - `JWT_SECRET_KEY` = Generate
   - `FLASK_ENV` = production
   - `FRONTEND_URL` = (add after step 3)

### 3. Deploy Frontend (2 min)

1. New Web Service → Connect GitHub repo
2. Settings:
   ```
   Root Directory: (empty)
   Build: npm install && npm run build
   Start: npm run preview -- --host 0.0.0.0 --port $PORT
   ```
3. Environment Variables:
   - `VITE_API_URL` = `https://YOUR-BACKEND-URL.onrender.com/api`

### 4. Update Backend CORS (30 sec)

- Edit backend `FRONTEND_URL` to your frontend URL
- Save → Auto-redeploys

### 5. Initialize DB (1 min)

Backend Shell:

```python
from app import db
db.create_all()
exit()
```

### 6. Create Admin User (1 min)

```python
from app import db, User
from werkzeug.security import generate_password_hash

admin = User(
    email='admin@example.com',
    password_hash=generate_password_hash('changeme123'),
    name='Admin',
    role='admin'
)
db.session.add(admin)
db.session.commit()
```

## ✅ Done!

Visit your frontend URL and login with:

- Email: `admin@example.com`
- Password: `changeme123`

**See DEPLOYMENT.md for detailed instructions and troubleshooting.**
