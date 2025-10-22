"""
Migration script to add currency field to Stand, Purchase, and Invoice tables
"""
import sqlite3
import os

def add_currency_fields():
    # Get database path
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'event_management.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("🔧 Adding currency fields...")
        
        # Add currency to Stand table
        try:
            cursor.execute("ALTER TABLE stand ADD COLUMN currency VARCHAR(10) DEFAULT 'TND'")
            print("✅ Added currency field to Stand table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("ℹ️  Currency field already exists in Stand table")
            else:
                raise
        
        # Add currency to Purchase table
        try:
            cursor.execute("ALTER TABLE purchase ADD COLUMN currency VARCHAR(10) DEFAULT 'TND'")
            print("✅ Added currency field to Purchase table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("ℹ️  Currency field already exists in Purchase table")
            else:
                raise
        
        # Add currency to Invoice table
        try:
            cursor.execute("ALTER TABLE invoice ADD COLUMN currency VARCHAR(10) DEFAULT 'TND'")
            print("✅ Added currency field to Invoice table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("ℹ️  Currency field already exists in Invoice table")
            else:
                raise
        
        conn.commit()
        print("✅ Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    add_currency_fields()
