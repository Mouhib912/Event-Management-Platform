"""
Migration Script: Add Person/Enterprise Contact Types
This script migrates the Contact model to support two types:
- Person: Individual contacts (can be linked to an enterprise)
- Enterprise: Companies/Organizations

Run this script once to migrate existing data.
"""

from app import app, db, Contact
from sqlalchemy import text

def migrate_contacts():
    with app.app_context():
        print("🔄 Starting Contact migration to Person/Enterprise model...")
        
        try:
            # Add new columns if they don't exist
            with db.engine.connect() as conn:
                # Check if columns exist
                inspector = db.inspect(db.engine)
                columns = [col['name'] for col in inspector.get_columns('contact')]
                
                # Add contact_nature column
                if 'contact_nature' not in columns:
                    print("  → Adding contact_nature column...")
                    conn.execute(text("ALTER TABLE contact ADD COLUMN contact_nature VARCHAR(20) DEFAULT 'person'"))
                    conn.commit()
                
                # Add enterprise-specific columns
                if 'matricule_fiscal' not in columns:
                    print("  → Adding enterprise fields...")
                    conn.execute(text("ALTER TABLE contact ADD COLUMN matricule_fiscal VARCHAR(50)"))
                    conn.execute(text("ALTER TABLE contact ADD COLUMN code_tva VARCHAR(50)"))
                    conn.execute(text("ALTER TABLE contact ADD COLUMN code_douane VARCHAR(50)"))
                    conn.execute(text("ALTER TABLE contact ADD COLUMN registre_commerce VARCHAR(50)"))
                    conn.execute(text("ALTER TABLE contact ADD COLUMN legal_form VARCHAR(50)"))
                    conn.execute(text("ALTER TABLE contact ADD COLUMN capital FLOAT"))
                    conn.execute(text("ALTER TABLE contact ADD COLUMN website VARCHAR(200)"))
                    conn.commit()
                
                # Add person-specific columns
                if 'enterprise_id' not in columns:
                    print("  → Adding person fields...")
                    conn.execute(text("ALTER TABLE contact ADD COLUMN enterprise_id INTEGER"))
                    conn.execute(text("ALTER TABLE contact ADD COLUMN position VARCHAR(100)"))
                    conn.commit()
            
            # Migrate existing data
            print("\n  → Migrating existing contacts...")
            contacts = Contact.query.all()
            
            for contact in contacts:
                # If contact has a company field, it's likely a person linked to that company
                # Otherwise, if it has contact_person, it's likely an enterprise
                if contact.company:
                    # This is a person with a company
                    contact.contact_nature = 'person'
                    # We'll keep the company in the legacy field for now
                    # Admin can manually link to enterprises later
                elif contact.contact_person:
                    # This has a contact person, so it's likely an enterprise
                    contact.contact_nature = 'enterprise'
                else:
                    # Default to person
                    contact.contact_nature = 'person'
            
            db.session.commit()
            
            print(f"\n✅ Migration completed successfully!")
            print(f"   Total contacts processed: {len(contacts)}")
            print(f"   - Enterprises: {sum(1 for c in contacts if c.contact_nature == 'enterprise')}")
            print(f"   - Persons: {sum(1 for c in contacts if c.contact_nature == 'person')}")
            print("\n📝 Next steps:")
            print("   1. Review contacts in the admin panel")
            print("   2. Link persons to their enterprises if needed")
            print("   3. Add enterprise details (matricule_fiscal, etc.)")
            
        except Exception as e:
            print(f"\n❌ Error during migration: {e}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    migrate_contacts()
