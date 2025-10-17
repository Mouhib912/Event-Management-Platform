# Direct Invoice Creation Feature

## Overview
Added the ability to create invoices and quotes (devis) directly without requiring a stand. Users can now choose between:
1. **Stand-based creation** (existing): Select an approved stand → products auto-populated from stand
2. **Direct creation** (new): Select client directly → manually add products → configure pricing

## What Changed

### Frontend Changes (`src/components/Invoices.jsx`)

#### 1. New State Management
```javascript
const [contacts, setContacts] = useState([]);    // Client contacts
const [products, setProducts] = useState([]);    // Available products
const [useStand, setUseStand] = useState(true);  // Toggle between modes
```

#### 2. Enhanced Data Loading
- Added API calls to fetch contacts (filtered to clients only) and products
- Both lists are loaded on component mount for direct creation mode

#### 3. Creation Mode Toggle
- Added two-button toggle in dialog: "À partir d'un Stand" vs "Création Directe"
- Conditional rendering based on `useStand` state:
  - Stand mode: Show stand selector
  - Direct mode: Show client selector

#### 4. Client Selection (Direct Mode)
- Dropdown of all client contacts
- Auto-populates client information (name, email, phone, address, company)
- Manual override option for client details

#### 5. Product Management (Direct Mode)
- "Add Product" button to add new product lines
- Product dropdown selector with price display
- Editable fields for each product:
  - Quantity
  - Days (rental duration)
  - Unit price (auto-populated, editable)
  - Factor (x1 or x1.5 pricing)
  - Total price (auto-calculated)
- Delete button for each product line (XCircle icon)

#### 6. Enhanced Validation
- Stand mode: Requires stand selection
- Direct mode: Requires client name and at least one product
- Both modes: Validate pricing and totals

#### 7. Empty State Message
When no products added in direct mode:
> "Aucun produit ajouté. Cliquez sur 'Ajouter Produit' pour commencer."

### Backend Changes (`backend/app.py`)

#### 1. Invoice Model Update
```python
# Before:
stand_id = db.Column(db.Integer, db.ForeignKey('stand.id'), nullable=False)

# After:
stand_id = db.Column(db.Integer, db.ForeignKey('stand.id'), nullable=True)
```

#### 2. Enhanced `create_invoice()` Endpoint
- Added `use_stand` flag detection from request data
- Two creation pathways:
  
**Stand-Based Mode** (`use_stand=true`):
- Verifies stand exists and is approved
- Fetches client info from stand
- Uses stand's products and pricing
- Links invoice to stand (`stand_id` set)

**Direct Mode** (`use_stand=false`):
- No stand required (`stand_id=null`)
- Fetches client from Contact model or uses provided data
- Requires `modified_items` array with products
- Validates at least one product provided

#### 3. Client Data Handling
Priority order for client information:
1. Form data (manual input)
2. Stand client (if stand-based)
3. Contact data (if client_id provided in direct mode)
4. Defaults

#### 4. PDF Generation Update
```python
# Updated to handle optional stand
stand = invoice.stand if invoice.stand_id else None

# Conditional stand info in PDF header
stand_info = f' | <b>STAND:</b> {stand.name}' if stand else ''
```

### Database Migration

**Script**: `backend/migrate_invoice_stand_nullable.py`

**Changes**:
- Made `stand_id` column nullable in `invoice` table
- Preserved all existing invoice data
- Handles both simple and extended schema versions

**Run**: 
```bash
cd backend
python migrate_invoice_stand_nullable.py
```

## User Experience

### Creating an Invoice/Devis - Stand Mode
1. Click "Créer Devis/Facture"
2. Select "À partir d'un Stand"
3. Choose an approved stand from dropdown
4. Client and products auto-populate from stand
5. Optionally edit product quantities, days, factors
6. Configure pricing (remise, TVA)
7. Submit

### Creating an Invoice/Devis - Direct Mode
1. Click "Créer Devis/Facture"
2. Select "Création Directe"
3. Choose client from dropdown (or enter manually)
4. Click "Ajouter Produit"
5. Select product from dropdown (price auto-fills)
6. Set quantity and days
7. Choose factor (x1 or x1.5)
8. Repeat for multiple products
9. Remove products with delete button if needed
10. Configure pricing (remise, TVA)
11. Submit

## Benefits

1. **Flexibility**: Create invoices for one-off sales without stand requirement
2. **Speed**: Quick quotes for clients without full stand configuration
3. **Accuracy**: Direct product selection with auto-price population
4. **Backwards Compatible**: Existing stand-based workflow unchanged
5. **Data Integrity**: Validation ensures all required fields present

## Technical Notes

- Direct invoices have `stand_id = NULL` in database
- Stand-based invoices maintain referential integrity with stands
- PDF generation works for both types
- Invoice items stored in `invoice_item` table with full product details
- Pricing calculations identical for both modes

## Files Modified

1. `src/components/Invoices.jsx` - Frontend component (260 lines changed)
2. `backend/app.py` - Backend API and models (3 locations updated)
3. `backend/migrate_invoice_stand_nullable.py` - Database migration (new file)

## Testing Checklist

- [x] Database migration successful
- [x] Backend accepts `use_stand` flag
- [x] Stand mode still works (backwards compatibility)
- [ ] Direct mode creates invoice without stand
- [ ] Client selection populates fields
- [ ] Product addition works
- [ ] Product removal works  
- [ ] Price calculations correct
- [ ] PDF generation for direct invoices
- [ ] Devis to Facture conversion

## Deployment

1. Run database migration on production database
2. Deploy backend changes (app.py)
3. Deploy frontend changes (Invoices.jsx)
4. Test both creation modes
5. Monitor for any issues

## Future Enhancements

- Search/filter products by category
- Save product configurations as templates
- Bulk import products from CSV
- Client creation from invoice dialog
- Product quick-add from recent/favorites
