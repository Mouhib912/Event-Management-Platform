# 🎯 Quick Start Guide: Contacts Module

## Access the Module

```
Your Browser: http://localhost:5173
                     ↓
              [Login Page]
                     ↓
              [Dashboard]
                     ↓
         Click "Contacts" in Sidebar
                     ↓
         🎉 Contacts Module Opens
```

## Visual Interface Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Contacts                                   [+ Nouveau Contact]      │
│  Gérer tous vos contacts professionnels                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Total   │  │ Clients  │  │Fournisseu│  │   Both   │          │
│  │    9     │  │    0     │  │    rs    │  │    0     │          │
│  │          │  │          │  │    9     │  │          │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  Liste des Contacts                        [Search............] 🔍   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ [All (9)] [Clients (0)] [Fournisseurs (9)] [Both (0)]     │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ Contact 1   │  │ Contact 2   │  │ Contact 3   │                │
│  │ 🏪 Fourniss.│  │ 🏪 Fourniss.│  │ 🏪 Fourniss.│                │
│  │ ✉️ email    │  │ ✉️ email    │  │ ✉️ email    │                │
│  │ 📞 phone    │  │ 📞 phone    │  │ 📞 phone    │                │
│  │ [Edit][Del] │  │ [Edit][Del] │  │ [Edit][Del] │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 5-Minute Quick Start

### Task 1: View Existing Contacts (30 seconds)

1. ✅ Navigate to Contacts in sidebar
2. ✅ See 9 fournisseurs displayed
3. ✅ Notice orange 🏪 badges on each card

### Task 2: Filter by Type (30 seconds)

1. ✅ Click **"Clients"** tab → Empty (0 clients)
2. ✅ Click **"Fournisseurs"** tab → See all 9
3. ✅ Click **"All"** tab → See all 9 again

### Task 3: Search for a Contact (30 seconds)

1. ✅ Type "TechnoDisplay" in search box
2. ✅ See filtered results instantly
3. ✅ Clear search → All contacts return

### Task 4: Create Your First Client (2 minutes)

1. ✅ Click **"+ Nouveau Contact"** button
2. ✅ Fill in the form:
   ```
   Name*: ACME Corporation
   Contact Person: John Doe
   Email: john@acme.com
   Phone: +216 71 123 456
   Type: Client ← Select this!
   Status: Actif
   ```
3. ✅ Click **"Créer"**
4. ✅ See success toast message
5. ✅ See new card with blue 👤 badge
6. ✅ Statistics update: Clients = 1

### Task 5: Change a Contact Type (1 minute)

1. ✅ Click edit icon (✏️) on any fournisseur
2. ✅ Change Type from "Fournisseur" to "Both"
3. ✅ Click **"Mettre à jour"**
4. ✅ Badge changes from 🏪 (orange) to 🔄 (green)
5. ✅ Statistics update: Both = 1

### Task 6: Filter by "Both" (30 seconds)

1. ✅ Click **"Both"** tab
2. ✅ See only contacts with bidirectional relationships
3. ✅ These appear in BOTH client and fournisseur searches

## Understanding Contact Types

### Visual Type Indicators

```
┌─────────────────────────────────────────────────┐
│  Contact Type        Badge        Color          │
├─────────────────────────────────────────────────┤
│  Client             👤 Client     Blue           │
│  Fournisseur        🏪 Fournisseur Orange        │
│  Both               🔄 Les Deux   Green          │
└─────────────────────────────────────────────────┘
```

### When to Use Each Type

**👤 Client (Blue)**

```
Use when: They buy from you
Example: Event organizer ordering stands
Shows in: Clients tab, All tab
```

**🏪 Fournisseur (Orange)**

```
Use when: You buy from them
Example: Lighting supplier, Stand materials
Shows in: Fournisseurs tab, All tab
```

**🔄 Both (Green)**

```
Use when: Bidirectional relationship
Example: Partner company that both:
  - Orders stands from you (client)
  - Supplies materials to you (fournisseur)
Shows in: Clients tab, Fournisseurs tab, Both tab, All tab
```

## Real-World Scenarios

### Scenario 1: New Client Signs Up

```
1. Click "Nouveau Contact"
2. Enter: "Grand Hôtel Tunis"
3. Type: Client
4. Save
→ Result: Blue 👤 badge, appears in Clients tab
```

### Scenario 2: New Supplier Onboarded

```
1. Click "Nouveau Contact"
2. Enter: "LED Masters"
3. Type: Fournisseur
4. Speciality: "Lighting Equipment"
5. Save
→ Result: Orange 🏪 badge, appears in Fournisseurs tab
```

### Scenario 3: Client Becomes Supplier Too

```
1. Edit existing client "Grand Hôtel Tunis"
2. Change Type: Client → Both
3. Add Speciality: "Event Space Rental"
4. Save
→ Result: Green 🔄 badge, appears in BOTH tabs
```

### Scenario 4: Relationship Ends

```
1. Edit contact
2. Change Status: Actif → Inactif
3. Save
→ Result: Contact marked inactive (consider deletion)
```

## Form Fields Explained

### Required Fields

```
Name* : Company or person name (REQUIRED)
Type* : Client / Fournisseur / Both (REQUIRED)
```

### Optional Fields

```
Contact Person : Name of your contact at the company
Company        : Official company name (if Name is different)
Email          : Primary email address
Phone          : Phone number with country code
Address        : Full mailing address
Speciality     : Domain expertise (for suppliers)
Status         : Actif (default) or Inactif
Notes          : Any additional information
```

### Special Field: Speciality

```
This field appears/disappears based on Type:
- Type = Client        → Speciality hidden
- Type = Fournisseur   → Speciality visible
- Type = Both          → Speciality visible
```

## Search & Filter Power

