"""
Reset database - drops all tables and recreates them
"""
import os
from app import app, db

# Get the database path
db_path = os.path.join(app.instance_path, 'event_management.db')

# Check if database exists and remove it
if os.path.exists(db_path):
    print(f"Removing existing database: {db_path}")
    os.remove(db_path)

# Create all tables
with app.app_context():
    db.create_all()
    print("Database tables created successfully!")
    print("\nNow run: python init_sample_data.py")
