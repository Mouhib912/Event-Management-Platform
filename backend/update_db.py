"""
Update database with Invoice table
"""
import sys
sys.path.insert(0, 'C:/Users/mouhib/Downloads/event-management-platform/backend')

from app import app, db

with app.app_context():
    db.create_all()
    print("✓ Database updated successfully!")
    print("✓ Invoice table created")
