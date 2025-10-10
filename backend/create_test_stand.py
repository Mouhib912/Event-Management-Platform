"""
Script to create a test stand for demonstration
"""
from app import app, db, Stand, StandItem, User, Product

def create_test_stand():
    with app.app_context():
        # Get the owner user
        user = User.query.filter_by(email='owner@eventmanagement.com').first()
        if not user:
            print("❌ User not found. Run init_sample_data.py first.")
            return
        
        # Get some products
        products = Product.query.limit(3).all()
        if len(products) < 3:
            print("❌ Not enough products. Run init_sample_data.py first.")
            return
        
        # Check if test stand already exists
        existing = Stand.query.filter_by(name='Stand Test Demo').first()
        if existing:
            print("⚠️  Test stand already exists. Deleting it first...")
            # Delete associated items first
            StandItem.query.filter_by(stand_id=existing.id).delete()
            db.session.delete(existing)
            db.session.commit()
        
        # Create a new stand
        stand = Stand(
            name='Stand Test Demo',
            description='Stand de démonstration pour tester le workflow de validation',
            status='draft',  # Starts as draft
            created_by=user.id
        )
        
        # Add items to the stand
        total_amount = 0
        items_data = [
            {'product': products[0], 'quantity': 2, 'days': 3},
            {'product': products[1], 'quantity': 1, 'days': 1},
            {'product': products[2], 'quantity': 3, 'days': 2}
        ]
        
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            days = item_data['days']
            
            # Calculate price based on pricing type
            if product.pricing_type == 'Par Jour':
                unit_price = product.price
                item_total = unit_price * quantity * days
            else:
                unit_price = product.price
                item_total = unit_price * quantity
            
            total_amount += item_total
            
            item = StandItem(
                product_id=product.id,
                quantity=quantity,
                days=days,
                unit_price=unit_price,
                total_price=item_total
            )
            stand.items.append(item)
        
        stand.total_amount = total_amount
        
        db.session.add(stand)
        db.session.commit()
        
        print("✅ Test stand created successfully!")
        print(f"   - Stand ID: {stand.id}")
        print(f"   - Name: {stand.name}")
        print(f"   - Status: {stand.status}")
        print(f"   - Items: {len(stand.items)}")
        print(f"   - Total: {stand.total_amount:.2f} TND")
        print("\n📝 Workflow to approve this stand:")
        print("   1. Go to 'Catalogue des Stands'")
        print("   2. Click 'Valider Logistique' (as Owner or Logistique role)")
        print("   3. Click 'Valider Finance' (as Owner or Finance role)")
        print("   4. Stand becomes 'approved' and can be used in Achat module!")

if __name__ == '__main__':
    create_test_stand()
