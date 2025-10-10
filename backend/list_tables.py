import sqlite3

conn = sqlite3.connect('instance/event_management.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("=" * 50)
print("TABLES IN DATABASE")
print("=" * 50)
for table in tables:
    print(f"  - {table[0]}")
conn.close()
