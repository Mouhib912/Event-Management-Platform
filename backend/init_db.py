"""
Database Initialization Script for Render
Run this once after deploying to create tables and admin user
"""

from app import app, db, User
from werkzeug.security import generate_password_hash

def init_database():
    """Initialize database with tables and admin user"""
    with app.app_context():
        try:
            # Create all tables
            print("Creating database tables...")
            db.create_all()
            print("✅ Database tables created successfully!")
            
            # Check if admin exists
            print("\nChecking for admin user...")
            existing_admin = User.query.filter_by(email='admin@example.com').first()
            
            if not existing_admin:
                # Create admin user
                print("Creating admin user...")
                admin = User(
                    email='admin@example.com',
                    password_hash=generate_password_hash('changeme123'),
                    name='Administrator',
                    role='admin'
                )
                db.session.add(admin)
                db.session.commit()
                print("✅ Admin user created successfully!")
                print("\n" + "="*50)
                print("LOGIN CREDENTIALS:")
                print("Email: admin@example.com")
                print("Password: changeme123")
                print("="*50 + "\n")
            else:
                print("⚠️ Admin user already exists")
                print(f"Email: {existing_admin.email}")
            
            # Verify tables
            print("\nVerifying tables...")
            tables = db.engine.table_names()
            print(f"Tables created: {', '.join(tables)}")
            
            print("\n✅ Database initialization complete!")
            return True
            
        except Exception as e:
            print(f"❌ Error during initialization: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    print("="*50)
    print("RENDER DATABASE INITIALIZATION")
    print("="*50 + "\n")
    
    success = init_database()
    
    if success:
        print("\n🎉 You can now use your application!")
        print("Visit your frontend and login with the credentials above.")
    else:
        print("\n❌ Initialization failed. Check the error messages above.")
