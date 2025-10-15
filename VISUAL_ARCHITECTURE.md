# 📐 Platform Architecture - Visual Comparison

## Current State vs Future State

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CURRENT STRUCTURE                            │
│                        (Booth-Centric)                               │
└─────────────────────────────────────────────────────────────────────┘

    Database Tables                    Main Focus
    ───────────────                    ──────────
    • Client ────────┐                 🎪 BOOTH MAKER
    • Supplier ──────┤                    ↓
    • Product        │                 Create Stands
    • Stand ←────────┘                    ↓
    • Invoice                          Everything serves
    • Category                         booth creation
    • User

    Problems:
    ❌ Client & Supplier separate (duplicates for companies)
    ❌ No purchase tracking
    ❌ Booth maker dominates navigation
    ❌ No category management
    ❌ Products not organized by module


┌─────────────────────────────────────────────────────────────────────┐
│                         FUTURE STRUCTURE                             │
│                        (ERP/CRM-Centric)                            │
└─────────────────────────────────────────────────────────────────────┘

    Database Tables                    Main Focus
    ───────────────                    ──────────
    • Contact ──────┐                  🏢 ERP/CRM
         (unified)  │                     ↓
                    ├──→ BonCommande  📥 ACHATS (Purchases)
    • Product ──────┤      ↓             • Buy from contacts
    • Category      │   Track          📤 VENTES (Sales)
    • Stand         │   purchases        • Sell to contacts
    • Invoice ──────┘      ↓             ↓
    • User              Generate      🎪 BOOTH MAKER (Addon)
                        invoices        • Uses products
                                        • Creates stands

    Benefits:
    ✅ Unified contacts (can be both client & supplier)
    ✅ Full purchase order tracking
    ✅ Logical module separation
    ✅ Product visibility control
    ✅ Professional ERP/CRM platform


═══════════════════════════════════════════════════════════════════════
                        NAVIGATION COMPARISON
═══════════════════════════════════════════════════════════════════════

┌──────────────────────────┐       ┌──────────────────────────┐
│      CURRENT (OLD)       │       │      FUTURE (NEW)        │
├──────────────────────────┤       ├──────────────────────────┤
│ 📊 Dashboard             │       │ 📊 Dashboard             │
│ 👤 Clients               │       │ 👥 Contacts (CRM)        │
│ 🏪 Suppliers             │       │    ├─ All               │
│ 📦 Products              │       │    ├─ Clients           │
│ 🎪 Créer un Stand        │       │    └─ Fournisseurs      │
│ 📋 Catalogue Stands      │       │ 📥 Achats               │
│ 🎨 Simulateur            │       │    ├─ Bon de Commande   │
│ 📄 Factures              │       │    └─ Produits          │
│ 📊 Statistiques          │       │ 📤 Ventes               │
│ 👥 Gestion Utilisateurs  │       │    └─ Factures & Devis  │
│                          │       │ 🎪 Booth Maker          │
│                          │       │    ├─ Créer Stand       │
│                          │       │    ├─ Catalogue         │
│                          │       │    ├─ Simulateur        │
│                          │       │    └─ Catégories        │
│                          │       │ 📊 Statistiques         │
│                          │       │ ⚙️  Administration       │
│                          │       │    └─ Utilisateurs      │
│                          │       │ 🔧 Paramètres           │
│                          │       │    └─ Config Booth      │
└──────────────────────────┘       └──────────────────────────┘

   Flat Structure                   Hierarchical Modules
   No Grouping                      Business Logic Groups
   Booth-First                      ERP-First


═══════════════════════════════════════════════════════════════════════
                         DATA MODEL EVOLUTION
═══════════════════════════════════════════════════════════════════════

BEFORE: Separate Tables
━━━━━━━━━━━━━━━━━━━━━━━━
┌────────────┐        ┌─────────────┐
│  Client    │        │  Supplier   │
├────────────┤        ├─────────────┤
│ id         │        │ id          │
│ name       │        │ name        │
│ email      │        │ email       │
│ phone      │        │ phone       │
│ address    │        │ address     │
│ company    │        │ speciality  │
│ status     │        │ status      │
└────────────┘        └─────────────┘
     ↑                       ↑
     │                       │
     │                       │
┌────────────┐        ┌─────────────┐
│  Stand     │        │  Product    │
│ client_id  │        │ supplier_id │
└────────────┘        └─────────────┘

Problem: What if Company A is BOTH a client (buys stands)
         AND a supplier (sells us products)?
         → Duplicate entry needed! ❌


AFTER: Unified Contact
━━━━━━━━━━━━━━━━━━━━━━
              ┌─────────────────┐
              │    Contact      │
              ├─────────────────┤
              │ id              │
              │ name            │
              │ email           │
              │ phone           │
              │ address         │
              │ company         │
              │ contact_type    │ ← 'client' | 'fournisseur' | 'both'
              │ speciality      │
              │ status          │
              │ notes           │
              └─────────────────┘
                      ↑
        ┌─────────────┼─────────────┐
        │             │             │
┌───────────┐  ┌─────────────┐  ┌──────────┐
│  Stand    │  │ BonCommande │  │ Product  │
│contact_id │  │ contact_id  │  │contact_id│
└───────────┘  └─────────────┘  └──────────┘

Solution: One entry, multiple roles! ✅
          Company A appears once with type='both'


