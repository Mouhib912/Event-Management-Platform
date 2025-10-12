"""
Script to drop and recreate all database tables on Render.
This fixes schema mismatches when column definitions change.
"""
import os
from app import app, db

def reset_database():
    """Drop all tables and recreate them with current schema."""
    with app.app_context():
        try:
            print("\n" + "="*60)
            print("🗑️  DROPPING ALL TABLES")
            print("="*60)
            
            # Drop all tables
            db.drop_all()
            print("✅ All tables dropped successfully!")
            
            print("\n" + "="*60)
            print("📋 CREATING TABLES WITH NEW SCHEMA")
            print("="*60)
            
            # Create all tables with current schema
            db.create_all()
            print("✅ All tables created successfully!")
            
            print("\n" + "="*60)
            print("✅ DATABASE RESET COMPLETE!")
            print("="*60)
            print("\n💡 Now run auto_init.py to populate with sample data\n")
            
            return True
            
        except Exception as e:
            print(f"\n❌ ERROR during database reset: {e}")
            return False

if __name__ == '__main__':
    success = reset_database()
    exit(0 if success else 1)
