"""
Initialize the database with sample data for testing
"""
from app import app, db, User, Category, Supplier, Product
from werkzeug.security import generate_password_hash

def init_sample_data():
    with app.app_context():
        # Create tables
        db.create_all()
        print("✓ Database tables created")
        
        # Check if owner exists
        owner = User.query.filter_by(email='owner@eventmanagement.com').first()
        if not owner:
            owner = User(
                email='owner@eventmanagement.com',
                password_hash=generate_password_hash('owner123'),
                name='System Owner',
                role='Propriétaire'
            )
            db.session.add(owner)
            db.session.commit()
            print("✓ Owner user created")
        
        # Create categories if they don't exist
        categories_data = [
            {'name': 'Audiovisuel', 'description': 'Équipements audio et vidéo pour événements'},
            {'name': 'Structure', 'description': 'Structures modulaires et stands'},
            {'name': 'Éclairage', 'description': 'Systèmes d\'éclairage événementiel'},
            {'name': 'Mobilier', 'description': 'Mobilier pour événements'},
            {'name': 'Décoration', 'description': 'Éléments décoratifs'}
        ]
        
        for cat_data in categories_data:
            if not Category.query.filter_by(name=cat_data['name']).first():
                category = Category(
                    name=cat_data['name'],
                    description=cat_data['description'],
                    created_by=owner.id
                )
                db.session.add(category)
        
        db.session.commit()
        print("✓ Categories created")
        
        # Create suppliers if they don't exist
        suppliers_data = [
            {
                'name': 'TechnoDisplay Solutions',
                'contact_person': 'Ahmed Ben Ali',
                'email': 'contact@technodisplay.tn',
                'phone': '+216 71 123 456',
                'address': 'Zone Industrielle, Tunis'
            },
            {
                'name': 'StandMaster',
                'contact_person': 'Fatma Karray',
                'email': 'info@standmaster.fr',
                'phone': '+33 1 98 76 54 32',
                'address': 'Paris, France'
            },
            {
                'name': 'LightTech',
                'contact_person': 'Mohamed Trabelsi',
                'email': 'sales@lighttech.tn',
                'phone': '+216 71 234 567',
                'address': 'Ariana, Tunisia'
            },
            {
                'name': 'EventPro Services',
                'contact_person': 'Sarah Mansour',
                'email': 'contact@eventpro.tn',
                'phone': '+216 71 345 678',
                'address': 'Sfax, Tunisia'
            },
            {
                'name': 'DecoEvent',
                'contact_person': 'Karim Bouazizi',
                'email': 'deco@decoevent.tn',
                'phone': '+216 71 456 789',
                'address': 'Sousse, Tunisia'
            }
        ]
        
        for sup_data in suppliers_data:
            if not Supplier.query.filter_by(name=sup_data['name']).first():
                supplier = Supplier(
                    name=sup_data['name'],
                    contact_person=sup_data['contact_person'],
                    email=sup_data['email'],
                    phone=sup_data['phone'],
                    address=sup_data['address'],
                    created_by=owner.id
                )
                db.session.add(supplier)
        
        db.session.commit()
        print("✓ Suppliers created")
        
        # Create sample products if they don't exist
        audiovisuel = Category.query.filter_by(name='Audiovisuel').first()
        structure = Category.query.filter_by(name='Structure').first()
        eclairage = Category.query.filter_by(name='Éclairage').first()
        mobilier = Category.query.filter_by(name='Mobilier').first()
        decoration = Category.query.filter_by(name='Décoration').first()
        
        technodisplay = Supplier.query.filter_by(name='TechnoDisplay Solutions').first()
        standmaster = Supplier.query.filter_by(name='StandMaster').first()
        lighttech = Supplier.query.filter_by(name='LightTech').first()
        eventpro = Supplier.query.filter_by(name='EventPro Services').first()
        decoevent = Supplier.query.filter_by(name='DecoEvent').first()
        
        products_data = [
            {
                'name': 'Écran LED 55"',
                'description': 'Écran LED haute définition 55 pouces',
                'category': audiovisuel,
                'supplier': technodisplay,
                'unit': 'Unité',
                'price': 450.0,
                'pricing_type': 'Par Jour'
            },
            {
                'name': 'Stand Modulaire 3x3',
                'description': 'Structure modulaire 3x3 mètres',
                'category': structure,
                'supplier': standmaster,
                'unit': 'm²',
                'price': 1200.0,
                'pricing_type': 'Par Événement'
            },
            {
                'name': 'Éclairage LED Spot',
                'description': 'Projecteur LED orientable',
                'category': eclairage,
                'supplier': lighttech,
                'unit': 'Unité',
                'price': 85.0,
                'pricing_type': 'Par Jour'
            },
            {
                'name': 'Comptoir d\'Accueil',
                'description': 'Comptoir d\'accueil design moderne',
                'category': mobilier,
                'supplier': eventpro,
                'unit': 'Unité',
                'price': 200.0,
                'pricing_type': 'Par Événement'
            },
            {
                'name': 'Tapis Rouge',
                'description': 'Tapis rouge événementiel',
                'category': decoration,
                'supplier': decoevent,
                'unit': 'mLn',
                'price': 25.0,
                'pricing_type': 'Par Événement'
            },
            {
                'name': 'Projecteur HD',
                'description': 'Projecteur haute définition 1080p',
                'category': audiovisuel,
                'supplier': technodisplay,
                'unit': 'Unité',
                'price': 180.0,
                'pricing_type': 'Par Jour'
            },
            {
                'name': 'Chaise Design',
                'description': 'Chaise moderne et confortable',
                'category': mobilier,
                'supplier': eventpro,
                'unit': 'Unité',
                'price': 25.0,
                'pricing_type': 'Par Jour'
            },
            {
                'name': 'Table Haute',
                'description': 'Table haute pour cocktail',
                'category': mobilier,
                'supplier': eventpro,
                'unit': 'Unité',
                'price': 45.0,
                'pricing_type': 'Par Jour'
            }
        ]
        
        for prod_data in products_data:
            if not Product.query.filter_by(name=prod_data['name']).first():
                product = Product(
                    name=prod_data['name'],
                    description=prod_data['description'],
                    category_id=prod_data['category'].id,
                    supplier_id=prod_data['supplier'].id,
                    unit=prod_data['unit'],
                    price=prod_data['price'],
                    pricing_type=prod_data['pricing_type'],
                    created_by=owner.id
                )
                db.session.add(product)
        
        db.session.commit()
        print("✓ Sample products created")
        
        print("\n✅ Database initialized successfully!")
        print(f"   - Owner: owner@eventmanagement.com / owner123")
        print(f"   - Categories: {Category.query.count()}")
        print(f"   - Suppliers: {Supplier.query.count()}")
        print(f"   - Products: {Product.query.count()}")

if __name__ == '__main__':
    init_sample_data()
