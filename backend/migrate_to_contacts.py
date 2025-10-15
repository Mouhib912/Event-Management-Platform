"""
Migration Script: Merge Clients and Suppliers into Unified Contacts
This script safely migrates existing Client and Supplier data into the new Contact table
"""

from app import app, db, Client, Supplier, Contact, Stand, Invoice, Product
from datetime import datetime

def migrate_to_contacts():
    with app.app_context():
        print("🚀 Starting migration: Clients + Suppliers → Contacts")
        print("=" * 60)
        
        # Create Contact table if it doesn't exist
        try:
            db.create_all()
            print("✅ Contact table created/verified")
        except Exception as e:
            print(f"⚠️  Table creation: {e}")
        
        # Count existing data
        client_count = Client.query.count()
        supplier_count = Supplier.query.count()
        existing_contact_count = Contact.query.count()
        
        print(f"\n📊 Current Data:")
        print(f"   Clients: {client_count}")
        print(f"   Suppliers: {supplier_count}")
        print(f"   Contacts: {existing_contact_count}")
        
        if existing_contact_count > 0:
            response = input("\n⚠️  Contact table already has data. Continue? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Migration cancelled")
                return
        
        migrated_clients = 0
        migrated_suppliers = 0
        merged_both = 0
        errors = 0
        
        print("\n🔄 Phase 1: Migrating Clients → Contacts (type: 'client')")
        print("-" * 60)
        
        # Migrate Clients to Contacts
        clients = Client.query.all()
        for client in clients:
            try:
                # Check if this name already exists as a supplier
                existing_supplier = Supplier.query.filter_by(name=client.name).first()
                
                if existing_supplier:
                    # This contact is BOTH client and supplier
                    contact = Contact(
                        name=client.name,
                        contact_person=client.contact_person or existing_supplier.contact_person,
                        email=client.email or existing_supplier.email,
                        phone=client.phone or existing_supplier.phone,
                        address=client.address or existing_supplier.address,
                        company=client.company,
                        contact_type='both',
                        speciality=existing_supplier.speciality,
                        status=client.status,
                        created_at=client.created_at,
                        created_by=client.created_by
                    )
                    merged_both += 1
                    print(f"   🔄 MERGED: {client.name} (found as both client & supplier)")
                else:
                    # Just a client
                    contact = Contact(
                        name=client.name,
                        contact_person=client.contact_person,
                        email=client.email,
                        phone=client.phone,
                        address=client.address,
                        company=client.company,
                        contact_type='client',
                        status=client.status,
                        created_at=client.created_at,
                        created_by=client.created_by
                    )
                    migrated_clients += 1
                    print(f"   ✅ CLIENT: {client.name}")
                
                db.session.add(contact)
                
            except Exception as e:
                errors += 1
                print(f"   ❌ ERROR migrating client {client.name}: {e}")
        
        # Commit clients
        try:
            db.session.commit()
            print(f"\n✅ Clients migrated successfully")
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ ERROR committing clients: {e}")
            return
        
        print("\n🔄 Phase 2: Migrating Suppliers → Contacts (type: 'fournisseur')")
        print("-" * 60)
        
        # Migrate Suppliers to Contacts (skip ones already migrated as 'both')
        suppliers = Supplier.query.all()
        for supplier in suppliers:
            try:
                # Check if already migrated as 'both'
                existing_contact = Contact.query.filter_by(name=supplier.name, contact_type='both').first()
                
                if existing_contact:
                    print(f"   ⏭️  SKIPPED: {supplier.name} (already migrated as 'both')")
                    continue
                
                # Just a supplier
                contact = Contact(
                    name=supplier.name,
                    contact_person=supplier.contact_person,
                    email=supplier.email,
                    phone=supplier.phone,
                    address=supplier.address,
                    contact_type='fournisseur',
                    speciality=supplier.speciality,
                    status=supplier.status,
                    created_at=supplier.created_at,
                    created_by=supplier.created_by
                )
                migrated_suppliers += 1
                print(f"   ✅ FOURNISSEUR: {supplier.name}")
                
                db.session.add(contact)
                
            except Exception as e:
                errors += 1
                print(f"   ❌ ERROR migrating supplier {supplier.name}: {e}")
        
        # Commit suppliers
        try:
            db.session.commit()
            print(f"\n✅ Suppliers migrated successfully")
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ ERROR committing suppliers: {e}")
            return
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 MIGRATION SUMMARY")
        print("=" * 60)
        print(f"✅ Clients migrated: {migrated_clients}")
        print(f"✅ Suppliers migrated: {migrated_suppliers}")
        print(f"🔄 Merged (both): {merged_both}")
        print(f"❌ Errors: {errors}")
        print(f"\n📈 Total Contacts: {Contact.query.count()}")
        
        # Show breakdown
        client_only = Contact.query.filter_by(contact_type='client').count()
        fournisseur_only = Contact.query.filter_by(contact_type='fournisseur').count()
        both_type = Contact.query.filter_by(contact_type='both').count()
        
        print(f"\n🔍 Contact Type Breakdown:")
        print(f"   👤 Client only: {client_only}")
        print(f"   🏪 Fournisseur only: {fournisseur_only}")
        print(f"   🔄 Both: {both_type}")
        
        print("\n" + "=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        
        print("\n⚠️  IMPORTANT NEXT STEPS:")
        print("   1. Verify data integrity in Contact table")
        print("   2. Update Stand.client_id → Stand.contact_id references")
        print("   3. Update Invoice.client_id → Invoice.contact_id references")
        print("   4. Update Product.supplier_id → Product.contact_id references")
        print("   5. Test all API endpoints")
        print("   6. Once verified, you can drop Client and Supplier tables")
        print("\n⚠️  DO NOT drop old tables until all references are updated!")

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🏢 ERP/CRM Migration: Unified Contacts")
    print("=" * 60)
    print("\nThis will merge Client and Supplier tables into Contact table.")
    print("The original tables will be preserved for safety.")
    print("\nPress Ctrl+C to cancel, or press Enter to continue...")
    
    try:
        input()
        migrate_to_contacts()
    except KeyboardInterrupt:
        print("\n\n❌ Migration cancelled by user")
