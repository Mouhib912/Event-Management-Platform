# 📊 Contact System Restructure - Implementation Summary

## ✅ Completed (Backend - Task 7)

### Database Model Changes

- **New Field**: `contact_nature` - determines if contact is 'person' or 'enterprise'
- **Enterprise Fields Added**:

  - `matricule_fiscal` - Tax ID
  - `code_tva` - VAT code
  - `code_douane` - Customs code
  - `registre_commerce` - Commerce registry
  - `legal_form` - Legal form (SARL, SA, etc.)
  - `capital` - Share capital
  - `website` - Company website

- **Person Fields Added**:

  - `enterprise_id` - Foreign key linking person to enterprise
  - `position` - Job title/position

- **Self-Referential Relationship**: Enterprise.employees → Person[]

### API Endpoints Updated

1. **GET /api/contacts**

   - New filter: `?nature=person|enterprise|all`
   - Returns all fields including enterprise/person specific ones
   - Includes `employees_count` for enterprises
   - Includes `enterprise_name` for persons

2. **POST /api/contacts**

   - Handles both person and enterprise creation
   - Validates and saves type-specific fields

3. **PUT /api/contacts/:id**

   - Updates common + type-specific fields
   - Can change contact_nature

4. **NEW: GET /api/contacts/enterprises**

   - Lists all enterprises for dropdown/linking

5. **NEW: GET /api/contacts/enterprises/:id/employees**
   - Gets all employees of a specific enterprise

### Migration Script

- **File**: `backend/migrate_contacts_person_enterprise.py`
- **Auto-runs on deployment** via start.sh
- **Logic**:
  - Contacts with `company` field → person
  - Contacts with `contact_person` field → enterprise
  - Default → person

## 🎯 TODO (Frontend - Task 8)

### Required Changes to Contacts.jsx

#### 1. Update State Management

```javascript
const [formData, setFormData] = useState({
  // Common fields
  name: '',
  email: '',
  phone: '',
  address: '',
  contact_type: 'client',
  contact_nature: 'person', // NEW
  status: 'Actif',
  notes: '',

  // Enterprise-specific
  matricule_fiscal: '',
  code_tva: '',
  code_douane: '',
  registre_commerce: '',
  legal_form: '',
  capital: '',
  website: '',

  // Person-specific
  enterprise_id: null,
  position: '',

  // Legacy (keep for backward compatibility)
  contact_person: '',
  company: '',
  speciality: '',
});
```

#### 2. Add Nature Filter Tabs

Replace/enhance existing tabs:

```jsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="all">Tous</TabsTrigger>
    <TabsTrigger value="enterprises">Entreprises</TabsTrigger>
    <TabsTrigger value="persons">Personnes</TabsTrigger>
    <TabsTrigger value="clients">Clients</TabsTrigger>
    <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
  </TabsList>
</Tabs>
```

#### 3. Update Contact Form Dialog

Add radio buttons for contact_nature selection:

```jsx
<div className="space-y-2">
  <Label>Type de contact</Label>
  <div className="flex gap-4">
    <label className="flex items-center">
      <input
        type="radio"
        value="person"
        checked={formData.contact_nature === 'person'}
        onChange={() => setFormData({ ...formData, contact_nature: 'person' })}
      />
      <User className="ml-2 mr-1" /> Personne
    </label>
    <label className="flex items-center">
      <input
        type="radio"
        value="enterprise"
        checked={formData.contact_nature === 'enterprise'}
        onChange={() =>
          setFormData({ ...formData, contact_nature: 'enterprise' })
        }
      />
      <Building2 className="ml-2 mr-1" /> Entreprise
    </label>
  </div>
</div>
```

#### 4. Conditional Form Fields

Show/hide fields based on `contact_nature`:

**For Enterprises:**

```jsx
{formData.contact_nature === 'enterprise' && (
  <>
    <div>
      <Label>Matricule Fiscal</Label>
      <Input value={formData.matricule_fiscal} onChange={...} />
    </div>
    <div>
      <Label>Code TVA</Label>
      <Input value={formData.code_tva} onChange={...} />
    </div>
    <div>
      <Label>Forme Juridique</Label>
      <Select value={formData.legal_form} onValueChange={...}>
        <SelectItem value="SARL">SARL</SelectItem>
        <SelectItem value="SA">SA</SelectItem>
        <SelectItem value="SUARL">SUARL</SelectItem>
      </Select>
    </div>
    // ... other enterprise fields
  </>
)}
```

**For Persons:**

