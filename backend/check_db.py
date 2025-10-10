"""
Quick script to check database contents
"""
from app import app, db, User, Category, Supplier, Product

def check_database():
    with app.app_context():
        print("=" * 50)
        print("DATABASE STATUS CHECK")
        print("=" * 50)
        
        # Check users
        users = User.query.all()
        print(f"\n✓ Users: {len(users)}")
        for user in users:
            print(f"   - {user.name} ({user.email}) - Role: {user.role}")
        
        # Check categories
        categories = Category.query.all()
        print(f"\n✓ Categories: {len(categories)}")
        for cat in categories:
            print(f"   - {cat.name}: {cat.description}")
        
        # Check suppliers
        suppliers = Supplier.query.all()
        print(f"\n✓ Suppliers: {len(suppliers)}")
        for sup in suppliers:
            print(f"   - {sup.name} ({sup.email})")
        
        # Check products
        products = Product.query.all()
        print(f"\n✓ Products: {len(products)}")
        for prod in products:
            print(f"   - {prod.name}: {prod.price} TND ({prod.pricing_type})")
            print(f"     Category: {prod.category.name}, Supplier: {prod.supplier.name}")
        
        print("\n" + "=" * 50)
        print("✅ DATABASE IS WORKING!")
        print("=" * 50)

if __name__ == '__main__':
    check_database()
