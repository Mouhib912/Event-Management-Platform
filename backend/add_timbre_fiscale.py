"""
Migration script to add timbre_fiscale field to invoice table
Run this script once to add the column to existing database
"""

import sqlite3
import os

def add_timbre_fiscale_column():
    # Get the database path
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'event_management.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(invoice)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'timbre_fiscale' in columns:
            print("Column 'timbre_fiscale' already exists in invoice table")
        else:
            # Add timbre_fiscale column
            cursor.execute("""
                ALTER TABLE invoice 
                ADD COLUMN timbre_fiscale REAL DEFAULT 0
            """)
            conn.commit()
            print("Successfully added 'timbre_fiscale' column to invoice table")
            print("Default value: 0")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    add_timbre_fiscale_column()