═══════════════════════════════════════════════════════════════════════
                    PRODUCT VISIBILITY CONTROL
═══════════════════════════════════════════════════════════════════════

NEW FEATURE: show_in_booth Toggle

┌───────────────────────────────────────────────────────────┐
│                      PRODUCTS                              │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  Booth Equipment (show_in_booth = TRUE) ✅                │
│  ════════════════════════════════════════                 │
│  • Table (Mobilier)                                       │
│  • Chair (Mobilier)                                       │
│  • LED Light (Éclairage)                                  │
│  • Monitor (Électronique)                                 │
│  • Carpet (Textile)                                       │
│                                                            │
│  Office Supplies (show_in_booth = FALSE) ❌               │
│  ════════════════════════════════════════                 │
│  • Internet Service                                       │
│  • Office Printer                                         │
│  • Software License                                       │
│  • Paper & Stationery                                     │
│                                                            │
└───────────────────────────────────────────────────────────┘
                              │
                              ↓
        When creating a Stand, ONLY ✅ products appear!


═══════════════════════════════════════════════════════════════════════
                         WORKFLOW EXAMPLES
═══════════════════════════════════════════════════════════════════════

Example 1: Purchase Workflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Go to 📥 Achats → Bon de Commande
2. Click "Créer un Bon"
3. Select Fournisseur: "Company C" (contact_type: 'fournisseur')
4. Add products:
   - 10x Tables @ 200 TND = 2,000 TND
   - 40x Chairs @ 50 TND = 2,000 TND
5. Total: 4,000 TND HT
6. Submit → Purchase tracked in system
7. Mark as "Received" when delivered


Example 2: Sale Workflow (Booth Rental)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Go to 🎪 Booth Maker → Créer un Stand
2. Select Client: "Company A" (contact_type: 'client' or 'both')
3. Add products (only products with show_in_booth=TRUE appear):
   - 2x Tables
   - 8x Chairs
   - 4x LED Lights
   - 1x Monitor
4. Calculate total
5. Generate Devis
6. Client signs → Convert to Facture
7. Track in 📤 Ventes


Example 3: Mixed Relationship
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contact: "Company A"
Type: 'both' (Client & Fournisseur)

AS CLIENT:
  📤 Ventes → Factures
  - Rented booth in 2024: 5,000 TND
  - Rented booth in 2025: 6,500 TND
  Total revenue from them: 11,500 TND

AS FOURNISSEUR:
  📥 Achats → Bons de Commande
  - Bought IT services: 2,000 TND
  - Bought software licenses: 1,500 TND
  Total spent with them: 3,500 TND

NET: We earned 8,000 TND from this relationship ✅


═══════════════════════════════════════════════════════════════════════
                    CATEGORY MANAGEMENT EXAMPLE
═══════════════════════════════════════════════════════════════════════

🔧 Settings → Catégories Booth Maker

┌─────────────────────────────────────────────────────────┐
│  Category          │ Products │ Show in Booth │ Status  │
├─────────────────────────────────────────────────────────┤
│  📦 Mobilier       │    15    │      ✅       │ Active  │
│  💡 Éclairage      │     8    │      ✅       │ Active  │
│  🎨 Décoration     │    12    │      ✅       │ Active  │
│  📺 Électronique   │     6    │      ✅       │ Active  │
│  🧵 Textile        │     9    │      ✅       │ Active  │
│  🌐 Internet       │     2    │      ❌       │ Hidden  │
│  💼 Services IT    │     4    │      ❌       │ Hidden  │
│  📄 Fournitures    │    10    │      ❌       │ Hidden  │
└─────────────────────────────────────────────────────────┘

Effect:
• When creating a stand → Only first 5 categories visible
• Products from Internet, Services IT, Fournitures: Not shown
• Admin can toggle categories on/off anytime
• Keeps booth maker focused and uncluttered


═══════════════════════════════════════════════════════════════════════
                        IMPLEMENTATION ROADMAP
═══════════════════════════════════════════════════════════════════════

Week 1: Foundation
├─ Create Contact model
├─ Migration script (Client + Supplier → Contact)
├─ Update API endpoints
└─ Build Contacts.jsx with filters

Week 2: Module Restructure
├─ New sidebar navigation
├─ Move Products to Achats
├─ Create Bon de Commande module
├─ Group Booth Maker items
└─ Update all references

Week 3: Category & Settings
├─ Add show_in_booth to Product
├─ Add show_in_booth to Category
├─ Create Settings page
├─ Category management UI
└─ Filter logic in stand creation

Week 4: Polish & Launch
├─ Administration consolidation
├─ Enhanced reporting
├─ UI/UX improvements
├─ Documentation
└─ User training


═══════════════════════════════════════════════════════════════════════
                           FINAL VISION
═══════════════════════════════════════════════════════════════════════

         🏢 COMPREHENSIVE ERP/CRM PLATFORM
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    📥 ACHATS       📤 VENTES       👥 CONTACTS
         │               │               │
    Track all      Manage sales    Single source
    purchases      & invoices      of truth
         │               │               │
         └───────────────┴───────────────┘
                         │
                  ┌──────┴──────┐
                  │             │
            🎪 BOOTH MAKER   📊 REPORTS
            (Specialized)   (Analytics)

    A professional platform for event companies to manage
    their entire business, with booth rental as a specialized
    value-added service.

═══════════════════════════════════════════════════════════════════════
```
