# Quick Guide: Direct Invoice Creation

## What's New?

You can now create invoices and quotes (devis) **without** needing to create a stand first!

## Two Ways to Create Invoices

### Method 1: From a Stand (Original Way)

Perfect for events with pre-configured stands.

- Select an approved stand
- Products and client auto-populate
- Quick and easy for event-based sales

### Method 2: Direct Creation (NEW!)

Perfect for one-off sales or custom quotes.

- Select client directly
- Add products manually
- Full control over pricing

## How to Use Direct Creation

1. **Open Invoices Page**

   - Navigate to "Factures/Devis" in the sidebar

2. **Click "Créer Devis/Facture"**

   - Big green button at top right

3. **Choose "Création Directe"**

   - Toggle between the two buttons
   - "Création Directe" button will highlight

4. **Select Client**

   - Dropdown shows all your clients
   - Or type client details manually

5. **Add Products**

   - Click "Ajouter Produit" button
   - Select product from dropdown
   - Price fills in automatically
   - Set quantity and days
   - Choose factor (×1 or ×1.5)
   - Total price calculates automatically

6. **Add More Products** (Optional)

   - Click "Ajouter Produit" again
   - Repeat for each product
   - Remove unwanted products with delete button (red X)

7. **Configure Pricing** (Optional)

   - Add discount (remise) in % or fixed amount
   - Adjust TVA percentage if needed

8. **Submit**
   - All totals calculate automatically
   - Creates a devis (quote)
   - Convert to facture when signed

## Field Explanations

| Field             | Description                                       |
| ----------------- | ------------------------------------------------- |
| **Quantité**      | Number of units                                   |
| **Jours**         | Rental duration (for event equipment)             |
| **Prix Unitaire** | Price per unit per day                            |
| **Facteur**       | Pricing multiplier (x1 standard, x1.5 premium)    |
| **Total**         | Auto-calculated: Quantity × Days × Price × Factor |

## Tips

✅ **Do:**

- Add at least one product before submitting
- Double-check quantities and pricing
- Use factors for premium/discount pricing
- Select existing clients when possible

❌ **Don't:**

- Submit without products (validation will stop you)
- Forget to set quantities and days
- Mix up stand mode and direct mode

## Examples

### Example 1: Simple Product Sale

- Client: ABC Company
- Product: Booth 3x3m
- Quantity: 1
- Days: 3
- Price: 500 TND
- Factor: x1
- **Total: 1,500 TND**

### Example 2: Multiple Products

- Client: XYZ Events
- Products:
  1. Booth 6x6m × 1 × 5 days × 1200 TND × 1 = 6,000 TND
  2. Sound System × 2 × 5 days × 300 TND × 1 = 3,000 TND
  3. Lighting × 3 × 5 days × 150 TND × 1.5 = 3,375 TND
- **Subtotal: 12,375 TND**
- Remise: 10% = -1,237.50 TND
- Total HT: 11,137.50 TND
- TVA 19%: 2,116.13 TND
- **Total TTC: 13,253.63 TND**

## Differences from Stand Mode

| Feature        | Stand Mode      | Direct Mode           |
| -------------- | --------------- | --------------------- |
| Requires Stand | ✅ Yes          | ❌ No                 |
| Products       | Auto from stand | Manual selection      |
| Client         | From stand      | Select/enter directly |
| Speed          | Faster          | More flexible         |
| Use Case       | Events          | One-off sales         |

## What Happens After Creation?

1. **Devis Created**

   - Assigned unique number (DEV-2025-XXXX)
   - Status: "devis" (quote)
   - Saved to database

2. **PDF Generated**

   - Download button appears
   - Professional formatted quote
   - Client and product details
   - Your company branding

3. **Convert to Facture**

   - When client signs/approves
   - Click "Signer" button
   - Number changes (DEV → FAC)
   - Record advance payment

4. **Track Payment**
   - Mark as paid when received
   - Payment history tracked
   - Financial reports updated

## Troubleshooting

**Problem**: Can't submit invoice

- **Solution**: Make sure you added at least one product

**Problem**: Client not in dropdown

- **Solution**: Add client in Contacts page first, or type manually

**Problem**: Product price is zero

- **Solution**: Set price in Products page, or enter manually

**Problem**: Total not calculating

- **Solution**: Check that quantity and days are both set

## Need Help?

- Check DIRECT_INVOICE_FEATURE.md for technical details
- Review INVOICE_SYSTEM_SUMMARY.md for system overview
- Contact system administrator for database issues
