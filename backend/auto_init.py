"""
Auto-initialization script for Render deployment
This script runs automatically on startup and creates:
- Database tables
- Admin user
- Sample contacts (unified)
- Sample suppliers (legacy)
- Sample categories
- Sample products
- Sample stands
"""

from app import app, db, User, Contact, Supplier, Client, Category, Product, Stand
from werkzeug.security import generate_password_hash
from datetime import datetime

def init_database_with_samples():
    """Initialize database with tables and sample data"""
    
    with app.app_context():
        try:
            print("\n" + "="*60)
            print("🚀 STARTING DATABASE INITIALIZATION")
            print("="*60 + "\n")
            
            # Create all tables
            print("📋 Creating database tables...")
            db.create_all()
            print("✅ Database tables created successfully!\n")
            
            # Check if data already exists
            existing_users = User.query.count()
            if existing_users > 0:
                print("⚠️  Database already initialized. Skipping sample data creation.")
                print(f"   Found {existing_users} existing users.\n")
                return True
            
            print("📦 Creating sample data...\n")
            
            # ==================== USERS ====================
            print("👤 Creating users...")
            
            admin = User(
                email='admin@event.com',
                password_hash=generate_password_hash('admin123'),
                name='Admin User',
                role='admin'
            )
            db.session.add(admin)
            db.session.flush()  # Get admin ID
            
            logistics = User(
                email='logistics@event.com',
                password_hash=generate_password_hash('logistics123'),
                name='Logistics Manager',
                role='logistics',
                created_by=admin.id
            )
            db.session.add(logistics)
            
            finance = User(
                email='finance@event.com',
                password_hash=generate_password_hash('finance123'),
                name='Finance Manager',
                role='finance',
                created_by=admin.id
            )
            db.session.add(finance)
            
            print("   ✅ Created 3 users (admin, logistics, finance)")
            
            # ==================== SUPPLIERS ====================
            print("🏢 Creating suppliers...")
            
            suppliers_data = [
                {
                    'name': 'EventPro Solutions',
                    'contact_person': 'Ahmed Ben Ali',
                    'email': 'contact@eventpro.tn',
                    'phone': '+216 71 123 456',
                    'address': '15 Avenue Habib Bourguiba, Tunis 1000'
                },
                {
                    'name': 'TechStand Equipment',
                    'contact_person': 'Sara Mansour',
                    'email': 'info@techstand.tn',
                    'phone': '+216 71 234 567',
                    'address': '42 Rue de la République, Tunis 1001'
                },
                {
                    'name': 'Display & Design Co',
                    'contact_person': 'Mohamed Trabelsi',
                    'email': 'sales@displaydesign.tn',
                    'phone': '+216 71 345 678',
                    'address': '88 Avenue de France, Tunis 1002'
                },
                {
                    'name': 'Furniture Plus',
                    'contact_person': 'Leila Hammami',
                    'email': 'contact@furnitureplus.tn',
                    'phone': '+216 71 456 789',
                    'address': '23 Rue du Lac, Tunis 1003'
                }
            ]
            
            suppliers = []
            for data in suppliers_data:
                supplier = Supplier(**data)
                db.session.add(supplier)
                suppliers.append(supplier)
            
            db.session.flush()
            print(f"   ✅ Created {len(suppliers)} suppliers")
            
            # ==================== CLIENTS ====================
            print("👥 Creating clients...")
            
            clients_data = [
                {
                    'name': 'Tech Innovators SARL',
                    'contact_person': 'Karim Belhadj',
                    'email': 'contact@techinnovators.tn',
                    'phone': '+216 71 555 111',
                    'address': '25 Avenue de la Liberté, Tunis 1002',
                    'company': 'Tech Innovators SARL'
                },
                {
                    'name': 'Elegance Boutique',
                    'contact_person': 'Amira Jaziri',
                    'email': 'info@elegance.tn',
                    'phone': '+216 71 555 222',
                    'address': '18 Rue de Carthage, La Marsa 2070',
                    'company': 'Elegance Boutique'
                },
                {
                    'name': 'Global Trade Corp',
                    'contact_person': 'Mohamed Slim',
                    'email': 'contact@globaltrade.tn',
                    'phone': '+216 71 555 333',
                    'address': '45 Boulevard 9 Avril, Tunis 1001',
                    'company': 'Global Trade Corp'
                }
            ]
            
            clients = []
            for data in clients_data:
                client = Client(**data)
                db.session.add(client)
                clients.append(client)
            
            db.session.flush()
            print(f"   ✅ Created {len(clients)} clients")
            
            # ==================== CATEGORIES ====================
            print("📂 Creating categories...")
            
            categories_data = [
                {'name': 'Mobilier', 'description': 'Tables, chaises, présentoirs'},
                {'name': 'Électronique', 'description': 'Écrans, projecteurs, système audio'},
                {'name': 'Éclairage', 'description': 'Spots, LED, éclairage décoratif'},
                {'name': 'Décoration', 'description': 'Bannières, kakemonos, décorations'},
                {'name': 'Structure', 'description': 'Stands modulaires, cloisons'}
            ]
            
            categories = []
            for data in categories_data:
                category = Category(**data)
                db.session.add(category)
                categories.append(category)
            
            db.session.flush()
            print(f"   ✅ Created {len(categories)} categories")
            
            # ==================== PRODUCTS ====================
            print("📦 Creating products...")
            
            products_data = [
                # Mobilier
                {'name': 'Table Standard 180x80cm', 'category_id': categories[0].id, 'supplier_id': suppliers[0].id, 'unit': 'Pièce', 'price': 25.0, 'pricing_type': 'Par Jour'},
                {'name': 'Chaise Pliante', 'category_id': categories[0].id, 'supplier_id': suppliers[0].id, 'unit': 'Pièce', 'price': 5.0, 'pricing_type': 'Par Jour'},
                {'name': 'Comptoir d\'Accueil', 'category_id': categories[0].id, 'supplier_id': suppliers[3].id, 'unit': 'Pièce', 'price': 120.0, 'pricing_type': 'Par Jour'},
                {'name': 'Présentoir Rotatif', 'category_id': categories[0].id, 'supplier_id': suppliers[3].id, 'unit': 'Pièce', 'price': 80.0, 'pricing_type': 'Par Jour'},
                
                # Électronique
                {'name': 'Écran LED 55"', 'category_id': categories[1].id, 'supplier_id': suppliers[1].id, 'unit': 'Pièce', 'price': 150.0, 'pricing_type': 'Par Jour'},
                {'name': 'Projecteur Full HD', 'category_id': categories[1].id, 'supplier_id': suppliers[1].id, 'unit': 'Pièce', 'price': 200.0, 'pricing_type': 'Par Jour'},
                {'name': 'Système Audio Complet', 'category_id': categories[1].id, 'supplier_id': suppliers[1].id, 'unit': 'Ensemble', 'price': 180.0, 'pricing_type': 'Par Jour'},
                {'name': 'Tablette Tactile pour Présentation', 'category_id': categories[1].id, 'supplier_id': suppliers[1].id, 'unit': 'Pièce', 'price': 60.0, 'pricing_type': 'Par Jour'},
                
                # Éclairage
                {'name': 'Spot LED 50W', 'category_id': categories[2].id, 'supplier_id': suppliers[2].id, 'unit': 'Pièce', 'price': 15.0, 'pricing_type': 'Par Jour'},
                {'name': 'Rampe LED RGB', 'category_id': categories[2].id, 'supplier_id': suppliers[2].id, 'unit': 'Pièce', 'price': 45.0, 'pricing_type': 'Par Jour'},
                {'name': 'Projecteur Architectural', 'category_id': categories[2].id, 'supplier_id': suppliers[2].id, 'unit': 'Pièce', 'price': 90.0, 'pricing_type': 'Par Jour'},
                
                # Décoration
                {'name': 'Kakémono 200x80cm', 'category_id': categories[3].id, 'supplier_id': suppliers[2].id, 'unit': 'Pièce', 'price': 35.0, 'pricing_type': 'Par Jour'},
                {'name': 'Bannière Publicitaire 3x1m', 'category_id': categories[3].id, 'supplier_id': suppliers[2].id, 'unit': 'Pièce', 'price': 50.0, 'pricing_type': 'Par Jour'},
                {'name': 'Plante Décorative Artificielle', 'category_id': categories[3].id, 'supplier_id': suppliers[3].id, 'unit': 'Pièce', 'price': 20.0, 'pricing_type': 'Par Jour'},
                
                # Structure
                {'name': 'Stand Modulaire 3x3m', 'category_id': categories[4].id, 'supplier_id': suppliers[0].id, 'unit': 'Ensemble', 'price': 450.0, 'pricing_type': 'Forfait'},
                {'name': 'Cloison Démontable 2m', 'category_id': categories[4].id, 'supplier_id': suppliers[0].id, 'unit': 'Pièce', 'price': 40.0, 'pricing_type': 'Par Jour'},
                {'name': 'Toit pour Stand 3x3m', 'category_id': categories[4].id, 'supplier_id': suppliers[0].id, 'unit': 'Ensemble', 'price': 100.0, 'pricing_type': 'Forfait'},
            ]
            
            products = []
            for data in products_data:
                product = Product(**data)
                db.session.add(product)
                products.append(product)
            
            db.session.flush()
            print(f"   ✅ Created {len(products)} products")
            
            # ==================== STANDS ====================
            print("🏛️  Creating sample stands...")
            
            stands_data = [
                {
                    'name': 'Stand Tech Innovators',
                    'client_id': clients[0].id,
                    'description': 'Stand 3x3m pour Tunisia Tech Summit 2025',
                    'status': 'draft',
                    'total_amount': 0.0,
                    'created_by': admin.id
                },
                {
                    'name': 'Stand Fashion Week',
                    'client_id': clients[1].id,
                    'description': 'Stand 4x4m pour Tunisia Fashion Week',
                    'status': 'validated_logistics',
                    'total_amount': 0.0,
                    'created_by': admin.id,
                    'validated_logistics_by': logistics.id
                }
            ]
            
            stands = []
            for data in stands_data:
                stand = Stand(**data)
                db.session.add(stand)
                stands.append(stand)
            
            db.session.flush()
            print(f"   ✅ Created {len(stands)} sample stands")
            
            # Commit all changes
            db.session.commit()
            
            print("\n" + "="*60)
            print("✅ DATABASE INITIALIZATION COMPLETE!")
            print("="*60)
            print("\n📊 SUMMARY:")
            print(f"   • {len(suppliers)} Suppliers")
            print(f"   • {len(clients)} Clients")
            print(f"   • {len(categories)} Categories")
            print(f"   • {len(products)} Products")
            print(f"   • {len(stands)} Sample Stands")
            print(f"   • 3 Users (Admin, Logistics, Finance)")
            
            print("\n🔑 LOGIN CREDENTIALS:")
            print("   " + "-"*56)
            print("   | Role       | Email                 | Password      |")
            print("   " + "-"*56)
            print("   | Admin      | admin@event.com       | admin123      |")
            print("   | Logistics  | logistics@event.com   | logistics123  |")
            print("   | Finance    | finance@event.com     | finance123    |")
            print("   " + "-"*56)
            
            print("\n🎉 Your application is ready to use!")
            print("   Visit your frontend URL and login with any credentials above.\n")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ ERROR during initialization: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    success = init_database_with_samples()
    if not success:
        exit(1)
