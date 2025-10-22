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

# Helper function to map role names (supports both English and French)
def get_mapped_role(user_role):
    """Map database role names to French role names for permission checks"""
    role_mapping = {
        'admin': 'Propriétaire',
        'commercial': 'Commercial',
        'logistics': 'Logistique',
        'finance': 'Finance',
        'visitor': 'Visiteur'
    }
    return role_mapping.get(user_role.lower(), user_role)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)  # Increased for Werkzeug hash length
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

# Unified Contact Model - Now supports Person and Enterprise types
class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    
    # Contact Type: 'person' or 'enterprise'
    contact_nature = db.Column(db.String(20), nullable=False, default='person')  # 'person' or 'enterprise'
    
    # Common fields
    name = db.Column(db.String(100), nullable=False)  # Person name OR Enterprise name
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    contact_type = db.Column(db.String(20), default='client')  # 'client', 'fournisseur', 'both'
    status = db.Column(db.String(20), default='Actif')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Enterprise-specific fields (only used when contact_nature='enterprise')
    matricule_fiscal = db.Column(db.String(50))  # Tax ID number
    code_tva = db.Column(db.String(50))  # VAT code
    code_douane = db.Column(db.String(50))  # Customs code
    registre_commerce = db.Column(db.String(50))  # Commerce registry
    legal_form = db.Column(db.String(50))  # Legal form (SARL, SA, etc.)
    capital = db.Column(db.Float)  # Capital social
    website = db.Column(db.String(200))
    
    # Person-specific fields (only used when contact_nature='person')
    enterprise_id = db.Column(db.Integer, db.ForeignKey('contact.id'), nullable=True)  # Link person to enterprise
    position = db.Column(db.String(100))  # Job title/position
    
    # Relationships
    creator = db.relationship('User', backref='created_contacts')
    enterprise = db.relationship('Contact', remote_side=[id], backref='employees', foreign_keys=[enterprise_id])
    
    # Legacy field for backward compatibility (deprecated)
    contact_person = db.Column(db.String(100))  # OLD: contact person name (for enterprises)
    company = db.Column(db.String(100))  # OLD: company field (deprecated)
    speciality = db.Column(db.String(200))  # Area of expertise (for fournisseurs)

class Supplier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(100))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    speciality = db.Column(db.String(200))  # Supplier's area of expertise
    status = db.Column(db.String(20), default='Actif')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(100))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    company = db.Column(db.String(100))
    status = db.Column(db.String(20), default='Actif')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String(20), default='#8884d8')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

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
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    category = db.relationship('Category', backref='products')
    supplier = db.relationship('Supplier', backref='products')

class Stand(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=True)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='draft')  # draft, validated_logistics, validated_finance, approved
    total_amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='TND')  # Currency code (TND, EUR, USD, etc.)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    validated_logistics_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    validated_finance_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_stands')
    client = db.relationship('Client', backref='stands')

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
    currency = db.Column(db.String(10), default='TND')  # Currency code
    status = db.Column(db.String(20), default='pending')  # pending, approved, sent
    notes = db.Column(db.Text, nullable=True)  # Optional notes about the purchase
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
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
    stand_id = db.Column(db.Integer, db.ForeignKey('stand.id'), nullable=True)  # Optional - can create invoices without stands
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=True)
    client_name = db.Column(db.String(100), nullable=False)
    client_email = db.Column(db.String(120))
    client_phone = db.Column(db.String(20))
    client_address = db.Column(db.Text)
    client_company = db.Column(db.String(100))
    total_ht = db.Column(db.Float, nullable=False)
    tva_amount = db.Column(db.Float, nullable=False)
    total_ttc = db.Column(db.Float, nullable=False)
    # Discount/remise fields
    remise = db.Column(db.Float, default=0)  # Discount amount or percentage
    remise_type = db.Column(db.String(20), default='percentage')  # 'percentage' or 'fixed'
    tva_percentage = db.Column(db.Float, default=19)  # Customizable TVA rate
    # Product factor (multiplier for product prices: 1 or 1.5)
    product_factor = db.Column(db.Float, default=1)  # Price multiplier: 1 or 1.5
    # Currency
    currency = db.Column(db.String(10), default='TND')  # Currency code (TND, EUR, USD, etc.)
    # Timbre fiscale (fiscal stamp)
    timbre_fiscale = db.Column(db.Float, default=0)  # Fiscal stamp amount
    # Payment tracking
    advance_payment = db.Column(db.Float, default=0)  # Amount paid upfront when signing
    # Status: 'devis' (initial quote), 'facture' (approved/signed), 'paid', 'cancelled'
    status = db.Column(db.String(20), default='devis')
    # Agent who handled the devis/facture
    agent_name = db.Column(db.String(100))
    # Company details (kept for backward compatibility with existing PDFs)
    company_name = db.Column(db.String(200), default='Votre Entreprise')
    company_address = db.Column(db.Text)
    company_phone = db.Column(db.String(20))
    company_email = db.Column(db.String(120))
    # Dates
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime, nullable=True)  # When devis becomes facture
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    stand = db.relationship('Stand', backref='invoices')
    client = db.relationship('Client', backref='invoices')
    creator = db.relationship('User', backref='created_invoices')

class InvoiceItem(db.Model):
    """Store modified product details for each invoice"""
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoice.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    product_name = db.Column(db.String(200), nullable=False)  # Store name for historical reference
    quantity = db.Column(db.Integer, nullable=False)
    days = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Float, nullable=False)
    factor = db.Column(db.Float, default=1)  # Individual product factor (1 or 1.5)
    total_price = db.Column(db.Float, nullable=False)
    
    invoice = db.relationship('Invoice', backref='items')
    product = db.relationship('Product', backref='invoice_items')

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