```jsx
{formData.contact_nature === 'person' && (
  <>
    <div>
      <Label>Entreprise</Label>
      <Select value={formData.enterprise_id} onValueChange={...}>
        {enterprises.map(ent => (
          <SelectItem key={ent.id} value={ent.id}>
            {ent.name}
          </SelectItem>
        ))}
      </Select>
    </div>
    <div>
      <Label>Poste</Label>
      <Input value={formData.position} onChange={...} placeholder="Directeur Commercial" />
    </div>
  </>
)}
```

#### 5. Update Contact Cards Display

Show different information based on nature:

**Enterprise Card:**

```jsx
{
  contact.contact_nature === 'enterprise' ? (
    <Card>
      <CardHeader>
        <Building2 className="h-6 w-6" />
        <CardTitle>{contact.name}</CardTitle>
        {contact.matricule_fiscal && (
          <Badge>MF: {contact.matricule_fiscal}</Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          {contact.legal_form} • {contact.employees_count || 0} employés
        </p>
        // Show employees list or count
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardHeader>
        <User className="h-6 w-6" />
        <CardTitle>{contact.name}</CardTitle>
        {contact.position && <Badge>{contact.position}</Badge>}
      </CardHeader>
      <CardContent>
        {contact.enterprise_name && (
          <p className="text-sm">
            <Building2 className="inline h-4 w-4" />
            {contact.enterprise_name}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 6. Add Enterprise Employee View

Expandable section in enterprise cards:

```jsx
<Button onClick={() => loadEnterpriseEmployees(contact.id)}>
  Voir les employés ({contact.employees_count})
</Button>
```

#### 7. Filter Logic Update

```javascript
const filterContacts = useCallback(() => {
  let filtered = contacts;

  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.enterprise_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  // Tab filter
  switch (activeTab) {
    case 'enterprises':
      filtered = filtered.filter((c) => c.contact_nature === 'enterprise');
      break;
    case 'persons':
      filtered = filtered.filter((c) => c.contact_nature === 'person');
      break;
    case 'clients':
      filtered = filtered.filter(
        (c) => c.contact_type === 'client' || c.contact_type === 'both',
      );
      break;
    case 'suppliers':
      filtered = filtered.filter(
        (c) => c.contact_type === 'fournisseur' || c.contact_type === 'both',
      );
      break;
  }

  setFilteredContacts(filtered);
}, [contacts, searchTerm, activeTab]);
```

### API Service Updates (api.js)

Add new methods:

```javascript
async getEnterprises() {
  return this.request('/contacts/enterprises')
}

async getEnterpriseEmployees(enterpriseId) {
  return this.request(`/contacts/enterprises/${enterpriseId}/employees`)
}
```

## 📄 Task 9: Invoice PDF Updates

### Requirements

- When invoice client is a person with enterprise:
  - Format: "Enterprise Name (Code), à l'ordre de Person Name"
  - Example: "Tunisie Place de Marché TPM, à l'ordre de Mahmoud"

### Implementation Location

- File: `backend/app.py` - PDF generation route
- Look for: `@app.route('/api/invoices/<int:invoice_id>/pdf')`

### Changes Needed

```python
# In PDF generation
client_info = get_client_info(invoice.client_id)

if client_info['contact_nature'] == 'person' and client_info['enterprise_id']:
    enterprise = Contact.query.get(client_info['enterprise_id'])
    client_display = f"{enterprise.name}"
    if enterprise.matricule_fiscal:
        client_display += f" ({enterprise.matricule_fiscal})"
    client_display += f", à l'ordre de {client_info['name']}"
else:
    client_display = client_info['name']
```

## 🎯 Next Steps Priority

1. **Update Contacts.jsx** (1-2 hours)

   - Add state for enterprises list
   - Update form with conditional fields
   - Add nature filter tabs
   - Update card display logic

2. **Test Contact CRUD** (30 min)

   - Create enterprise
   - Create person linked to enterprise
   - Verify relationships
   - Test filters

3. **Update Invoice PDF** (30 min)

   - Modify PDF generation to show hierarchy
   - Test with person+enterprise combo

4. **Add Timbre Fiscal** (1 hour)

   - Add fiscal stamp image/section to PDF template

5. **Editable Invoices** (1 hour)

   - Add edit button to invoices list
   - Load invoice data into form
   - Update backend endpoint

6. **Contact History** (1 hour)
   - Add tab/section in contact view
   - Show stands, invoices related to contact
   - Statistics and transaction history

## ⏱️ Estimated Total Time Remaining: 5-6 hours

All major architecture changes are complete. Remaining work is UI implementation and feature additions.
