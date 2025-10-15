# 🏢 ERP/CRM Platform Restructuring Plan

## 📋 Executive Summary

The platform is being restructured from a booth-focused system to a comprehensive **ERP (Enterprise Resource Planning) & CRM (Customer Relationship Management)** platform, with the Booth Maker as an addon module.

---

## 🎯 Core Philosophy

### Main Purpose: ERP/CRM
- **Input purchases** (from contacts)
- **Input sales** (to contacts)
- **Manage relationships** with all business contacts
- **Track inventory, orders, invoices**

### Addon Module: Booth Maker
- Create exhibition stands
- Simulate stand configurations
- Generate quotes for booth rentals
- Uses products from the main ERP system

---

## 📊 New Information Architecture

### 🔹 Unified Contacts System

**Why Unified?**
- A contact can be BOTH a client AND a supplier
- Example: We sell products X, Y, Z to Company A, AND we buy services from Company A
- Single source of truth for all business relationships

**Contact Properties:**
```
Contact {
  id: integer
  name: string
  company: string
  email: string
  phone: string
  address: text
  contact_type: enum ['client', 'fournisseur', 'both']
  speciality: string
  status: string ['Actif', 'Inactif']
  created_at: datetime
  notes: text
}
```

**Visual Representation:**
```
┌─────────────────────────────────────────┐
│ 👥 CONTACTS                             │
├─────────────────────────────────────────┤
│ Filters: [All] [Clients] [Fournisseurs]│
│                                         │
│ 🟢 Company A (Both)                     │
│    📧 contact@companya.com              │
│    💼 Client: Bought stands             │
│    🏪 Fournisseur: Sold us IT services  │
│                                         │
│ 🔵 Company B (Client only)              │
│    📧 info@companyb.com                 │
│    💼 Rents exhibition booths           │
│                                         │
│ 🟠 Company C (Fournisseur only)         │
│    📧 sales@companyc.com                │
│    🏪 Supplies furniture                │
└─────────────────────────────────────────┘
```

---

## 🗂️ New Sidebar Navigation Structure

```
┌────────────────────────────────────┐
│ 📊 DASHBOARD                       │
│    ↳ Overview, Stats, Charts      │
├────────────────────────────────────┤
│ 👥 CONTACTS (CRM)                  │
│    ↳ All Contacts                  │
│    ↳ Clients                       │
│    ↳ Fournisseurs                  │
├────────────────────────────────────┤
│ 📥 ACHATS (Purchases)              │
│    ↳ Bons de Commande              │
│    ↳ Produits                      │
│    ↳ Historique d'Achats           │
├────────────────────────────────────┤
│ 📤 VENTES (Sales)                  │
│    ↳ Factures & Devis              │
│    ↳ Historique de Ventes          │
├────────────────────────────────────┤
│ 🎪 BOOTH MAKER (Addon)             │
│    ↳ Créer un Stand                │
│    ↳ Catalogue des Stands          │
│    ↳ Simulateur de Stand           │
│    ↳ Catégories Booth              │
├────────────────────────────────────┤
│ 📈 STATISTIQUES                    │
│    ↳ Analytics                     │
├────────────────────────────────────┤
│ ⚙️ ADMINISTRATION                  │
│    ↳ Gestion Utilisateurs          │
│    ↳ Rôles & Permissions           │
├────────────────────────────────────┤
│ 🔧 PARAMÈTRES                      │
│    ↳ Configuration Générale        │
│    ↳ Catégories Booth (Toggle)     │
│    ↳ Préférences                   │
└────────────────────────────────────┘
```

---

## 🛠️ Module Breakdown

### 1️⃣ **CONTACTS (CRM Core)**

**Purpose:** Manage all business relationships

**Features:**
- ✅ Create/Edit/Delete contacts
- ✅ Tag as Client, Fournisseur, or Both
- ✅ View contact history (purchases made, sales to them)
- ✅ Contact notes and communication log
- ✅ Filter and search by type
- ✅ Export contact lists

**UI Components:**
- Contact list with type badges
- Detailed contact profile
- Activity timeline
- Quick actions

---

### 2️⃣ **ACHATS (Purchases Module)**

**Purpose:** Track and manage all purchases

#### Sub-module: **Bons de Commande** (Purchase Orders)
```
Bon de Commande {
  numero: string (auto-generated)
  fournisseur: Contact (type: fournisseur)
  date_commande: date
  date_livraison_prevue: date
  products: [{
    product_id: integer
    quantity: integer
    unit_price: float
    total: float
  }]
  total_ht: float
  tva: float
  total_ttc: float
  status: ['En attente', 'Confirmé', 'Livré', 'Annulé']
  notes: text
}
```

