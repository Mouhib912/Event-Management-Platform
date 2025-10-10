"""
Check the actual database schema for Supplier table
"""
import sqlite3
import os

# Database path
db_path = os.path.join('instance', 'event_management.db')

if not os.path.exists(db_path):
    print(f"❌ Database not found at: {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get table schema
cursor.execute("PRAGMA table_info(supplier)")
columns = cursor.fetchall()

print("=" * 50)
print("SUPPLIER TABLE SCHEMA")
print("=" * 50)
for col in columns:
    print(f"  {col[1]} ({col[2]}) - NOT NULL: {col[3]}, DEFAULT: {col[4]}")

print("\n" + "=" * 50)
print("CATEGORY TABLE SCHEMA")
print("=" * 50)
cursor.execute("PRAGMA table_info(category)")
columns = cursor.fetchall()
for col in columns:
    print(f"  {col[1]} ({col[2]}) - NOT NULL: {col[3]}, DEFAULT: {col[4]}")

# Check actual data
print("\n" + "=" * 50)
print("SAMPLE SUPPLIER DATA")
print("=" * 50)
cursor.execute("SELECT * FROM supplier LIMIT 1")
row = cursor.fetchone()
if row:
    cursor.execute("PRAGMA table_info(supplier)")
    columns = [col[1] for col in cursor.fetchall()]
    for col_name, value in zip(columns, row):
        print(f"  {col_name}: {value}")
else:
    print("  No suppliers found")

conn.close()
