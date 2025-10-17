#!/usr/bin/env python3
"""
Auto-migration script for Render deployment
Automatically makes stand_id nullable in Invoice table on startup
"""

import sqlite3
import os
import sys

def run_migration():
    """Run the invoice stand_id migration automatically"""
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'event_management.db')
    
    if not os.path.exists(db_path):
        print('  ℹ️  Database does not exist yet, skipping migration')
        return True
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if migration is needed
        cursor.execute('PRAGMA table_info(invoice)')
        columns = cursor.fetchall()
        
        if not columns:
            print('  ℹ️  Invoice table does not exist yet, skipping migration')
            conn.close()
            return True
        
        # Check stand_id nullable status
        stand_id_col = None
        for col in columns:
            if col[1] == 'stand_id':
                stand_id_col = col
                break
        
        if not stand_id_col:
            print('  ⚠️  stand_id column not found in invoice table')
            conn.close()
            return True
        
        # col[3] is notnull flag: 1 = NOT NULL, 0 = NULL
        if stand_id_col[3] == 0:
            print('  ✅ Migration already applied - stand_id is nullable')
            conn.close()
            return True
        
        print('  🔄 Applying migration - making stand_id nullable...')
        
        # Clean up any previous attempts
        cursor.execute('DROP TABLE IF EXISTS invoice_new')
        
        # Get current columns
        cursor.execute('SELECT * FROM invoice LIMIT 0')
        current_columns = [desc[0] for desc in cursor.description]
        
        # Determine schema type
        has_extended = 'client_id' in current_columns
        
        if has_extended:
            # Extended schema with all invoice fields
            cursor.execute('''
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
            ''')
            cursor.execute('INSERT INTO invoice_new SELECT * FROM invoice')
        else:
            # Simple schema
            cursor.execute('''
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
            ''')
            cursor.execute('''
                INSERT INTO invoice_new 
                SELECT id, invoice_number, stand_id, client_name, client_email,
                       client_phone, client_address, total_ht, tva_amount, total_ttc,
                       status, created_at, created_by
                FROM invoice
            ''')
        
        cursor.execute('DROP TABLE invoice')
        cursor.execute('ALTER TABLE invoice_new RENAME TO invoice')
        
        conn.commit()
        print('  ✅ Migration complete - stand_id is now nullable')
        conn.close()
        return True
        
    except Exception as e:
        print(f'  ⚠️  Migration error: {e}')
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == '__main__':
    print('🔄 Invoice Migration - Make stand_id nullable')
    success = run_migration()
    sys.exit(0 if success else 1)