**Workflow:**
1. Select Fournisseur (from Contacts)
2. Add products with quantities and prices
3. Generate purchase order
4. Track delivery status
5. Mark as received
6. Link to payment/accounting

#### Sub-module: **Produits**
- List all products from all suppliers
- Create new products
- **Category selection** (for organization)
- **Checkbox: "Show in Booth Maker"** ✓
- Link to supplier contact
- Track inventory levels

**Product Properties:**
```
Product {
  name: string
  category_id: integer
  supplier_contact_id: integer
  unit: string
  description: text
  price_ht: float
  pricing_type: ['Par Jour', 'Forfait']
  show_in_booth: boolean  ← NEW
  stock_quantity: integer
  status: string
}
```

---

### 3️⃣ **VENTES (Sales Module)**

**Purpose:** Track and manage all sales

**Features:**
- Factures & Devis (existing functionality)
- Link to Contacts (as clients)
- Track payment status
- Sales history and reporting
- Revenue analytics

---

### 4️⃣ **BOOTH MAKER (Addon Module)**

**Purpose:** Specialized module for exhibition stand creation

**Access to:**
- Only products where `show_in_booth = true`
- Only categories enabled in Settings
- Client contacts for stand assignment

**Sub-modules:**
1. **Créer un Stand**
   - Select client contact
   - Choose products (filtered by booth categories)
   - Configure stand layout
   - Generate quote

2. **Catalogue des Stands**
   - View all created stands
   - Status tracking
   - Validation workflow

3. **Simulateur de Stand**
   - Visual stand builder
   - Real-time pricing

4. **Catégories Booth**
   - Manage booth-specific categories
   - Examples: Mobilier, Éclairage, Décoration, Électronique
   - NOT for: Internet, Office Supplies, etc.

---

### 5️⃣ **ADMINISTRATION**

**Purpose:** User and system management

**Features:**
- Gestion Utilisateurs (moved from main menu)
- Roles & Permissions
- System logs
- Audit trail

---

### 6️⃣ **PARAMÈTRES (Settings)**

**Purpose:** Platform configuration

**Key Setting: Category Toggle for Booth Maker**

```
┌────────────────────────────────────────┐
│ ⚙️ PARAMÈTRES - Catégories Booth      │
├────────────────────────────────────────┤
│                                        │
│ Sélectionnez les catégories qui        │
│ apparaîtront dans le Booth Maker:      │
│                                        │
│ ✅ Mobilier                            │
│ ✅ Éclairage                           │
│ ✅ Décoration                          │
│ ✅ Électronique (écrans, audio)        │
│ ✅ Textile (tapis, rideaux)            │
│ ❌ Internet (not needed for booths)    │
│ ❌ Fournitures Bureau                  │
│ ❌ Services IT                         │
│                                        │
└────────────────────────────────────────┘
```

**Implementation:**
```sql
ALTER TABLE category ADD COLUMN show_in_booth BOOLEAN DEFAULT FALSE;
```

**Logic:**
- When creating a stand, only fetch categories where `show_in_booth = TRUE`
- Admins can toggle categories on/off from Settings
- Products inherit category visibility

---

## 🔄 Data Migration Strategy

### Phase 1: Create Contacts Table
```sql
CREATE TABLE contact (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  company VARCHAR(100),
  email VARCHAR(120),
  phone VARCHAR(20),
  address TEXT,
  contact_type VARCHAR(20) DEFAULT 'client', -- 'client', 'fournisseur', 'both'
  speciality VARCHAR(200),
  status VARCHAR(20) DEFAULT 'Actif',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
```

### Phase 2: Migrate Data
```python
# Merge Clients → Contacts (type: 'client')
INSERT INTO contact (name, company, email, phone, address, contact_type, status, created_at)
SELECT name, company, email, phone, address, 'client', status, created_at FROM client;

# Merge Suppliers → Contacts (type: 'fournisseur')
INSERT INTO contact (name, company, email, phone, address, contact_type, speciality, status, created_at)
SELECT name, NULL, email, phone, address, 'fournisseur', speciality, status, created_at FROM supplier;
```

### Phase 3: Update References
```python
# Update invoices to use contact_id
ALTER TABLE invoice ADD COLUMN contact_id INTEGER REFERENCES contact(id);
UPDATE invoice SET contact_id = (SELECT id FROM contact WHERE contact.name = invoice.client_name LIMIT 1);

# Update stands to use contact_id
ALTER TABLE stand ADD COLUMN contact_id INTEGER REFERENCES contact(id);
UPDATE stand SET contact_id = client_id;  # Map old client_id to new contact_id

# Update products to use supplier_contact_id
ALTER TABLE product ADD COLUMN supplier_contact_id INTEGER REFERENCES contact(id);
UPDATE product SET supplier_contact_id = (SELECT id FROM contact WHERE contact.contact_type IN ('fournisseur', 'both') AND contact.name = (SELECT name FROM supplier WHERE supplier.id = product.supplier_id));
```