### Multi-Field Search

The search box looks across:

```
✓ Name
✓ Company
✓ Contact Person
✓ Email
✓ Phone
```

### Combined Filtering

```
Search + Tab Filtering = Powerful Queries

Example 1:
  Tab: "Fournisseurs"
  Search: "tech"
  → Result: Only suppliers with "tech" in name/email/etc.

Example 2:
  Tab: "Both"
  Search: "tunis"
  → Result: Bidirectional contacts in Tunis area

Example 3:
  Tab: "All"
  Search: "+216 71"
  → Result: All contacts with that phone prefix
```

## Statistics Dashboard

### What Each Number Means

```
┌──────────────────────────────────────────────────┐
│  Total: All contacts regardless of type          │
│  Clients: Contacts who buy from you              │
│  Fournisseurs: Contacts you buy from             │
│  Both: Contacts with bidirectional relationship  │
└──────────────────────────────────────────────────┘

Note: "Both" contacts are counted in BOTH
      Clients and Fournisseurs numbers
```

### Example Calculation

```
Total Contacts: 10
├─ 3 Clients only
├─ 5 Fournisseurs only
└─ 2 Both (client AND fournisseur)

Display:
┌─────────┬─────────┬─────────────┬──────┐
│  Total  │ Clients │Fournisseurs │ Both │
│   10    │    5    │      7      │   2  │
│         │  (3+2)  │    (5+2)    │      │
└─────────┴─────────┴─────────────┴──────┘
```

## Card Layout Reference

```
┌────────────────────────────────────────────┐
│  Contact Name               [✏️ Edit] [🗑️ Del]│
│  🏢 Company Name (if different)             │
│  ────────────────────────────────────       │
│  🏪 Fournisseur  ← Type Badge               │
│  ────────────────────────────────────       │
│  👤 Contact Person: John Doe                │
│  ✉️  john@example.com                       │
│  📞 +216 71 123 456                         │
│  📍 123 Street Name, City                   │
│  ────────────────────────────────────       │
│  Spécialité: Lighting Equipment             │
│  ────────────────────────────────────       │
│  Notes: Preferred supplier for urgent       │
│         orders. Fast delivery.              │
└────────────────────────────────────────────┘
```

## Common Actions Quick Reference

```
┌─────────────────────┬──────────────────────────┐
│  Action             │  How To                  │
├─────────────────────┼──────────────────────────┤
│  View all           │  Click "All" tab         │
│  View clients       │  Click "Clients" tab     │
│  View suppliers     │  Click "Fournisseurs"    │
│  View bidirectional │  Click "Both" tab        │
│  Search             │  Type in search box      │
│  Create new         │  Click "+ Nouveau"       │
│  Edit existing      │  Click ✏️ icon           │
│  Delete             │  Click 🗑️ icon           │
│  Change type        │  Edit → Change Type      │
│  Mark inactive      │  Edit → Status: Inactif  │
│  Add notes          │  Edit → Notes field      │
└─────────────────────┴──────────────────────────┘
```

## Tips & Best Practices

### 💡 Tip 1: Use "Both" Wisely

```
Only set Type = "Both" when there's a genuine
bidirectional business relationship.

✅ Good: Company that supplies materials AND
        buys finished stands

❌ Bad: Company that might become a client someday
        (keep as Fournisseur until they buy)
```

### 💡 Tip 2: Fill in Contact Person

```
Always add the Contact Person field:
- Helps with follow-ups
- Appears in search results
- Shows who to email/call
```

### 💡 Tip 3: Use Notes Field

```
Track important details:
- Preferred payment terms
- Discount rates
- Special instructions
- Relationship history
```

### 💡 Tip 4: Keep Status Updated

```
Mark contacts as "Inactif" when:
- No longer doing business
- Relationship on hold
- Contact moved/left company

Benefits:
- Clean active list
- Historical record preserved
- Easy to reactivate later
```

### 💡 Tip 5: Search by Phone

```
Quick way to find contacts:
- Search: "+216 71" → All landlines
- Search: "+216 20" → All mobiles (example)
- Search: "123" → Specific number pattern
```

## Current System Status

```
📊 Current Database State (After Migration):

Total Contacts: 9
└─ All are Fournisseurs (migrated from old Supplier table)

Names:
  1. TechnoDisplay Solutions
  2. StandMaster
  3. LightTech
  4. EventPro Services
  5. DecoEvent
  6. Test Supplier (entry 1)
  7. Test Supplier (entry 2)
  8. test
  9. test2

Next Steps:
  1. Create your first CLIENT contact
  2. Test the filtering
  3. Change a fournisseur to "Both" type
  4. See the green 🔄 badge appear!
```

## Keyboard Shortcuts

```
Press Tab     → Move to next form field
Press Enter   → Submit form (when in dialog)
Press Esc     → Close dialog without saving
Click Outside → Close dropdown menus
```

## Mobile View

```
┌─────────────┐
│ Statistics  │
│  (stacked)  │
├─────────────┤
│ Search Box  │
├─────────────┤
│   Filters   │
│ (horizontal)│
├─────────────┤
│  Contact 1  │
│ (full width)│
├─────────────┤
│  Contact 2  │
│ (full width)│
├─────────────┤
│  Contact 3  │
│ (full width)│
└─────────────┘
```

## What's Next?

After mastering Contacts, you'll integrate them into:

1. **Invoices/Devis** → Select contact instead of separate client
2. **Stand Orders** → Link to contact (client type)
3. **Purchase Orders** → Link to contact (fournisseur type)
4. **Products** → Link to supplier contact

This unified approach simplifies your entire workflow! 🚀

---

_Ready to test? Visit: http://localhost:5173/contacts_
_Questions? Check: CONTACTS_MODULE_COMPLETE.md_
