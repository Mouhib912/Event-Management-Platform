# Event Management Platform - Complete System Documentation

## 🎯 System Overview

This is a comprehensive event management platform with a React frontend, Flask backend, and PDF generation capabilities. The system includes role-based access control, stand simulation, purchase management, and automated invoice generation.

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with Vite
- **UI Library**: Shadcn/ui components
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React hooks and context
- **Notifications**: React Hot Toast

### Backend (Flask API)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite (development) - easily upgradeable to PostgreSQL
- **Authentication**: JWT tokens with Flask-JWT-Extended
- **PDF Generation**: ReportLab for professional invoices
- **CORS**: Flask-CORS for cross-origin requests

## 👥 Role-Based Access Control

### Propriétaire (Owner)
- **Full system access**
- Create and manage all users
- Manage suppliers, categories, and products
- Access all modules and statistics
- **Navigation**: All modules available

### Commercial
- **Stand creation and management**
- Purchase order creation
- Product catalog access
- Statistics viewing
- **Navigation**: Stand Simulator, Catalog, Purchase Module, Statistics, Products

### Logistique (Logistics)
- **Logistics validation** for stands
- Purchase order management
- Product and supplier information
- **Navigation**: Stand Catalog, Purchase Module, Products, Suppliers

### Finance
- **Financial validation** for stands
- Purchase order oversight
- Financial statistics and reports
- **Navigation**: Stand Catalog, Purchase Module, Statistics

### Visiteur (Visitor)
- **Read-only access**
- View approved stands only
- Basic statistics viewing
- **Navigation**: Stand Catalog, Statistics

## 🔧 Key Features

### 1. Stand Simulator
- **Interactive stand creation tool**
- Real-time price calculations
- Product selection from catalog
- Quantity and rental period management
- Automatic total computation
- Save functionality with localStorage

### 2. Purchase Management (Achat Module)
- **Generate purchase orders** from approved stands
- Supplier-specific order creation
- Professional PDF invoice generation
- Order status tracking (pending, approved, sent)
- Integration with stand data

### 3. PDF Invoice Generation
- **Professional invoice layout** matching the provided template
- Company branding and contact information
- Itemized product listing with quantities and prices
- Automatic calculations (subtotal, tax, total)
- Terms and conditions section
- Bank details for payment

### 4. User Management (Owner Only)
- **Complete user lifecycle management**
- Role assignment with permission validation
- User creation, editing, and deletion
- Activity tracking and login history
- Role-based statistics dashboard

### 5. Product & Supplier Management
- **Comprehensive catalog system**
- Category-based organization
- Supplier relationship management
- Pricing models (per day vs. flat rate)
- Inventory tracking capabilities

## 🚀 Installation & Setup

### Prerequisites
```bash
# Node.js 18+ and pnpm
npm install -g pnpm

# Python 3.11+ and pip
python3 --version
pip3 --version
```

### Frontend Setup
```bash
cd event-management-platform
pnpm install
pnpm run dev
# Access: http://localhost:5173
```

### Backend Setup
```bash
cd event-management-platform/backend
pip3 install -r requirements.txt
python3 app.py
# API: http://localhost:5000
```

## 🔐 Default Credentials

### System Owner
- **Email**: `owner@eventmanagement.com`
- **Password**: `owner123`
- **Role**: Propriétaire

### Test Commercial User
- **Email**: `test@example.com`
- **Password**: `password123`
- **Role**: Commercial

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (Owner only)

### Stand Management
- `GET /api/stands` - List stands (role-filtered)
- `POST /api/stands` - Create stand (Commercial only)
- `POST /api/stands/{id}/validate-logistics` - Logistics validation
- `POST /api/stands/{id}/validate-finance` - Finance validation

### Purchase Orders
- `GET /api/purchases` - List purchase orders
- `POST /api/purchases` - Create purchase order
- `GET /api/purchases/{id}/pdf` - Generate PDF invoice

### Master Data
- `GET/POST /api/suppliers` - Supplier management
- `GET/POST /api/categories` - Category management
- `GET/POST /api/products` - Product management

## 🎨 UI Components

### Custom Components
- **Layout**: Responsive sidebar navigation with role-based menu
- **Dashboard**: KPI cards with statistics and quick actions
- **StandSimulator**: Interactive stand builder with real-time calculations
- **Achat**: Purchase order management with PDF generation
- **UserManagement**: Complete user administration (Owner only)

