"""
Migration script to make stand_id nullable in Invoice table.
This allows creating invoices without requiring a stand (direct creation mode).
"""

import sqlite3
import os

def migrate_database():
    # Path to the database
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'event_management.db')
    
    if not os.path.exists(db_path):
        print(f"✗ Database not found at {db_path}")
        return False
    
    try:
        print(f"ℹ Connecting to database at {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current schema
        cursor.execute("PRAGMA table_info(invoice)")
        columns = cursor.fetchall()
        
        print("\n📋 Current Invoice table columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]}) nullable={col[3] == 0}")
        
        # SQLite doesn't support ALTER COLUMN directly, so we need to:
        # 1. Create a new table with the updated schema
        # 2. Copy data from old table
        # 3. Drop old table
        # 4. Rename new table
        
        print("\n🔄 Starting migration...")
        
        # Clean up any previous failed attempts
        cursor.execute("DROP TABLE IF EXISTS invoice_new")
        print("✓ Cleaned up previous attempts")
        
        # Get the current column names
        cursor.execute("SELECT * FROM invoice LIMIT 0")
        current_columns = [description[0] for description in cursor.description]
        print(f"ℹ Current columns: {', '.join(current_columns)}")
        
        # Check if the table has the simple schema or extended schema
        has_extended_schema = 'client_id' in current_columns
        
        if has_extended_schema:
            # Extended schema
            cursor.execute("""
                CREATE TABLE invoice_new (
                    id INTEGER PRIMARY KEY,
                    invoice_number VARCHAR(20) UNIQUE NOT NULL,
                    stand_id INTEGER,
                    client_id INTEGER,
                    client_name VARCHAR(100) NOT NULL,
                    client_email VARCHAR(120),
                    client_phone VARCHAR(20),
                    client_address TEXT,
                    client_company VARCHAR(100),
                    total_ht FLOAT NOT NULL,
                    tva_amount FLOAT NOT NULL,
                    total_ttc FLOAT NOT NULL,
                    remise FLOAT DEFAULT 0,
                    remise_type VARCHAR(20) DEFAULT 'percentage',
                    tva_percentage FLOAT DEFAULT 19,
                    product_factor FLOAT DEFAULT 1,
                    advance_payment FLOAT DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'devis',
                    agent_name VARCHAR(100),
                    company_name VARCHAR(200) DEFAULT 'Votre Entreprise',
                    company_address TEXT,
                    company_phone VARCHAR(20),
                    company_email VARCHAR(120),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    approved_at DATETIME,
                    created_by INTEGER,
                    FOREIGN KEY (stand_id) REFERENCES stand(id),
                    FOREIGN KEY (client_id) REFERENCES client(id),
                    FOREIGN KEY (created_by) REFERENCES user(id)
                )
            """)
            print("✓ Created new invoice table with extended schema and nullable stand_id")
            
            # Copy data from old table
            cursor.execute("""
                INSERT INTO invoice_new 
                SELECT * FROM invoice
            """)
        else:
            # Simple schema (current database)
            cursor.execute("""
                CREATE TABLE invoice_new (
                    id INTEGER PRIMARY KEY,
                    invoice_number VARCHAR(20) UNIQUE NOT NULL,
                    stand_id INTEGER,
                    client_name VARCHAR(100) NOT NULL,
                    client_email VARCHAR(120),
                    client_phone VARCHAR(20),
                    client_address TEXT,
                    total_ht FLOAT NOT NULL,
                    tva_amount FLOAT NOT NULL,
                    total_ttc FLOAT NOT NULL,
                    status VARCHAR(20) DEFAULT 'devis',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_by INTEGER NOT NULL,
                    FOREIGN KEY (stand_id) REFERENCES stand(id),
                    FOREIGN KEY (created_by) REFERENCES user(id)
                )
            """)
            print("✓ Created new invoice table with simple schema and nullable stand_id")
            
            # Copy data from old table
            cursor.execute("""
                INSERT INTO invoice_new 
                SELECT id, invoice_number, stand_id, client_name, client_email, 
                       client_phone, client_address, total_ht, tva_amount, total_ttc, 
                       status, created_at, created_by
                FROM invoice
            """)
        print("✓ Copied data from old table")
        
        # Drop old table
        cursor.execute("DROP TABLE invoice")
        print("✓ Dropped old table")
        
        # Rename new table
        cursor.execute("ALTER TABLE invoice_new RENAME TO invoice")
        print("✓ Renamed new table to invoice")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Verify the change
        cursor.execute("PRAGMA table_info(invoice)")
        columns = cursor.fetchall()
        
        print("\n📋 Updated Invoice table columns:")
        for col in columns:
            if col[1] == 'stand_id':
                print(f"  - {col[1]} ({col[2]}) nullable={col[3] == 0} ← UPDATED")
            else:
                print(f"  - {col[1]} ({col[2]}) nullable={col[3] == 0}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("INVOICE STAND_ID MIGRATION")
    print("=" * 60)
    print("\nThis script will make stand_id nullable in the Invoice table.")
    print("This allows creating invoices directly without requiring a stand.\n")
    
    response = input("Continue with migration? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        success = migrate_database()
        if success:
            print("\n🎉 Migration successful! You can now create invoices without stands.")
        else:
            print("\n⚠️ Migration failed. Please check the error above.")
    else:
        print("Migration cancelled.")
