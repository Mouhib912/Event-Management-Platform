# Timbre Fiscale Feature - Complete Implementation

## Overview
Successfully implemented "timbre fiscale" (fiscal stamp) field for invoices/devis. The timbre fiscale is an additional tax/expense that appears after TVA and is included in the total TTC calculation.

## Implementation Summary

### Backend Changes (✅ Complete)

#### 1. Database Migration
**File:** `backend/add_timbre_fiscale.py`
- Added `timbre_fiscale` column to `invoice` table
- Type: REAL (Float)
- Default value: 0
- Migration executed successfully

#### 2. Invoice Model Update
**File:** `backend/app.py`
- Added field to Invoice model:
  ```python
  timbre_fiscale = db.Column(db.Float, default=0)  # Fiscal stamp amount
  ```

#### 3. Invoice Creation Logic
**Updated calculation:**
```python
tva_amount = total_ht * (tva_percentage / 100)
timbre_fiscale = float(data.get('timbre_fiscale', 0))
total_ttc = total_ht + tva_amount + timbre_fiscale  # Include timbre fiscale
```

**Invoice creation:**
- Accepts `timbre_fiscale` from request
- Includes it in total TTC calculation
- Stores value in database

#### 4. GET Endpoints
Both list and single invoice endpoints now return:
```python
'timbre_fiscale': inv.timbre_fiscale if hasattr(inv, 'timbre_fiscale') else 0
```

#### 5. PDF Generation
**Updated invoice PDF to show timbre fiscale:**
```python
['', '', Paragraph('<b>TOTAL HT:</b>', styles['Normal']), ...],
['', '', Paragraph('<b>TVA (19%):</b>', styles['Normal']), ...],
['', '', Paragraph('<b>Timbre Fiscale:</b>', styles['Normal']), ...],  # NEW
['', '', Paragraph('<b>TOTAL TTC:</b>', styles['Normal']), ...],
```

### Frontend Changes (✅ Complete)

#### 1. Form Data State
**File:** `src/components/Invoices.jsx`
```javascript
const [formData, setFormData] = useState({
  // ... other fields
  currency: 'TND',
  timbre_fiscale: 0,  // NEW
  tva_percentage: 19,
});
```

#### 2. Input Field
Added input field after currency selector:
```jsx
<div>
  <Label htmlFor="timbre_fiscale">Timbre Fiscale ({formData.currency})</Label>
  <Input
    id="timbre_fiscale"
    type="number"
    min="0"
    step="0.01"
    value={formData.timbre_fiscale}
    onChange={(e) => handleInputChange('timbre_fiscale', parseFloat(e.target.value) || 0)}
  />
</div>
```

#### 3. Calculation Logic
Updated `calculateTotal()` function:
```javascript
const tvaAmount = totalHT * (formData.tva_percentage / 100);
const timbreFiscale = parseFloat(formData.timbre_fiscale || 0);
const totalTTC = totalHT + tvaAmount + timbreFiscale;  // Include timbre fiscale

return {
  subtotal: subtotal.toFixed(2),
  totalHT: totalHT.toFixed(2),
  tvaAmount: tvaAmount.toFixed(2),
  timbreFiscale: timbreFiscale.toFixed(2),  // NEW
  totalTTC: totalTTC.toFixed(2)
};
```

#### 4. Display in Form Preview
Shows timbre fiscale in the totals section (only if > 0):
```jsx
<div className="flex justify-between text-sm">
  <span>TVA ({formData.tva_percentage}%):</span>
  <span className="font-semibold">{calculateTotal().tvaAmount} {formData.currency}</span>
</div>
{formData.timbre_fiscale > 0 && (
  <div className="flex justify-between text-sm">
    <span>Timbre Fiscale:</span>
    <span className="font-semibold">{calculateTotal().timbreFiscale} {formData.currency}</span>
  </div>
)}
<Separator />
<div className="flex justify-between text-lg font-bold text-blue-700">
  <span>Total TTC:</span>
  <span>{calculateTotal().totalTTC} {formData.currency}</span>
</div>
```

#### 5. Edit Invoice Support
- Added timbre_fiscale to form reset function
- Loads existing timbre_fiscale value when editing invoice
- Maintains value through form updates

## How It Works

### User Workflow
1. **Create/Edit Invoice:**
   - Fill out invoice form as usual
   - Enter timbre fiscale amount (e.g., 1.000 TND)
   - Currency indicator shows in label
   - Preview updates in real-time

2. **Calculation Order:**
   ```
   Subtotal (all products)
   - Remise (if any)
   = Total HT
   + TVA (percentage of Total HT)
   + Timbre Fiscale (fixed amount)
   = Total TTC
   ```

3. **PDF Generation:**
   - Timbre fiscale appears as a line item after TVA
   - Included in Total TTC calculation
   - Shows in selected currency

4. **Invoice List:**
   - Total TTC includes timbre fiscale
   - All amounts display with correct currency

## Key Features

✅ **Flexible Amount:** Can be set to any value (default 0)
✅ **Currency Aware:** Label shows selected currency
✅ **Real-time Calculation:** Updates preview immediately
✅ **PDF Integration:** Appears on generated invoices
✅ **Edit Support:** Can modify timbre fiscale when editing
✅ **Optional Display:** Only shows in preview if > 0
✅ **Backend Validation:** Accepts numeric values including 0

## Example Calculation

**Invoice with Timbre Fiscale:**
```
Product 1: 100.00 TND
Product 2: 200.00 TND
--------------------------
Subtotal:       300.00 TND
Remise (10%):   -30.00 TND
--------------------------
Total HT:       270.00 TND
TVA (19%):       51.30 TND
Timbre Fiscale:   1.00 TND  ← NEW
--------------------------
Total TTC:      322.30 TND
```

## Testing Checklist

- [x] Database migration executed
- [x] Backend accepts timbre_fiscale parameter
- [x] Backend includes in total calculation
- [x] Backend returns timbre_fiscale in GET endpoints
- [x] PDF shows timbre fiscale line
- [x] Frontend form has input field
- [x] Frontend calculates correctly
- [x] Preview shows timbre fiscale
- [x] Edit invoice loads timbre_fiscale value
- [x] Currency indicator works correctly
- [x] All changes committed and pushed

## Deployment Status

**Backend:**
- Commit: `d608d0da`
- Status: ✅ Deployed

**Frontend:**
- Commit: `8384c5cc`
- Status: ✅ Deployed

## Usage Example

```javascript
// Create invoice with timbre fiscale
const invoiceData = {
  client_name: "Client Name",
  currency: "TND",
  tva_percentage: 19,
  timbre_fiscale: 1.0,  // 1 TND fiscal stamp
  items: [...]
};
```

## Notes

- Timbre fiscale is typically a fixed amount (e.g., 1.000 TND in Tunisia)
- It's added after TVA calculation
- It's included in the Total TTC
- The field is optional (defaults to 0)
- Works with all supported currencies (TND, EUR, USD, GBP)

---

**Feature Status:** ✅ **COMPLETE & DEPLOYED**
**Date:** 2025-01-22