### Reusable UI Elements
- Form components (Input, Select, Button, etc.)
- Data display (Cards, Tables, Badges)
- Navigation (Dropdown menus, Breadcrumbs)
- Feedback (Toasts, Loading states, Error handling)

## 📄 PDF Invoice Template

The system generates professional invoices matching the provided template:

### Header Section
- Company logo and branding
- Invoice number and date
- Due date information

### Billing Information
- Sender (Event Management Platform)
- Recipient (Supplier details)
- Color-coded sections (red/yellow borders)

### Itemized Products
- Product descriptions with rental periods
- Quantities and unit prices
- Line totals and grand total
- Tax calculations (configurable)

### Footer
- Payment terms and bank details
- Legal conditions and website reference
- Professional layout with proper spacing

## 🔄 Workflow Examples

### Stand Creation to Invoice
1. **Commercial** creates a stand in Stand Simulator
2. **Logistique** validates logistics requirements
3. **Finance** approves costs and pricing
4. Stand status becomes "approved"
5. **Commercial** creates purchase orders by supplier
6. System generates professional PDF invoices
7. Orders can be tracked through status updates

### User Management (Owner)
1. **Owner** logs in and accesses User Management
2. Creates new users with specific roles
3. Assigns appropriate permissions
4. Users receive access to role-specific modules
5. Activity tracking and permission enforcement

## 🛠️ Technical Implementation

### Frontend Architecture
```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── Layout.jsx       # Main layout with navigation
│   ├── Dashboard.jsx    # Dashboard with KPIs
│   ├── StandSimulator.jsx # Stand creation tool
│   ├── Achat.jsx        # Purchase management
│   └── UserManagement.jsx # User administration
├── App.jsx              # Main app with routing
└── main.jsx            # Application entry point
```

### Backend Architecture
```
backend/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── templates/          # Email templates (future)
├── static/            # Static assets
└── event_management.db # SQLite database
```

### Database Schema
- **Users**: Authentication and role management
- **Suppliers**: Vendor information and contacts
- **Categories**: Product categorization
- **Products**: Catalog with pricing and specifications
- **Stands**: Stand configurations and status
- **StandItems**: Products included in stands
- **Purchases**: Purchase orders and invoices
- **PurchaseItems**: Items in purchase orders

## 🔒 Security Features

### Authentication
- JWT token-based authentication
- Password hashing with bcrypt
- Session management and token expiration

### Authorization
- Role-based access control (RBAC)
- Route-level permission checking
- API endpoint protection
- Frontend navigation filtering

### Data Protection
- SQL injection prevention with ORM
- CORS configuration for cross-origin requests
- Input validation and sanitization
- Secure password requirements

## 📈 Performance Optimizations

### Frontend
- Component lazy loading
- Efficient state management
- Optimized bundle size with Vite
- Responsive design for all devices

### Backend
- Database query optimization
- Efficient PDF generation
- Proper error handling and logging
- Scalable architecture design

## 🚀 Deployment Considerations

### Production Setup
- Environment variable configuration
- Database migration to PostgreSQL
- SSL certificate implementation
- Load balancing and scaling
- Backup and recovery procedures

### Security Hardening
- Production-grade secret keys
- Database connection security
- API rate limiting
- Input validation enhancement
- Audit logging implementation

## 📞 Support & Maintenance

### Monitoring
- Application performance metrics
- Error tracking and alerting
- User activity monitoring
- System health checks

### Updates
- Regular security updates
- Feature enhancement pipeline
- Database migration procedures
- Backup and rollback strategies

## 🎯 Future Enhancements

### Planned Features
- Email notifications for order status
- Advanced reporting and analytics
- Multi-language support
- Mobile application
- Integration with external systems
- Advanced inventory management
- Automated approval workflows

### Technical Improvements
- Microservices architecture
- Containerization with Docker
- CI/CD pipeline implementation
- Advanced caching strategies
- Real-time notifications with WebSockets

---

## 📋 Quick Reference

### Start Development Servers
```bash
# Frontend (Terminal 1)
cd event-management-platform
pnpm run dev

# Backend (Terminal 2)
cd event-management-platform/backend
python3 app.py
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: Available via code inspection

### Test Credentials
- **Owner**: owner@eventmanagement.com / owner123
- **Commercial**: test@example.com / password123

This comprehensive system provides a complete event management solution with professional-grade features, security, and scalability.