### Phase 4: Add New Fields
```sql
# Add show_in_booth to products
ALTER TABLE product ADD COLUMN show_in_booth BOOLEAN DEFAULT TRUE;

# Add show_in_booth to categories
ALTER TABLE category ADD COLUMN show_in_booth BOOLEAN DEFAULT TRUE;
```

---

## 🎨 UI/UX Improvements

### Contact Type Badges
```jsx
// Client only
<Badge variant="primary">👤 Client</Badge>

// Fournisseur only
<Badge variant="secondary">🏪 Fournisseur</Badge>

// Both
<Badge variant="success">🔄 Client & Fournisseur</Badge>
```

### Module Icons
- 📥 Achats (downward arrow = incoming purchases)
- 📤 Ventes (upward arrow = outgoing sales)
- 🎪 Booth Maker (tent icon)
- 👥 Contacts (people icon)

### Color Coding
- Achats: Blue theme (trust, incoming)
- Ventes: Green theme (money, growth)
- Booth Maker: Purple theme (specialty)
- Contacts: Orange theme (relationships)

---

## 📝 Implementation Priority

### Phase 1: Foundation (Week 1)
1. ✅ Create Contact model and table
2. ✅ Migrate existing clients and suppliers
3. ✅ Build Contacts.jsx page with filtering
4. ✅ Update API endpoints

### Phase 2: Module Restructuring (Week 2)
1. ✅ Reorganize sidebar navigation
2. ✅ Move Products under Achats
3. ✅ Add "show_in_booth" checkbox to products
4. ✅ Create Bon de Commande module
5. ✅ Group Booth Maker items together

### Phase 3: Category Management (Week 3)
1. ✅ Add "show_in_booth" to categories
2. ✅ Create Category management under Booth Maker
3. ✅ Build Settings page with category toggle
4. ✅ Filter categories in stand creation

### Phase 4: Polish & Features (Week 4)
1. ✅ Administration module consolidation
2. ✅ Enhanced statistics and reporting
3. ✅ UI/UX improvements
4. ✅ Documentation updates

---

## 🚀 Expected Benefits

### Business Benefits
- **Unified View:** See all relationships in one place
- **Better Tracking:** Know who you buy from and sell to
- **Flexibility:** Contacts can change roles over time
- **Cleaner Data:** No duplicate entries for same company
- **Better Reporting:** Cross-reference purchases vs sales

### Technical Benefits
- **Simpler Schema:** One contact table instead of two
- **Better Relationships:** Cleaner foreign keys
- **Easier Maintenance:** Single source of truth
- **Scalability:** Easy to add new contact types
- **Clearer Purpose:** ERP/CRM first, booth maker second

### User Experience Benefits
- **Logical Navigation:** Clear module separation
- **Focused Tools:** Each module has specific purpose
- **Better Organization:** Related features grouped together
- **Booth Isolation:** Booth tools don't clutter main ERP
- **Settings Control:** Fine-tune what appears where

---

## 📚 Documentation Updates Needed

1. **User Guide:** New navigation structure
2. **Admin Guide:** Contact management, settings configuration
3. **API Documentation:** Updated endpoints for contacts
4. **Migration Guide:** For existing deployments
5. **Developer Guide:** New data model relationships

---

## ✅ Success Criteria

- [ ] All clients and suppliers merged into Contacts
- [ ] No data loss during migration
- [ ] Sidebar reflects new structure
- [ ] Products can be toggled for booth visibility
- [ ] Settings allows category management
- [ ] All existing features still work
- [ ] Performance not degraded
- [ ] Users can understand new structure easily

---

## 🎯 Long-term Vision

This restructuring positions the platform as a **comprehensive business management system** where:

1. **Core Operations** (Contacts, Achats, Ventes) are primary
2. **Specialized Tools** (Booth Maker) are addons
3. **Easy Expansion** to add more modules (Inventory, Accounting, HR)
4. **Professional Grade** ERP/CRM for event and exhibition businesses

The platform becomes a **one-stop solution** for event companies to manage:
- Customer relationships
- Supplier relationships  
- Product inventory
- Purchase orders
- Sales and invoicing
- Exhibition booth rentals (specialized)
- User management
- Business analytics

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Status:** Planning Phase
