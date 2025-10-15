"""
Update existing database tables to match current models
"""
from app import app, db
from sqlalchemy import text

def update_tables():
    with app.app_context():
        print("🔧 Updating database schema...")
        
        try:
            # Check if supplier.speciality exists
            with db.engine.connect() as conn:
                result = conn.execute(text("PRAGMA table_info(supplier)"))
                columns = [row[1] for row in result]
                
                if 'speciality' not in columns:
                    print("   Adding 'speciality' column to supplier table...")
                    conn.execute(text("ALTER TABLE supplier ADD COLUMN speciality VARCHAR(200)"))
                    conn.commit()
                    print("   ✅ Added speciality column")
                else:
                    print("   ℹ️  speciality column already exists")
        
        except Exception as e:
            print(f"   ⚠️  Error updating supplier: {e}")
        
        # Create all new tables
        db.create_all()
        print("✅ Database schema updated!")

if __name__ == '__main__':
    update_tables()