# User Management Routes
@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only owners can view all users
    if current_user.role != 'Propriétaire':
        return jsonify({'message': 'Unauthorized'}), 403
    
    users = User.query.all()
    return jsonify([{
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'created_at': user.created_at.isoformat() if user.created_at else None
    } for user in users])

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only owners can update users
    if current_user.role != 'Propriétaire':
        return jsonify({'message': 'Unauthorized'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    data = request.get_json()
    
    # Check if email is being changed and if it's already taken
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 400
    
    # Update user fields
    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        user.email = data['email']
    if 'role' in data:
        user.role = data['role']
    if 'password' in data and data['password']:
        user.password_hash = generate_password_hash(data['password'])
    
    db.session.commit()
    
    return jsonify({'message': 'User updated successfully'})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Only owners can delete users
    if current_user.role != 'Propriétaire':
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Prevent self-deletion
    if user_id == current_user_id:
        return jsonify({'message': 'Cannot delete your own account'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'})

# Contact Routes (Unified Clients + Suppliers)
@app.route('/api/contacts', methods=['GET'])
@jwt_required()
def get_contacts():
    try:
        # Get filter parameters
        contact_type = request.args.get('type', 'all')  # 'all', 'client', 'fournisseur', 'both'
        contact_nature = request.args.get('nature', 'all')  # 'all', 'person', 'enterprise'
        
        # Build query
        query = Contact.query
        
        # Filter by contact type (client/supplier)
        if contact_type != 'all':
            query = query.filter_by(contact_type=contact_type)
        
        # Filter by contact nature (person/enterprise)
        if contact_nature != 'all':
            query = query.filter_by(contact_nature=contact_nature)
        
        contacts = query.all()
        
        result = []
        for c in contacts:
            contact_data = {
                'id': c.id,
                'name': c.name,
                'email': c.email,
                'phone': c.phone,
                'address': c.address,
                'contact_type': c.contact_type,
                'contact_nature': c.contact_nature if hasattr(c, 'contact_nature') else 'person',
                'status': c.status if hasattr(c, 'status') else 'Actif',
                'notes': c.notes if hasattr(c, 'notes') else '',
                'created_at': c.created_at.isoformat() if c.created_at else None,
                
                # Legacy fields (backward compatibility)
                'contact_person': c.contact_person,
                'company': c.company,
                'speciality': c.speciality,
            }
            
            # Add enterprise-specific fields
            if c.contact_nature == 'enterprise':
                contact_data.update({
                    'matricule_fiscal': c.matricule_fiscal,
                    'code_tva': c.code_tva,
                    'code_douane': c.code_douane,
                    'registre_commerce': c.registre_commerce,
                    'legal_form': c.legal_form,
                    'capital': c.capital,
                    'website': c.website,
                    'employees_count': len(c.employees) if hasattr(c, 'employees') else 0
                })
            
            # Add person-specific fields
            if c.contact_nature == 'person':
                contact_data.update({
                    'enterprise_id': c.enterprise_id,
                    'position': c.position,
                    'enterprise_name': c.enterprise.name if c.enterprise else None
                })
            
            result.append(contact_data)
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_contacts: {str(e)}")
        return jsonify({'message': f'Error fetching contacts: {str(e)}'}), 500

@app.route('/api/contacts', methods=['POST'])
@jwt_required()
def create_contact():
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        contact_nature = data.get('contact_nature', 'person')
        
        # Create base contact
        contact = Contact(
            name=data['name'],
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            contact_type=data.get('contact_type', 'client'),
            contact_nature=contact_nature,
            status=data.get('status', 'Actif'),
            notes=data.get('notes'),
            created_by=current_user_id,
            
            # Legacy fields for backward compatibility
            contact_person=data.get('contact_person'),
            company=data.get('company'),
            speciality=data.get('speciality')
        )
        
        # Add enterprise-specific fields
        if contact_nature == 'enterprise':
            contact.matricule_fiscal = data.get('matricule_fiscal')
            contact.code_tva = data.get('code_tva')
            contact.code_douane = data.get('code_douane')
            contact.registre_commerce = data.get('registre_commerce')
            contact.legal_form = data.get('legal_form')
            # Convert empty string to None for numeric field
            capital_value = data.get('capital')
            contact.capital = float(capital_value) if capital_value and capital_value != '' else None
            contact.website = data.get('website')
        
        # Add person-specific fields
        if contact_nature == 'person':
            contact.enterprise_id = data.get('enterprise_id')
            contact.position = data.get('position')
        
        db.session.add(contact)
        db.session.commit()
        
        return jsonify({
            'message': 'Contact created successfully',
            'id': contact.id
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating contact: {str(e)}")
        return jsonify({'message': f'Error creating contact: {str(e)}'}), 500
        db.session.add(contact)
        db.session.commit()
        
        return jsonify({'message': 'Contact created successfully', 'id': contact.id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error in create_contact: {str(e)}")
        return jsonify({'message': f'Error creating contact: {str(e)}'}), 500

@app.route('/api/contacts/<int:contact_id>', methods=['PUT'])
@jwt_required()
def update_contact(contact_id):
    try:
        contact = Contact.query.get_or_404(contact_id)
        data = request.get_json()
        
        # Update common fields
        contact.name = data.get('name', contact.name)
        contact.email = data.get('email', contact.email)
        contact.phone = data.get('phone', contact.phone)
        contact.address = data.get('address', contact.address)
        contact.contact_type = data.get('contact_type', contact.contact_type)
        contact.notes = data.get('notes', contact.notes)
        contact.status = data.get('status', contact.status)
        
        # Update contact_nature if provided
        if 'contact_nature' in data:
            contact.contact_nature = data['contact_nature']
        
        # Update legacy fields
        contact.contact_person = data.get('contact_person', contact.contact_person)
        contact.company = data.get('company', contact.company)
        contact.speciality = data.get('speciality', contact.speciality)
        
        # Update enterprise-specific fields
        if contact.contact_nature == 'enterprise':
            contact.matricule_fiscal = data.get('matricule_fiscal', contact.matricule_fiscal)
            contact.code_tva = data.get('code_tva', contact.code_tva)
            contact.code_douane = data.get('code_douane', contact.code_douane)
            contact.registre_commerce = data.get('registre_commerce', contact.registre_commerce)
            contact.legal_form = data.get('legal_form', contact.legal_form)
            # Convert empty string to None for numeric field
            if 'capital' in data:
                capital_value = data.get('capital')
                contact.capital = float(capital_value) if capital_value and capital_value != '' else None
            contact.website = data.get('website', contact.website)
        
        # Update person-specific fields
        if contact.contact_nature == 'person':
            contact.enterprise_id = data.get('enterprise_id', contact.enterprise_id)
            contact.position = data.get('position', contact.position)
        
        db.session.commit()
        
        return jsonify({'message': 'Contact updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_contact: {str(e)}")
        return jsonify({'message': f'Error updating contact: {str(e)}'}), 500

# Get enterprises only (for linking persons)
@app.route('/api/contacts/enterprises', methods=['GET'])
@jwt_required()
def get_enterprises():
    try:
        enterprises = Contact.query.filter_by(contact_nature='enterprise').all()
        return jsonify([{
            'id': e.id,
            'name': e.name,
            'matricule_fiscal': e.matricule_fiscal,
            'email': e.email,
            'phone': e.phone
        } for e in enterprises])
    except Exception as e:
        print(f"Error in get_enterprises: {str(e)}")
        return jsonify({'message': f'Error fetching enterprises: {str(e)}'}), 500

# Get employees of an enterprise
@app.route('/api/contacts/enterprises/<int:enterprise_id>/employees', methods=['GET'])
@jwt_required()
def get_enterprise_employees(enterprise_id):
    try:
        enterprise = Contact.query.get_or_404(enterprise_id)
        if enterprise.contact_nature != 'enterprise':
            return jsonify({'message': 'Contact is not an enterprise'}), 400
        
        employees = Contact.query.filter_by(enterprise_id=enterprise_id).all()
        return jsonify([{
            'id': e.id,
            'name': e.name,
            'position': e.position,
            'email': e.email,
            'phone': e.phone
        } for e in employees])
    except Exception as e:
        print(f"Error in get_enterprise_employees: {str(e)}")
        return jsonify({'message': f'Error fetching employees: {str(e)}'}), 500

@app.route('/api/contacts/<int:contact_id>', methods=['DELETE'])
@jwt_required()
def delete_contact(contact_id):
    try:
        contact = Contact.query.get_or_404(contact_id)
        
        db.session.delete(contact)
        db.session.commit()
        
        return jsonify({'message': 'Contact deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_contact: {str(e)}")
        return jsonify({'message': f'Error deleting contact: {str(e)}'}), 500

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
            'speciality': s.speciality if hasattr(s, 'speciality') else None,
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
        
        data = request.get_json()
        
        supplier = Supplier(
            name=data['name'],
            contact_person=data.get('contact_person'),
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            speciality=data.get('speciality'),
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
        supplier = Supplier.query.get_or_404(supplier_id)
        data = request.get_json()
        
        supplier.name = data.get('name', supplier.name)
        supplier.contact_person = data.get('contact_person', supplier.contact_person)
        supplier.email = data.get('email', supplier.email)
        supplier.phone = data.get('phone', supplier.phone)
        supplier.address = data.get('address', supplier.address)
        if 'speciality' in data:
            supplier.speciality = data.get('speciality', supplier.speciality)
        if 'status' in data:
            supplier.status = data.get('status', supplier.status)
        
        db.session.commit()
        
        return jsonify({'message': 'Supplier updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_supplier: {str(e)}")
        return jsonify({'message': f'Error updating supplier: {str(e)}'}), 500

@app.route('/api/suppliers/<int:supplier_id>', methods=['DELETE'])
@jwt_required()
def delete_supplier(supplier_id):
    try:
        supplier = Supplier.query.get_or_404(supplier_id)
        db.session.delete(supplier)
        db.session.commit()
        
        return jsonify({'message': 'Supplier deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_supplier: {str(e)}")
        return jsonify({'message': f'Error deleting supplier: {str(e)}'}), 500

# Client Routes
@app.route('/api/clients', methods=['GET'])
@jwt_required()
def get_clients():
    try:
        clients = Client.query.all()
        return jsonify([{
            'id': c.id,
            'name': c.name,
            'contact_person': c.contact_person,
            'email': c.email,
            'phone': c.phone,
            'address': c.address,
            'company': c.company,
            'status': c.status if hasattr(c, 'status') else 'Actif',
            'created_at': c.created_at.isoformat() if c.created_at else None
        } for c in clients])
    except Exception as e:
        print(f"Error in get_clients: {str(e)}")
        return jsonify({'message': f'Error fetching clients: {str(e)}'}), 500

@app.route('/api/clients', methods=['POST'])
@jwt_required()
def create_client():
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        user_role = get_mapped_role(current_user.role)
        
        # Admin and Commercial can create clients
        if user_role not in ['Propriétaire', 'Commercial']:
            return jsonify({'message': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        client = Client(
            name=data['name'],
            contact_person=data.get('contact_person'),
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            company=data.get('company'),
            status=data.get('status', 'Actif'),
            created_by=current_user_id
        )
        
        db.session.add(client)
        db.session.commit()
        
        return jsonify({'message': 'Client created successfully', 'id': client.id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error in create_client: {str(e)}")
        return jsonify({'message': f'Error creating client: {str(e)}'}), 500

@app.route('/api/clients/<int:client_id>', methods=['PUT'])
@jwt_required()
def update_client(client_id):
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        user_role = get_mapped_role(current_user.role)
        
        # Admin and Commercial can update clients
        if user_role not in ['Propriétaire', 'Commercial']:
            return jsonify({'message': 'Unauthorized'}), 403
        
        client = Client.query.get_or_404(client_id)
        data = request.get_json()
        
        client.name = data.get('name', client.name)
        client.contact_person = data.get('contact_person', client.contact_person)
        client.email = data.get('email', client.email)
        client.phone = data.get('phone', client.phone)
        client.address = data.get('address', client.address)
        client.company = data.get('company', client.company)
        if 'status' in data:
            client.status = data['status']
        
        db.session.commit()
        
        return jsonify({'message': 'Client updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_client: {str(e)}")
        return jsonify({'message': f'Error updating client: {str(e)}'}), 500

@app.route('/api/clients/<int:client_id>', methods=['DELETE'])
@jwt_required()
def delete_client(client_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    user_role = get_mapped_role(current_user.role)
    
    # Only Admin can delete clients
    if user_role != 'Propriétaire':
        return jsonify({'message': 'Unauthorized'}), 403
    
    client = Client.query.get_or_404(client_id)
    db.session.delete(client)
    db.session.commit()
    
    return jsonify({'message': 'Client deleted successfully'})

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
        
        # Allow all authenticated users to create categories
        # Categories are needed for product management which all users can do
        
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
        
        # Allow all authenticated users to update categories
        
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

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        # Allow all authenticated users to delete categories
        
        category = Category.query.get_or_404(category_id)
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Category deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_category: {str(e)}")
        return jsonify({'message': f'Error deleting category: {str(e)}'}), 500

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
                'currency': s.currency if hasattr(s, 'currency') else 'TND',  # Add currency
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
    
    user_role = get_mapped_role(current_user.role)
    
    # Only Commercial and Propriétaire can create stands
    if user_role not in ['Commercial', 'Propriétaire']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    stand = Stand(
        name=data['name'],
        client_id=data.get('client_id'),
        description=data.get('description'),
        total_amount=data['total_amount'],
        currency=data.get('currency', 'TND'),  # Get currency from request, default to TND
        status='approved',  # Stands are automatically approved
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
    
    # Group products by supplier and create Bon de Commande for each supplier
    supplier_items = {}  # {supplier_id: [items]}
    
    for item_data in data['items']:
        product = Product.query.get(item_data['product_id'])
        if product:
            supplier_id = product.supplier_id
            if supplier_id not in supplier_items:
                supplier_items[supplier_id] = []
            supplier_items[supplier_id].append(item_data)
    
    # Create a Bon de Commande (Purchase) for each supplier
    created_purchases = []
    for supplier_id, items in supplier_items.items():
        # Calculate total for this supplier
        supplier_total = sum(item['total_price'] for item in items)
        
        # Generate purchase number
        purchase_count = Purchase.query.count() + 1
        purchase_number = f"BC-{datetime.now().year}-{purchase_count:03d}"
        
        purchase = Purchase(
            stand_id=stand.id,
            purchase_number=purchase_number,
            supplier_id=supplier_id,
            total_amount=supplier_total,
            currency=stand.currency,  # Use same currency as stand
            status='pending',
            notes=f"Généré automatiquement pour le stand: {data['name']}",
            created_by=current_user_id
        )
        
        db.session.add(purchase)
        db.session.flush()  # Get purchase ID
        
        # Add purchase items
        for item_data in items:
            purchase_item = PurchaseItem(
                purchase_id=purchase.id,
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                days=item_data.get('days', 1),
                unit_price=item_data['unit_price'],
                total_price=item_data['total_price']
            )
            db.session.add(purchase_item)
        
        created_purchases.append({
            'id': purchase.id,
            'purchase_number': purchase_number,
            'supplier_id': supplier_id
        })
    
    db.session.commit()
    
    return jsonify({
        'message': 'Stand created successfully',
        'stand_id': stand.id,
        'purchases_created': created_purchases
    }), 201

@app.route('/api/stands/<int:stand_id>', methods=['PUT'])
@jwt_required()
def update_stand(stand_id):
    try:
        current_user_id = int(get_jwt_identity())
        stand = Stand.query.get_or_404(stand_id)
        
        # Check if user is the creator or has permission
        current_user = User.query.get(current_user_id)
        user_role = get_mapped_role(current_user.role)
        
        if stand.created_by != current_user_id and user_role not in ['Commercial', 'Propriétaire']:
            return jsonify({'message': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Update basic stand information
        if 'name' in data:
            stand.name = data['name']
        if 'description' in data:
            stand.description = data['description']
        if 'client_id' in data:
            stand.client_id = data['client_id']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Stand updated successfully',
            'stand_id': stand.id
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating stand: {str(e)}")
        return jsonify({'message': f'Error updating stand: {str(e)}'}), 500

@app.route('/api/stands/<int:stand_id>/items', methods=['GET'])
@jwt_required()
def get_stand_items(stand_id):
    """Get all items for a specific stand"""
    try:
        stand = Stand.query.get_or_404(stand_id)
        items = StandItem.query.filter_by(stand_id=stand_id).all()
        
        return jsonify([{
            'id': item.id,
            'product_id': item.product_id,
            'product_name': item.product.name if item.product else 'Unknown',
            'quantity': item.quantity,
            'days': item.days,
            'unit_price': item.unit_price,
            'total_price': item.total_price
        } for item in items]), 200
    except Exception as e:
        print(f"Error getting stand items: {str(e)}")
        return jsonify({'message': f'Error getting stand items: {str(e)}'}), 500

@app.route('/api/stands/<int:stand_id>/items', methods=['PUT'])
@jwt_required()
def update_stand_items(stand_id):
    """Update items for a specific stand"""
    try:
        current_user_id = int(get_jwt_identity())
        stand = Stand.query.get_or_404(stand_id)
        
        # Check if user is the creator or has permission
        current_user = User.query.get(current_user_id)
        user_role = get_mapped_role(current_user.role)
        
        if stand.created_by != current_user_id and user_role not in ['Commercial', 'Propriétaire']:
            return jsonify({'message': 'Unauthorized'}), 403
        
        data = request.get_json()
        items_data = data.get('items', [])
        
        # Delete existing stand items
        StandItem.query.filter_by(stand_id=stand_id).delete()
        
        # Add new items and calculate total
        total_amount = 0
        for item_data in items_data:
            item = StandItem(
                stand_id=stand.id,
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                days=item_data.get('days', 1),
                unit_price=item_data['unit_price'],
                total_price=item_data['total_price']
            )
            db.session.add(item)
            total_amount += item_data['total_price']
        
        # Update stand total
        stand.total_amount = total_amount
        
        db.session.commit()
        
        return jsonify({
            'message': 'Stand items updated successfully',
            'stand_id': stand.id,
            'total_amount': total_amount
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating stand items: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error updating stand items: {str(e)}'}), 500

@app.route('/api/stands/<int:stand_id>/validate-logistics', methods=['POST'])
@jwt_required()
def validate_logistics(stand_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    user_role = get_mapped_role(current_user.role)
    
    # Only Logistique and Propriétaire can validate logistics
    if user_role not in ['Logistique', 'Propriétaire']:
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
    
    user_role = get_mapped_role(current_user.role)
    
    # Only Finance and Propriétaire can validate finance
    if user_role not in ['Finance', 'Propriétaire']:
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
        'client_id': inv.client_id,
        'client_name': inv.client_name,
        'client_email': inv.client_email,
        'client_phone': inv.client_phone,
        'client_address': inv.client_address,
        'client_company': inv.client_company,
        'total_ht': inv.total_ht,
        'tva_amount': inv.tva_amount,
        'total_ttc': inv.total_ttc,
        'advance_payment': inv.advance_payment if hasattr(inv, 'advance_payment') else 0,
        'remise': inv.remise if hasattr(inv, 'remise') else 0,
        'remise_type': inv.remise_type if hasattr(inv, 'remise_type') else 'percentage',
        'tva_percentage': inv.tva_percentage if hasattr(inv, 'tva_percentage') else 19,
        'product_factor': inv.product_factor if hasattr(inv, 'product_factor') else 1,
        'currency': inv.currency if hasattr(inv, 'currency') else 'TND',  # Add currency
        'timbre_fiscale': inv.timbre_fiscale if hasattr(inv, 'timbre_fiscale') else 0,  # Add timbre fiscale
        'status': inv.status,
        'agent_name': inv.agent_name,
        'company_name': inv.company_name,
        'company_address': inv.company_address,
        'company_phone': inv.company_phone,
        'company_email': inv.company_email,
        'created_at': inv.created_at.isoformat(),
        'approved_at': inv.approved_at.isoformat() if inv.approved_at else None,
        'created_by': inv.created_by
    } for inv in invoices])

@app.route('/api/invoices/<int:invoice_id>', methods=['GET'])
@jwt_required()
def get_invoice(invoice_id):
    try:
        invoice = Invoice.query.get_or_404(invoice_id)
        return jsonify({
            'id': invoice.id,
            'invoice_number': invoice.invoice_number,
            'stand_id': invoice.stand_id,
            'stand_name': invoice.stand.name if invoice.stand else None,
            'client_id': invoice.client_id,
            'client_name': invoice.client_name,
            'client_email': invoice.client_email,
            'client_phone': invoice.client_phone,
            'client_address': invoice.client_address,
            'client_company': invoice.client_company,
            'total_ht': invoice.total_ht,
            'tva_amount': invoice.tva_amount,
            'total_ttc': invoice.total_ttc,
            'advance_payment': invoice.advance_payment if hasattr(invoice, 'advance_payment') else 0,
            'remise': invoice.remise if hasattr(invoice, 'remise') else 0,
            'remise_type': invoice.remise_type if hasattr(invoice, 'remise_type') else 'percentage',
            'tva_percentage': invoice.tva_percentage if hasattr(invoice, 'tva_percentage') else 19,
            'product_factor': invoice.product_factor if hasattr(invoice, 'product_factor') else 1,
            'currency': invoice.currency if hasattr(invoice, 'currency') else 'TND',  # Add currency
            'timbre_fiscale': invoice.timbre_fiscale if hasattr(invoice, 'timbre_fiscale') else 0,  # Add timbre fiscale
            'status': invoice.status,
            'agent_name': invoice.agent_name,
            'company_name': invoice.company_name,
            'company_address': invoice.company_address,
            'company_phone': invoice.company_phone,
            'company_email': invoice.company_email,
            'created_at': invoice.created_at.isoformat(),
            'approved_at': invoice.approved_at.isoformat() if invoice.approved_at else None,
            'created_by': invoice.created_by
        }), 200
    except Exception as e:
        print(f"Error getting invoice: {str(e)}")
        return jsonify({'message': f'Error getting invoice: {str(e)}'}), 500

@app.route('/api/invoices', methods=['POST'])
@jwt_required()
def create_invoice():
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        data = request.get_json()
    
        # Check creation mode - stand-based or direct
        use_stand = data.get('use_stand', True)
        
        # Stand-based mode
        if use_stand:
            # Verify stand exists and is approved
            stand = Stand.query.get_or_404(data['stand_id'])
            if stand.status != 'approved':
                return jsonify({'error': 'Stand must be approved before creating invoice'}), 400
            
            # Get client info from stand
            client = None
            if stand.client_id:
                client = Client.query.get(stand.client_id)
            
            stand_id = data['stand_id']
            client_id = stand.client_id
            default_client_name = client.name if client else 'Client'
            default_client_email = client.email if client else ''
            default_client_phone = client.phone if client else ''
            default_client_address = client.address if client else ''
            default_client_company = client.company if client else ''
        # Direct mode - no stand required
        else:
            stand = None
            stand_id = None
            client_id = data.get('client_id')
            
            # Get client info from contact if client_id provided
            if client_id:
                contact = Contact.query.get(client_id)
                default_client_name = contact.name if contact else data.get('client_name', 'Client')
                default_client_email = contact.email if contact else data.get('client_email', '')
                default_client_phone = contact.phone if contact else data.get('client_phone', '')
                default_client_address = contact.address if contact else data.get('client_address', '')
                default_client_company = contact.company if contact else data.get('client_company', '')
            else:
                # Use provided client info directly
                default_client_name = data.get('client_name', 'Client')
                default_client_email = data.get('client_email', '')
                default_client_phone = data.get('client_phone', '')
                default_client_address = data.get('client_address', '')
                default_client_company = data.get('client_company', '')
        
        # Generate devis number (will be converted to invoice number when approved)
        invoice_count = Invoice.query.count() + 1
        invoice_number = f"DEV-{datetime.now().year}-{invoice_count:04d}"
        
        # Get discount/remise values
        remise = float(data.get('remise', 0))
        remise_type = data.get('remise_type', 'percentage')
        tva_percentage = float(data.get('tva_percentage', 19))
        
        # Get modified items from frontend (includes individual factors per product)
        modified_items = data.get('modified_items', [])
        
        # Calculate totals from modified items
        if modified_items:
            # Use the modified items with individual factors
            subtotal = sum(item['total_price'] for item in modified_items)
        elif use_stand and stand:
            # Fallback to original stand total with global factor (backward compatibility)
            product_factor = float(data.get('product_factor', 1))
            subtotal = stand.total_amount * product_factor
        else:
            # Direct mode with no items
            return jsonify({'error': 'No products provided for invoice'}), 400
        
        # Apply remise based on type
        if remise > 0:
            if remise_type == 'percentage':
                remise_amount = subtotal * (remise / 100)
            else:  # fixed
                remise_amount = remise
            total_ht = subtotal - remise_amount
        else:
            total_ht = subtotal
        
        # Calculate TVA with custom percentage
        tva_amount = total_ht * (tva_percentage / 100)
        
        # Add timbre fiscale
        timbre_fiscale = float(data.get('timbre_fiscale', 0))
        
        # Calculate total TTC (including timbre fiscale)
        total_ttc = total_ht + tva_amount + timbre_fiscale
        
        # Use provided client info from form, fallback to defaults
        invoice = Invoice(
            invoice_number=invoice_number,
            stand_id=stand_id,
            client_id=client_id,
            client_name=data.get('client_name') or default_client_name,
            client_email=data.get('client_email') or default_client_email,
            client_phone=data.get('client_phone') or default_client_phone,
            client_address=data.get('client_address') or default_client_address,
            client_company=data.get('client_company') or default_client_company,
            total_ht=total_ht,
            tva_amount=tva_amount,
            total_ttc=total_ttc,
            remise=remise,
            remise_type=remise_type,
            tva_percentage=tva_percentage,
            product_factor=data.get('product_factor', 1),  # Keep for backward compatibility
            currency=data.get('currency', stand.currency if stand else 'TND'),  # Use stand currency or provided currency
            timbre_fiscale=timbre_fiscale,  # Add timbre fiscale
            status='devis',  # Start as devis
            agent_name=current_user.name,
            company_name=data.get('company_name', 'Votre Entreprise'),
            company_address=data.get('company_address'),
            company_phone=data.get('company_phone'),
            company_email=data.get('company_email'),
            created_by=current_user_id
        )
        
        db.session.add(invoice)
        db.session.flush()  # Get the invoice ID
        
        # Save modified items to InvoiceItem table
        if modified_items:
            for item in modified_items:
                product = Product.query.get(item.get('product_id'))
                invoice_item = InvoiceItem(
                    invoice_id=invoice.id,
                    product_id=item.get('product_id'),
                    product_name=item.get('product_name', product.name if product else 'Produit'),
                    quantity=item.get('quantity', 1),
                    days=item.get('days', 1),
                    unit_price=item.get('unit_price', 0),
                    factor=item.get('factor', 1),
                    total_price=item.get('total_price', 0)
                )
                db.session.add(invoice_item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Devis created successfully',
            'invoice_id': invoice.id,
            'invoice_number': invoice_number
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating invoice: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error creating invoice: {str(e)}'}), 500

@app.route('/api/invoices/<int:invoice_id>', methods=['PUT'])
@jwt_required()
def update_invoice_status(invoice_id):
    try:
        invoice = Invoice.query.get_or_404(invoice_id)
        data = request.get_json()
    
        # Handle full invoice update (if modified_items provided)
        if 'modified_items' in data:
            # Update invoice fields
            if 'client_name' in data:
                invoice.client_name = data['client_name']
            if 'client_email' in data:
                invoice.client_email = data['client_email']
            if 'client_phone' in data:
                invoice.client_phone = data['client_phone']
            if 'client_address' in data:
                invoice.client_address = data['client_address']
            if 'client_company' in data:
                invoice.client_company = data['client_company']
            if 'company_name' in data:
                invoice.company_name = data['company_name']
            if 'company_address' in data:
                invoice.company_address = data['company_address']
            if 'company_phone' in data:
                invoice.company_phone = data['company_phone']
            if 'company_email' in data:
                invoice.company_email = data['company_email']
            if 'remise' in data:
                invoice.remise = float(data['remise'])
            if 'remise_type' in data:
                invoice.remise_type = data['remise_type']
            if 'tva_percentage' in data:
                invoice.tva_percentage = float(data['tva_percentage'])
            if 'product_factor' in data:
                invoice.product_factor = float(data['product_factor'])
            if 'currency' in data:
                invoice.currency = data['currency']
            if 'timbre_fiscale' in data:
                invoice.timbre_fiscale = float(data['timbre_fiscale'])
            
            # Delete existing invoice items
            InvoiceItem.query.filter_by(invoice_id=invoice_id).delete()
            
            # Add updated items
            modified_items = data['modified_items']
            for item_data in modified_items:
                invoice_item = InvoiceItem(
                    invoice_id=invoice.id,
                    product_id=item_data['product_id'],
                    product_name=item_data.get('product_name', ''),
                    quantity=item_data['quantity'],
                    days=item_data.get('days', 1),
                    unit_price=item_data['unit_price'],
                    factor=item_data.get('factor', 1),
                    total_price=item_data['total_price'],
                    pricing_type=item_data.get('pricing_type', 'Par Événement')
                )
                db.session.add(invoice_item)
            
            # Recalculate totals
            subtotal = sum(item['total_price'] for item in modified_items)
            total_ht = subtotal
            
            # Apply remise
            if invoice.remise > 0:
                if invoice.remise_type == 'percentage':
                    total_ht = subtotal - (subtotal * invoice.remise / 100)
                else:
                    total_ht = subtotal - invoice.remise
            
            # Calculate TVA and total TTC (including timbre fiscale)
            tva_amount = total_ht * (invoice.tva_percentage / 100)
            timbre_fiscale = invoice.timbre_fiscale if hasattr(invoice, 'timbre_fiscale') else 0
            total_ttc = total_ht + tva_amount + timbre_fiscale
            
            invoice.total_ht = total_ht
            invoice.tva_amount = tva_amount
            invoice.total_ttc = total_ttc
            
            db.session.commit()
            
            return jsonify({
                'message': 'Invoice updated successfully',
                'invoice': {
                    'id': invoice.id,
                    'invoice_number': invoice.invoice_number,
                    'total_ht': invoice.total_ht,
                    'tva_amount': invoice.tva_amount,
                    'total_ttc': invoice.total_ttc
                }
            }), 200
        
        # Handle status update only
        if 'status' in data:
            old_status = invoice.status
            new_status = data['status']
            invoice.status = new_status
            
            # If converting devis to facture (signing), update the number, set approval date, and record advance payment
            if old_status == 'devis' and new_status == 'facture':
                # Change DEV to FAC in the number
                invoice.invoice_number = invoice.invoice_number.replace('DEV-', 'FAC-')
                invoice.approved_at = datetime.utcnow()
                
                # Record advance payment if provided
                if 'advance_payment' in data:
                    invoice.advance_payment = float(data['advance_payment'])
            
            db.session.commit()
            
            return jsonify({
                'message': 'Invoice updated successfully',
                'invoice_number': invoice.invoice_number
            }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"Error updating invoice: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error updating invoice: {str(e)}'}), 500

@app.route('/api/invoices/<int:invoice_id>/items', methods=['GET'])
@jwt_required()
def get_invoice_items(invoice_id):
    """Get all items for a specific invoice"""
    invoice = Invoice.query.get_or_404(invoice_id)
    items = InvoiceItem.query.filter_by(invoice_id=invoice_id).all()
    
    return jsonify([{
        'id': item.id,
        'product_id': item.product_id,
        'product_name': item.product_name,
        'quantity': item.quantity,
        'days': item.days,
        'unit_price': item.unit_price,
        'factor': item.factor,
        'total_price': item.total_price,
        'pricing_type': item.pricing_type
    } for item in items]), 200

# Invoice/Devis PDF Generation
def generate_invoice_pdf(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    stand = invoice.stand if invoice.stand_id else None
    
    # Get currency from invoice, default to TND
    currency = invoice.currency if hasattr(invoice, 'currency') and invoice.currency else 'TND'
    
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
    
    # Determine document type based on status
    doc_type = "DEVIS" if invoice.status == 'devis' else "FACTURE"
    
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
                    Paragraph(f'<b>{doc_type}</b>', title_style)
                ]
            ]
        except Exception as e:
            print(f"✗ Error loading logo: {e}")
            logo_title_data = [
                [
                    Paragraph(f'<b>[LOGO]</b><br/><font size="7">{invoice.company_name or "EVENT MANAGEMENT"}</font>', styles['Normal']),
                    Paragraph(f'<b>{doc_type}</b>', title_style)
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
    doc_type_label = "DEVIS N°" if invoice.status == 'devis' else "FACTURE N°"
    
    # Include stand name only if associated with a stand
    stand_info = f' | <b>STAND:</b> {stand.name}' if stand else ''
    
    invoice_info_data = [
        [
            Paragraph(f'<b>{doc_type_label}: {invoice.invoice_number}</b> | <b>DATE:</b> {invoice.created_at.strftime("%d/%m/%Y")}{stand_info}', styles['Normal']),
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
    # Get client contact information for hierarchy display
    client_display_name = invoice.client_name
    
    # Check if client is linked to a contact (for person/enterprise hierarchy)
    if invoice.client_id:
        try:
            # Try to get contact through client relationship
            # Since Client and Contact might be the same table or separate, handle both cases
            contact = Contact.query.filter_by(id=invoice.client_id).first()
            
            if contact and contact.contact_nature == 'person' and contact.enterprise_id:
                # Get the enterprise information
                enterprise = Contact.query.get(contact.enterprise_id)
                if enterprise:
                    # Format: "Enterprise Name (Matricule Fiscal), à l'ordre de Person Name"
                    enterprise_info = enterprise.name
                    if enterprise.matricule_fiscal:
                        enterprise_info += f" ({enterprise.matricule_fiscal})"
                    client_display_name = f"{enterprise_info}<br/>à l'ordre de: <b>{contact.name}</b>"
                    if contact.position:
                        client_display_name += f" - {contact.position}"
        except Exception as e:
            print(f"Note: Could not load contact hierarchy: {e}")
            # Continue with standard client name if there's an error
    
    emetteur_client_data = [
        [
            Paragraph('<b>ÉMETTEUR:</b>', styles['Normal']),
            Paragraph('<b>CLIENT:</b>', styles['Normal'])
        ],
        [
            Paragraph(invoice.company_name or 'Event Management Platform', styles['Normal']),
            Paragraph(client_display_name, styles['Normal'])
        ]
    ]
    
    # Add company details
    if invoice.company_email:
        emetteur_client_data.append([
            Paragraph(invoice.company_email, styles['Normal']),
            Paragraph(invoice.client_email or 'N/A', styles['Normal'])
        ])
    else:
        emetteur_client_data.append([
            Paragraph('contact@eventmanagement.com', styles['Normal']),
            Paragraph(invoice.client_email or 'N/A', styles['Normal'])
        ])
    
    if invoice.company_phone:
        emetteur_client_data.append([
            Paragraph(f'Tél: {invoice.company_phone}', styles['Normal']),
            Paragraph(f'Tél: {invoice.client_phone or "N/A"}', styles['Normal'])
        ])
    else:
        emetteur_client_data.append([
            Paragraph('Tél: +216 71 XXX XXX', styles['Normal']),
            Paragraph(f'Tél: {invoice.client_phone or "N/A"}', styles['Normal'])
        ])
    
    if invoice.company_address:
        emetteur_client_data.append([
            Paragraph(invoice.company_address, styles['Normal']),
            Paragraph(invoice.client_address or 'N/A', styles['Normal'])
        ])
    else:
        emetteur_client_data.append([
            Paragraph('123 Avenue de la République<br/>Tunis, 1000', styles['Normal']),
            Paragraph(invoice.client_address or 'N/A', styles['Normal'])
        ])
    
    # Add agent information if available
    if invoice.agent_name:
        emetteur_client_data.append([
            Paragraph(f'<b>Agent:</b> {invoice.agent_name}', styles['Normal']),
            Paragraph(invoice.client_company or '', styles['Normal'])
        ])
    
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
    
    # Get items from stand or invoice items (for direct invoices)
    if stand and stand.items:
        # Stand-based invoice
        for item in stand.items:
            product_name = item.product.name if item.product else 'Produit inconnu'
            pricing_type = item.product.pricing_type if item.product else 'Par Événement'
            
            description = product_name
            if pricing_type == 'Par Jour' and item.days > 1:
                description += f" ({item.days} jours)"
            
            items_data.append([
                Paragraph(description, styles['Normal']),
                Paragraph(str(item.quantity), styles['Normal']),
                Paragraph(f'{item.unit_price:.2f} {currency}', styles['Normal']),
                Paragraph(f'<b>{item.total_price:.2f} {currency}</b>', styles['Normal'])
            ])
    else:
        # Direct invoice (devis) - use InvoiceItem
        for item in invoice.items:
            description = item.product_name
            if item.days > 1:
                description += f" ({item.days} jours)"
            
            items_data.append([
                Paragraph(description, styles['Normal']),
                Paragraph(str(item.quantity), styles['Normal']),
                Paragraph(f'{item.unit_price:.2f} {currency}', styles['Normal']),
                Paragraph(f'<b>{item.total_price:.2f} {currency}</b>', styles['Normal'])
            ])
    
    # Add totals
    items_data.extend([
        ['', '', Paragraph('<b>TOTAL HT:</b>', styles['Normal']), Paragraph(f'<b>{invoice.total_ht:.2f} {currency}</b>', styles['Normal'])],
        ['', '', Paragraph('<b>TVA (19%):</b>', styles['Normal']), Paragraph(f'<b>{invoice.tva_amount:.2f} {currency}</b>', styles['Normal'])],
        ['', '', Paragraph('<b>Timbre Fiscale:</b>', styles['Normal']), Paragraph(f'<b>{invoice.timbre_fiscale:.2f} {currency}</b>', styles['Normal'])],
        ['', '', Paragraph('<b>TOTAL TTC:</b>', styles['Normal']), Paragraph(f'<b>{invoice.total_ttc:.2f} {currency}</b>', styles['Normal'])],
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
        
        # Verify invoice has items (either from stand or direct invoice items)
        has_items = False
        if invoice.stand_id and invoice.stand and invoice.stand.items:
            has_items = True
        elif invoice.items:  # Check InvoiceItem table for direct invoices
            has_items = True
            
        if not has_items:
            return jsonify({'error': 'Invoice has no items'}), 400
            
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
