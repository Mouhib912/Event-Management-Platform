from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.units import cm
import io
import os
import base64

app = Flask(__name__)

# Configuration - use environment variables for production
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///event_management.db')
# Handle PostgreSQL URL from Render
if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-string-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_IDENTITY_CLAIM'] = 'sub'  # Allow integer identities

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
# CORS configuration for production
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
CORS(app, resources={r"/*": {"origins": [FRONTEND_URL, "http://localhost:5173"]}})

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

class Supplier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(100))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    status = db.Column(db.String(20), default='Actif')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String(20), default='#8884d8')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.id'), nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    price = db.Column(db.Float, nullable=False)
    pricing_type = db.Column(db.String(20), nullable=False)  # 'Par Jour' or 'Forfait'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    category = db.relationship('Category', backref='products')
    supplier = db.relationship('Supplier', backref='products')

class Stand(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='draft')  # draft, validated_logistics, validated_finance, approved
    total_amount = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    validated_logistics_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    validated_finance_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_stands')

class StandItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    stand_id = db.Column(db.Integer, db.ForeignKey('stand.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    days = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    
    stand = db.relationship('Stand', backref='items')
    product = db.relationship('Product', backref='stand_items')

class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    stand_id = db.Column(db.Integer, db.ForeignKey('stand.id'), nullable=True)  # Optional - not all purchases are for stands
    purchase_number = db.Column(db.String(20), unique=True, nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, sent
    notes = db.Column(db.Text, nullable=True)  # Optional notes about the purchase
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    stand = db.relationship('Stand', backref='purchases')
    supplier = db.relationship('Supplier', backref='purchases')
    creator = db.relationship('User', backref='created_purchases')

class PurchaseItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    purchase_id = db.Column(db.Integer, db.ForeignKey('purchase.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    days = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    
    purchase = db.relationship('Purchase', backref='items')
    product = db.relationship('Product', backref='purchase_items')

class Invoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(20), unique=True, nullable=False)
    stand_id = db.Column(db.Integer, db.ForeignKey('stand.id'), nullable=False)
    client_name = db.Column(db.String(100), nullable=False)
    client_email = db.Column(db.String(120))
    client_phone = db.Column(db.String(20))
    client_address = db.Column(db.Text)
    total_ht = db.Column(db.Float, nullable=False)
    tva_amount = db.Column(db.Float, nullable=False)
    total_ttc = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, paid, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    stand = db.relationship('Stand', backref='invoices')
    creator = db.relationship('User', backref='created_invoices')

# Health Check Route for Render
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render deployment"""
    try:
        # Check database connection
        db.session.execute('SELECT 1')
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Authentication Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user:
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        })
    
    return jsonify({'message': 'User not found'}), 404

@app.route('/api/auth/register', methods=['POST'])
@jwt_required()
def register():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only owners can create users
    if current_user.role != 'Propriétaire':
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists'}), 400
    
    user = User(
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        name=data['name'],
        role=data['role'],
        created_by=current_user_id
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

# Supplier Routes
@app.route('/api/suppliers', methods=['GET'])
@jwt_required()
def get_suppliers():
    try:
        suppliers = Supplier.query.all()
        return jsonify([{
            'id': s.id,
            'name': s.name,
            'contact_person': s.contact_person,
            'email': s.email,
            'phone': s.phone,
            'address': s.address,
            'status': s.status if hasattr(s, 'status') else 'Actif',
            'created_at': s.created_at.isoformat() if s.created_at else None
        } for s in suppliers])
    except Exception as e:
        print(f"Error in get_suppliers: {str(e)}")
        return jsonify({'message': f'Error fetching suppliers: {str(e)}'}), 500

@app.route('/api/suppliers', methods=['POST'])
@jwt_required()
def create_supplier():
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        # Only owners can create suppliers
        if current_user.role != 'Propriétaire':
            return jsonify({'message': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        supplier = Supplier(
            name=data['name'],
            contact_person=data.get('contact_person'),
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            status=data.get('status', 'Actif'),
            created_by=current_user_id
        )
        
        db.session.add(supplier)
        db.session.commit()
        
        return jsonify({'message': 'Supplier created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error in create_supplier: {str(e)}")
        return jsonify({'message': f'Error creating supplier: {str(e)}'}), 500

@app.route('/api/suppliers/<int:supplier_id>', methods=['PUT'])
@jwt_required()
def update_supplier(supplier_id):
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        # Only owners can update suppliers
        if current_user.role != 'Propriétaire':
            return jsonify({'message': 'Unauthorized'}), 403
        
        supplier = Supplier.query.get_or_404(supplier_id)
        data = request.get_json()
        
        supplier.name = data.get('name', supplier.name)
        supplier.contact_person = data.get('contact_person', supplier.contact_person)
        supplier.email = data.get('email', supplier.email)
        supplier.phone = data.get('phone', supplier.phone)
        supplier.address = data.get('address', supplier.address)
        if 'status' in data:
            supplier.status = data.get('status', supplier.status)
        
        db.session.commit()
        
        return jsonify({'message': 'Supplier updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_supplier: {str(e)}")
        return jsonify({'message': f'Error updating supplier: {str(e)}'}), 500
    
    return jsonify({'message': 'Supplier updated successfully'})

@app.route('/api/suppliers/<int:supplier_id>', methods=['DELETE'])
@jwt_required()
def delete_supplier(supplier_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only owners can delete suppliers
    if current_user.role != 'Propriétaire':
        return jsonify({'message': 'Unauthorized'}), 403
    
    supplier = Supplier.query.get_or_404(supplier_id)
    db.session.delete(supplier)
    db.session.commit()
    
    return jsonify({'message': 'Supplier deleted successfully'})

# Category Routes
@app.route('/api/categories', methods=['GET'])
@jwt_required()
def get_categories():
    try:
        categories = Category.query.all()
        result = []
        for c in categories:
            # Count products in this category
            product_count = Product.query.filter_by(category_id=c.id).count()
            result.append({
                'id': c.id,
                'name': c.name,
                'description': c.description,
                'color': c.color if hasattr(c, 'color') else '#8884d8',
                'product_count': product_count,
                'created_at': c.created_at.isoformat() if c.created_at else None
            })
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_categories: {str(e)}")
        return jsonify({'message': f'Error fetching categories: {str(e)}'}), 500

@app.route('/api/categories', methods=['POST'])
@jwt_required()
def create_category():
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        # Only owners can create categories
        if current_user.role != 'Propriétaire':
            return jsonify({'message': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        category = Category(
            name=data['name'],
            description=data.get('description'),
            color=data.get('color', '#8884d8'),
            created_by=current_user_id
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({'message': 'Category created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error in create_category: {str(e)}")
        return jsonify({'message': f'Error creating category: {str(e)}'}), 500

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        # Only owners can update categories
        if current_user.role != 'Propriétaire':
            return jsonify({'message': 'Unauthorized'}), 403
        
        category = Category.query.get_or_404(category_id)
        data = request.get_json()
        
        category.name = data.get('name', category.name)
        category.description = data.get('description', category.description)
        if 'color' in data:
            category.color = data.get('color', category.color)
        
        db.session.commit()
        
        return jsonify({'message': 'Category updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_category: {str(e)}")
        return jsonify({'message': f'Error updating category: {str(e)}'}), 500
    
    db.session.commit()
    
    return jsonify({'message': 'Category updated successfully'})

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only owners can delete categories
    if current_user.role != 'Propriétaire':
        return jsonify({'message': 'Unauthorized'}), 403
    
    category = Category.query.get_or_404(category_id)
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({'message': 'Category deleted successfully'})

# Product Routes
@app.route('/api/products', methods=['GET'])
@jwt_required()
def get_products():
    products = Product.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'category_id': p.category_id,
        'category_name': p.category.name,
        'supplier_id': p.supplier_id,
        'supplier_name': p.supplier.name,
        'unit': p.unit,
        'price': p.price,
        'pricing_type': p.pricing_type,
        'created_at': p.created_at.isoformat()
    } for p in products])

@app.route('/api/products', methods=['POST'])
@jwt_required()
def create_product():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only owners can create products
    if current_user.role != 'Propriétaire':
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    product = Product(
        name=data['name'],
        description=data.get('description'),
        category_id=data['category_id'],
        supplier_id=data['supplier_id'],
        unit=data['unit'],
        price=data['price'],
        pricing_type=data['pricing_type'],
        created_by=current_user_id
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify({'message': 'Product created successfully'}), 201

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only owners can update products
    if current_user.role != 'Propriétaire':
        return jsonify({'message': 'Unauthorized'}), 403
    
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    
    product.name = data.get('name', product.name)
    product.description = data.get('description', product.description)
    product.category_id = data.get('category_id', product.category_id)
    product.supplier_id = data.get('supplier_id', product.supplier_id)
    product.unit = data.get('unit', product.unit)
    product.price = data.get('price', product.price)
    product.pricing_type = data.get('pricing_type', product.pricing_type)
    
    db.session.commit()
    
    return jsonify({'message': 'Product updated successfully'})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only owners can delete products
    if current_user.role != 'Propriétaire':
        return jsonify({'message': 'Unauthorized'}), 403
    
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({'message': 'Product deleted successfully'})

# Stand Routes
@app.route('/api/stands', methods=['GET'])
@jwt_required()
def get_stands():
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if current_user.role == 'Visiteur':
            stands = Stand.query.filter_by(status='approved').all()
        else:
            stands = Stand.query.all()
        
        result = []
        for s in stands:
            stand_data = {
                'id': s.id,
                'name': s.name,
                'description': s.description,
                'status': s.status,
                'total_amount': s.total_amount,
                'total': s.total_amount,  # Alias for frontend compatibility
                'created_at': s.created_at.isoformat(),
                'creator': s.creator.name,
                'items': [{
                    'id': item.id,
                    'product_id': item.product_id,
                    'product_name': item.product.name if item.product else 'Unknown',
                    'category_name': item.product.category.name if item.product and item.product.category else 'N/A',
                    'supplier_name': item.product.supplier.name if item.product and item.product.supplier else 'N/A',
                    'quantity': item.quantity,
                    'days': item.days,
                    'unit_price': item.unit_price,
                    'total_price': item.total_price
                } for item in s.items]
            }
            result.append(stand_data)
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_stands: {str(e)}")
        return jsonify({'message': f'Error fetching stands: {str(e)}'}), 500

@app.route('/api/stands', methods=['POST'])
@jwt_required()
def create_stand():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only Commercial and Propriétaire can create stands
    if current_user.role not in ['Commercial', 'Propriétaire']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    stand = Stand(
        name=data['name'],
        description=data.get('description'),
        total_amount=data['total_amount'],
        created_by=current_user_id
    )
    
    db.session.add(stand)
    db.session.flush()  # Get the stand ID
    
    # Add stand items
    for item_data in data['items']:
        item = StandItem(
            stand_id=stand.id,
            product_id=item_data['product_id'],
            quantity=item_data['quantity'],
            days=item_data.get('days', 1),
            unit_price=item_data['unit_price'],
            total_price=item_data['total_price']
        )
        db.session.add(item)
    
    db.session.commit()
    
    return jsonify({'message': 'Stand created successfully', 'stand_id': stand.id}), 201

@app.route('/api/stands/<int:stand_id>/validate-logistics', methods=['POST'])
@jwt_required()
def validate_logistics(stand_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only Logistique and Propriétaire can validate logistics
    if current_user.role not in ['Logistique', 'Propriétaire']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    stand = Stand.query.get_or_404(stand_id)
    stand.validated_logistics_by = current_user_id
    
    if stand.status == 'draft':
        stand.status = 'validated_logistics'
    
    db.session.commit()
    
    return jsonify({'message': 'Logistics validation completed'})

@app.route('/api/stands/<int:stand_id>/validate-finance', methods=['POST'])
@jwt_required()
def validate_finance(stand_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only Finance and Propriétaire can validate finance
    if current_user.role not in ['Finance', 'Propriétaire']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    stand = Stand.query.get_or_404(stand_id)
    stand.validated_finance_by = current_user_id
    
    if stand.status == 'validated_logistics':
        stand.status = 'approved'
    elif stand.status == 'draft':
        stand.status = 'validated_finance'
    
    db.session.commit()
    
    return jsonify({'message': 'Finance validation completed'})

# Purchase Routes
@app.route('/api/purchases', methods=['GET'])
@jwt_required()
def get_purchases():
    try:
        purchases = Purchase.query.all()
        return jsonify([{
            'id': p.id,
            'purchase_number': p.purchase_number,
            'stand_name': p.stand.name if p.stand else 'N/A',
            'supplier_name': p.supplier.name if p.supplier else 'N/A',
            'total_amount': p.total_amount,
            'status': p.status,
            'created_at': p.created_at.isoformat(),
            'creator': p.creator.name if p.creator else 'N/A'
        } for p in purchases])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/purchases', methods=['POST'])
@jwt_required()
def create_purchase():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Generate purchase number
    purchase_count = Purchase.query.count() + 1
    purchase_number = f"BC-{datetime.now().year}-{purchase_count:03d}"
    
    purchase = Purchase(
        stand_id=data.get('stand_id'),  # Optional
        purchase_number=purchase_number,
        supplier_id=data['supplier_id'],
        total_amount=data['total_amount'],
        notes=data.get('notes'),  # Optional notes
        created_by=current_user_id
    )
    
    db.session.add(purchase)
    db.session.flush()
    
    # Add purchase items
    for item_data in data['items']:
        item = PurchaseItem(
            purchase_id=purchase.id,
            product_id=item_data['product_id'],
            quantity=item_data['quantity'],
            days=item_data.get('days', 1),
            unit_price=item_data['unit_price'],
            total_price=item_data['total_price']
        )
        db.session.add(item)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Purchase created successfully',
        'purchase_id': purchase.id,
        'purchase_number': purchase_number
    }), 201

# PDF Generation
def generate_purchase_pdf(purchase_id):
    purchase = Purchase.query.get_or_404(purchase_id)
    
    # Create PDF buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        topMargin=1*cm, 
        bottomMargin=1*cm,
        leftMargin=1.5*cm,
        rightMargin=1.5*cm
    )
    
    # Custom styles
    styles = getSampleStyleSheet()
    
    # Title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.black,
        spaceAfter=3,
        alignment=0,
        fontName='Helvetica-Bold'
    )
    
    # Header label style
    header_label_style = ParagraphStyle(
        'HeaderLabel',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.black,
        fontName='Helvetica-Bold',
        spaceAfter=1
    )
    
    # Content
    content = []
    
    # ===== HEADER SECTION =====
    # Logo and title
    # Try to load logo
    logo_path = os.path.join(os.path.dirname(__file__), 'static', 'logo.png')
    
    if os.path.exists(logo_path):
        try:
            # Create logo with proper sizing (maintain aspect ratio)
            logo = RLImage(logo_path, width=3*cm, height=1.5*cm)
            print(f"✓ Logo loaded successfully from {logo_path}")
            
            logo_title_data = [
                [
                    logo,
                    Paragraph('<b>BON DE COMMANDE</b>', title_style)
                ]
            ]
        except Exception as e:
            print(f"✗ Error loading logo: {e}")
            # Fallback to text logo
            logo_title_data = [
                [
                    Paragraph('<b>[LOGO]</b><br/><font size="7">EVENT MANAGEMENT</font>', styles['Normal']),
                    Paragraph('<b>BON DE COMMANDE</b>', title_style)
                ]
            ]
    else:
        print(f"ℹ Logo not found at {logo_path}, using text placeholder")
        # Fallback to text logo
        logo_title_data = [
            [
                Paragraph('<b>[LOGO]</b><br/><font size="7">EVENT MANAGEMENT</font>', styles['Normal']),
                Paragraph('<b>BON DE COMMANDE</b>', title_style)
            ]
        ]
    
    logo_title_table = Table(logo_title_data, colWidths=[5*cm, 13*cm])
    logo_title_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    content.append(logo_title_table)
    content.append(Spacer(1, 5))
    
    # ===== BON DE COMMANDE INFO BOX =====
    # Build info line with optional stand reference
    info_parts = [
        f'<b>N°: {purchase.purchase_number}</b>',
        f'<b>DATE:</b> {purchase.created_at.strftime("%d/%m/%Y")}'
    ]
    
    # Add stand reference if purchase is linked to a stand
    if purchase.stand:
        info_parts.append(f'<b>STAND:</b> {purchase.stand.name}')
    
    info_parts.append('<b>ÉCHÉANCE: À RÉCEPTION</b>')
    
    bc_info_data = [
        [
            Paragraph(' | '.join(info_parts), styles['Normal']),
        ]
    ]
    
    bc_info_table = Table(bc_info_data, colWidths=[18*cm])
    bc_info_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    content.append(bc_info_table)
    content.append(Spacer(1, 8))
    
    # ===== EMETTEUR / DESTINATAIRE SECTION =====
    supplier_name = purchase.supplier.name if purchase.supplier else 'Fournisseur inconnu'
    supplier_email = purchase.supplier.email if purchase.supplier else 'N/A'
    supplier_phone = purchase.supplier.phone if purchase.supplier else 'N/A'
    supplier_address = purchase.supplier.address if purchase.supplier else 'N/A'
    
    emetteur_dest_data = [
        [
            Paragraph('<b>ÉMETTEUR:</b>', styles['Normal']),
            Paragraph('<b>DESTINATAIRE:</b>', styles['Normal'])
        ],
        [
            Paragraph('Event Management Platform', styles['Normal']),
            Paragraph(supplier_name, styles['Normal'])
        ],
        [
            Paragraph('contact@eventmanagement.com', styles['Normal']),
            Paragraph(supplier_email, styles['Normal'])
        ],
        [
            Paragraph('Tél: +216 71 XXX XXX', styles['Normal']),
            Paragraph(f'Tél: {supplier_phone}', styles['Normal'])
        ],
        [
            Paragraph('123 Avenue de la République<br/>Tunis, 1000', styles['Normal']),
            Paragraph(supplier_address, styles['Normal'])
        ]
    ]
    
    emetteur_dest_table = Table(emetteur_dest_data, colWidths=[9*cm, 9*cm])
    emetteur_dest_table.setStyle(TableStyle([
        # Emetteur box
        ('BOX', (0, 0), (0, -1), 1, colors.black),
        ('BACKGROUND', (0, 0), (0, 0), colors.lightgrey),
        # Destinataire box
        ('BOX', (1, 0), (1, -1), 1, colors.black),
        ('BACKGROUND', (1, 0), (1, 0), colors.lightgrey),
        # General styling
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
    ]))
    
    content.append(emetteur_dest_table)
    content.append(Spacer(1, 8))
    
    # ===== ITEMS TABLE =====
    items_data = [
        [
            Paragraph('<b>DESCRIPTION</b>', styles['Normal']),
            Paragraph('<b>QUANTITÉ</b>', styles['Normal']),
            Paragraph('<b>PRIX UNITAIRE</b>', styles['Normal']),
            Paragraph('<b>TOTAL HT</b>', styles['Normal'])
        ]
    ]
    
    # Add items
    for item in purchase.items:
        product_name = item.product.name if item.product else 'Produit inconnu'
        pricing_type = item.product.pricing_type if item.product else 'Par Événement'
        
        description = product_name
        if pricing_type == 'Par Jour' and item.days > 1:
            description += f" ({item.days} jours)"
        
        items_data.append([
            Paragraph(description, styles['Normal']),
            Paragraph(str(item.quantity), styles['Normal']),
            Paragraph(f'{item.unit_price:.2f} TND', styles['Normal']),
            Paragraph(f'<b>{item.total_price:.2f} TND</b>', styles['Normal'])
        ])
    
    # Add totals
    tva_amount = purchase.total_amount * 0.19
    total_ttc = purchase.total_amount * 1.19
    
    items_data.extend([
        ['', '', Paragraph('<b>TOTAL HT:</b>', styles['Normal']), Paragraph(f'<b>{purchase.total_amount:.2f} TND</b>', styles['Normal'])],
        ['', '', Paragraph('<b>TVA (19%):</b>', styles['Normal']), Paragraph(f'<b>{tva_amount:.2f} TND</b>', styles['Normal'])],
        ['', '', Paragraph('<b>REMISE:</b>', styles['Normal']), Paragraph('<b>-</b>', styles['Normal'])],
        ['', '', Paragraph('<b>TOTAL TTC:</b>', styles['Normal']), Paragraph(f'<b>{total_ttc:.2f} TND</b>', styles['Normal'])],
    ])
    
    items_table = Table(items_data, colWidths=[7*cm, 3*cm, 4*cm, 4*cm])
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        # Items rows
        ('ALIGN', (0, 1), (0, -5), 'LEFT'),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        # Grid
        ('GRID', (0, 0), (-1, -5), 0.5, colors.grey),
        # Totals section
        ('BACKGROUND', (0, -4), (-1, -1), colors.whitesmoke),
        ('FONTNAME', (2, -4), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN', (2, -4), (-1, -1), 'RIGHT'),
        ('ALIGN', (3, -4), (-1, -1), 'RIGHT'),
        ('LINEABOVE', (2, -4), (-1, -4), 1, colors.black),
        ('LINEABOVE', (2, -1), (-1, -1), 1.5, colors.black),
        # Padding
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    content.append(items_table)
    content.append(Spacer(1, 10))
    
    # ===== TERMS & CONDITIONS SECTION =====
    terms_conditions_data = [
        [
            Paragraph('<b>RÈGLEMENT:</b>', styles['Normal']),
            Paragraph('<b>TERMES & CONDITIONS</b>', styles['Normal'])
        ],
        [
            Paragraph('<b>Par virement bancaire:</b><br/>Banque: Banque de Tunisie<br/>IBAN: TN59 XXXX XXXX XXXX XXXX XXXX<br/>BIC: BTUNTNTT', styles['Normal']),
            Paragraph('En cas de retard de paiement, et conformément au code<br/>de commerce, une indemnité calculée à trois fois le taux<br/>de l\'intérêt légal ainsi qu\'une indemnité forfaitaire pour<br/>frais de recouvrement de 40 dinars sont exigibles.<br/><br/>Conditions générales de vente consultables sur le site:<br/>www.eventmanagement.tn', styles['Normal'])
        ]
    ]
    
    terms_table = Table(terms_conditions_data, colWidths=[9*cm, 9*cm])
    terms_table.setStyle(TableStyle([
        # Header row
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        # General styling
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
    ]))
    
    content.append(terms_table)
    content.append(Spacer(1, 8))
    
    # Footer note
    footer_text = Paragraph(
        '<font size="7"><i>Merci pour votre confiance. Pour toute question concernant ce bon de commande, veuillez nous contacter.</i></font>',
        styles['Normal']
    )
    content.append(footer_text)
    
    # Build PDF
    doc.build(content)
    buffer.seek(0)
    
    return buffer

@app.route('/api/purchases/<int:purchase_id>/pdf', methods=['GET'])
@jwt_required()
def download_purchase_pdf(purchase_id):
    try:
        purchase = Purchase.query.get_or_404(purchase_id)
        
        # Verify purchase has items
        if not purchase.items:
            return jsonify({'error': 'Purchase has no items'}), 400
        
        # Verify supplier exists
        if not purchase.supplier:
            return jsonify({'error': 'Purchase supplier not found'}), 400
            
        pdf_buffer = generate_purchase_pdf(purchase_id)
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f"facture_{purchase.purchase_number}.pdf",
            mimetype='application/pdf'
        )
    except Exception as e:
        print(f"Error generating PDF for purchase {purchase_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ===== INVOICE ENDPOINTS =====
@app.route('/api/invoices', methods=['GET'])
@jwt_required()
def get_invoices():
    invoices = Invoice.query.order_by(Invoice.created_at.desc()).all()
    return jsonify([{
        'id': inv.id,
        'invoice_number': inv.invoice_number,
        'stand_id': inv.stand_id,
        'stand_name': inv.stand.name if inv.stand else None,
        'client_name': inv.client_name,
        'client_email': inv.client_email,
        'client_phone': inv.client_phone,
        'total_ht': inv.total_ht,
        'tva_amount': inv.tva_amount,
        'total_ttc': inv.total_ttc,
        'status': inv.status,
        'created_at': inv.created_at.isoformat(),
        'created_by': inv.created_by
    } for inv in invoices])

@app.route('/api/invoices', methods=['POST'])
@jwt_required()
def create_invoice():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Verify stand exists and is approved
    stand = Stand.query.get_or_404(data['stand_id'])
    if stand.status != 'approved':
        return jsonify({'error': 'Stand must be approved before creating invoice'}), 400
    
    # Generate invoice number
    invoice_count = Invoice.query.count() + 1
    invoice_number = f"INV-{datetime.now().year}-{invoice_count:04d}"
    
    # Calculate totals
    total_ht = data['total_ht']
    tva_amount = total_ht * 0.19
    total_ttc = total_ht + tva_amount
    
    invoice = Invoice(
        invoice_number=invoice_number,
        stand_id=data['stand_id'],
        client_name=data['client_name'],
        client_email=data.get('client_email'),
        client_phone=data.get('client_phone'),
        client_address=data.get('client_address'),
        total_ht=total_ht,
        tva_amount=tva_amount,
        total_ttc=total_ttc,
        created_by=current_user_id
    )
    
    db.session.add(invoice)
    db.session.commit()
    
    return jsonify({
        'message': 'Invoice created successfully',
        'invoice_id': invoice.id,
        'invoice_number': invoice_number
    }), 201

@app.route('/api/invoices/<int:invoice_id>', methods=['PUT'])
@jwt_required()
def update_invoice_status(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    data = request.get_json()
    
    if 'status' in data:
        invoice.status = data['status']
        db.session.commit()
    
    return jsonify({'message': 'Invoice updated successfully'})

# Invoice PDF Generation
def generate_invoice_pdf(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    stand = invoice.stand
    
    # Create PDF buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        topMargin=1*cm, 
        bottomMargin=1*cm,
        leftMargin=1.5*cm,
        rightMargin=1.5*cm
    )
    
    # Custom styles
    styles = getSampleStyleSheet()
    
    # Title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.black,
        spaceAfter=3,
        alignment=0,
        fontName='Helvetica-Bold'
    )
    
    # Content
    content = []
    
    # ===== HEADER SECTION =====
    # Logo and title
    logo_path = os.path.join(os.path.dirname(__file__), 'static', 'logo.png')
    
    if os.path.exists(logo_path):
        try:
            logo = RLImage(logo_path, width=3*cm, height=1.5*cm)
            print(f"✓ Logo loaded successfully from {logo_path}")
            
            logo_title_data = [
                [
                    logo,
                    Paragraph('<b>FACTURE</b>', title_style)
                ]
            ]
        except Exception as e:
            print(f"✗ Error loading logo: {e}")
            logo_title_data = [
                [
                    Paragraph('<b>[LOGO]</b><br/><font size="7">EVENT MANAGEMENT</font>', styles['Normal']),
                    Paragraph('<b>FACTURE</b>', title_style)
                ]
            ]
    else:
        print(f"ℹ Logo not found at {logo_path}, using text placeholder")
        logo_title_data = [
            [
                Paragraph('<b>[LOGO]</b><br/><font size="7">EVENT MANAGEMENT</font>', styles['Normal']),
                Paragraph('<b>FACTURE</b>', title_style)
            ]
        ]
    
    logo_title_table = Table(logo_title_data, colWidths=[5*cm, 13*cm])
    logo_title_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    content.append(logo_title_table)
    content.append(Spacer(1, 5))
    
    # ===== INVOICE INFO BOX =====
    invoice_info_data = [
        [
            Paragraph(f'<b>FACTURE N°: {invoice.invoice_number}</b> | <b>DATE:</b> {invoice.created_at.strftime("%d/%m/%Y")} | <b>STAND:</b> {stand.name}', styles['Normal']),
        ]
    ]
    
    invoice_info_table = Table(invoice_info_data, colWidths=[18*cm])
    invoice_info_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    content.append(invoice_info_table)
    content.append(Spacer(1, 8))
    
    # ===== EMETTEUR / CLIENT SECTION =====
    emetteur_client_data = [
        [
            Paragraph('<b>ÉMETTEUR:</b>', styles['Normal']),
            Paragraph('<b>CLIENT:</b>', styles['Normal'])
        ],
        [
            Paragraph('Event Management Platform', styles['Normal']),
            Paragraph(invoice.client_name, styles['Normal'])
        ],
        [
            Paragraph('contact@eventmanagement.com', styles['Normal']),
            Paragraph(invoice.client_email or 'N/A', styles['Normal'])
        ],
        [
            Paragraph('Tél: +216 71 XXX XXX', styles['Normal']),
            Paragraph(f'Tél: {invoice.client_phone or "N/A"}', styles['Normal'])
        ],
        [
            Paragraph('123 Avenue de la République<br/>Tunis, 1000', styles['Normal']),
            Paragraph(invoice.client_address or 'N/A', styles['Normal'])
        ]
    ]
    
    emetteur_client_table = Table(emetteur_client_data, colWidths=[9*cm, 9*cm])
    emetteur_client_table.setStyle(TableStyle([
        # Emetteur box
        ('BOX', (0, 0), (0, -1), 1, colors.black),
        ('BACKGROUND', (0, 0), (0, 0), colors.lightgrey),
        # Client box
        ('BOX', (1, 0), (1, -1), 1, colors.black),
        ('BACKGROUND', (1, 0), (1, 0), colors.lightgrey),
        # General styling
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
    ]))
    
    content.append(emetteur_client_table)
    content.append(Spacer(1, 8))
    
    # ===== ITEMS TABLE =====
    items_data = [
        [
            Paragraph('<b>DESCRIPTION</b>', styles['Normal']),
            Paragraph('<b>QUANTITÉ</b>', styles['Normal']),
            Paragraph('<b>PRIX UNITAIRE</b>', styles['Normal']),
            Paragraph('<b>TOTAL HT</b>', styles['Normal'])
        ]
    ]
    
    # Add stand items
    for item in stand.items:
        product_name = item.product.name if item.product else 'Produit inconnu'
        pricing_type = item.product.pricing_type if item.product else 'Par Événement'
        
        description = product_name
        if pricing_type == 'Par Jour' and item.days > 1:
            description += f" ({item.days} jours)"
        
        items_data.append([
            Paragraph(description, styles['Normal']),
            Paragraph(str(item.quantity), styles['Normal']),
            Paragraph(f'{item.unit_price:.2f} TND', styles['Normal']),
            Paragraph(f'<b>{item.total_price:.2f} TND</b>', styles['Normal'])
        ])
    
    # Add totals
    items_data.extend([
        ['', '', Paragraph('<b>TOTAL HT:</b>', styles['Normal']), Paragraph(f'<b>{invoice.total_ht:.2f} TND</b>', styles['Normal'])],
        ['', '', Paragraph('<b>TVA (19%):</b>', styles['Normal']), Paragraph(f'<b>{invoice.tva_amount:.2f} TND</b>', styles['Normal'])],
        ['', '', Paragraph('<b>TOTAL TTC:</b>', styles['Normal']), Paragraph(f'<b>{invoice.total_ttc:.2f} TND</b>', styles['Normal'])],
    ])
    
    items_table = Table(items_data, colWidths=[7*cm, 3*cm, 4*cm, 4*cm])
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        # Items rows
        ('ALIGN', (0, 1), (0, -4), 'LEFT'),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        # Grid
        ('GRID', (0, 0), (-1, -4), 0.5, colors.grey),
        # Totals section
        ('BACKGROUND', (0, -3), (-1, -1), colors.whitesmoke),
        ('FONTNAME', (2, -3), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN', (2, -3), (-1, -1), 'RIGHT'),
        ('ALIGN', (3, -3), (-1, -1), 'RIGHT'),
        ('LINEABOVE', (2, -3), (-1, -3), 1, colors.black),
        ('LINEABOVE', (2, -1), (-1, -1), 1.5, colors.black),
        # Padding
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    content.append(items_table)
    content.append(Spacer(1, 10))
    
    # ===== PAYMENT TERMS =====
    terms_data = [
        [
            Paragraph('<b>MODALITÉS DE PAIEMENT:</b>', styles['Normal']),
            Paragraph('<b>CONDITIONS:</b>', styles['Normal'])
        ],
        [
            Paragraph('<b>Par virement bancaire:</b><br/>Banque: Banque de Tunisie<br/>IBAN: TN59 XXXX XXXX XXXX XXXX XXXX<br/>BIC: BTUNTNTT<br/><br/>Paiement à réception de facture', styles['Normal']),
            Paragraph('Facture payable sous 30 jours.<br/>En cas de retard, des pénalités de 3x le taux légal<br/>seront appliquées conformément au code de commerce.<br/><br/>TVA non applicable, art. 293 B du CGI.', styles['Normal'])
        ]
    ]
    
    terms_table = Table(terms_data, colWidths=[9*cm, 9*cm])
    terms_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
    ]))
    
    content.append(terms_table)
    content.append(Spacer(1, 8))
    
    # Footer note
    footer_text = Paragraph(
        '<font size="7"><i>Merci pour votre confiance. Cette facture est payable sous 30 jours. Pour toute question, contactez-nous.</i></font>',
        styles['Normal']
    )
    content.append(footer_text)
    
    # Build PDF
    doc.build(content)
    buffer.seek(0)
    
    return buffer

@app.route('/api/invoices/<int:invoice_id>/pdf', methods=['GET'])
@jwt_required()
def download_invoice_pdf(invoice_id):
    try:
        invoice = Invoice.query.get_or_404(invoice_id)
        
        # Verify stand exists
        if not invoice.stand:
            return jsonify({'error': 'Invoice stand not found'}), 400
        
        # Verify stand has items
        if not invoice.stand.items:
            return jsonify({'error': 'Stand has no items'}), 400
            
        pdf_buffer = generate_invoice_pdf(invoice_id)
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f"facture_{invoice.invoice_number}.pdf",
            mimetype='application/pdf'
        )
    except Exception as e:
        print(f"Error generating invoice PDF {invoice_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# Initialize database function
def create_tables():
    db.create_all()
    
    # Create default owner if not exists
    if not User.query.filter_by(email='owner@eventmanagement.com').first():
        owner = User(
            email='owner@eventmanagement.com',
            password_hash=generate_password_hash('owner123'),
            name='System Owner',
            role='Propriétaire'
        )
        db.session.add(owner)
        db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        create_tables()
    
    app.run(debug=True, host='0.0.0.0', port=5000)
