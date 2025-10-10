# 📄 Guide: Professional PDF Layout for Bon de Commande

## 🎨 New PDF Design Features

The Purchase Order (Bon de Commande) PDF has been completely redesigned to match professional invoice standards with a modern, clean layout.

### **Layout Structure:**

```
┌─────────────────────────────────────────────────────┐
│ [LOGO]                    BON DE COMMANDE           │
│ EVENT MANAGEMENT                                    │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐    │
│ │ BON DE COMMANDE N°: BC-2025-001            │    │
│ │ DATE: 10/10/2025                           │    │
│ │ ÉCHÉANCE: À RÉCEPTION                      │    │
│ └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌──────────────────────┐    │
│ │ ÉMETTEUR (RED)   │  │ DESTINATAIRE (GOLD)  │    │
│ │ Platform details │  │ Supplier details     │    │
│ └──────────────────┘  └──────────────────────┘    │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐    │
│ │ DESCRIPTION │ QTÉ │ PRIX UNIT. │ TOTAL HT │    │
│ ├─────────────────────────────────────────────┤    │
│ │ Product 1   │  2  │  100 TND   │  200 TND │    │
│ │ Product 2   │  1  │  150 TND   │  150 TND │    │
│ ├─────────────────────────────────────────────┤    │
│ │                      TOTAL HT:  350.00 TND  │    │
│ │                      TVA (19%):  66.50 TND  │    │
│ │                      REMISE:           -    │    │
│ │                      TOTAL TTC: 416.50 TND  │    │
│ └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐    │
│ │ RÈGLEMENT          │ TERMES & CONDITIONS    │    │
│ │ Bank details       │ Payment terms          │    │
│ └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

| Element              | Color  | Hex Code  | Purpose                   |
| -------------------- | ------ | --------- | ------------------------- |
| **Logo Area**        | Red    | `#CC0000` | Branding                  |
| **BC Info Box**      | Purple | `#7B3FF2` | Highlight document number |
| **Émetteur Box**     | Red    | `#CC0000` | Sender information        |
| **Destinataire Box** | Gold   | `#FFB800` | Recipient information     |
| **Items Header**     | Green  | `#4CAF50` | Products table header     |
| **Terms Box**        | Red    | `#CC0000` | Footer terms              |

---

## 📐 Layout Sections

### 1. **Header Section**

- **Left**: Logo placeholder `[LOGO]` with company name
- **Right**: Large "BON DE COMMANDE" title
- Clean, professional top section

### 2. **Document Info Box (Purple Border)**

- Purchase order number
- Date
- Payment deadline
- High visibility with colored border

### 3. **Émetteur / Destinataire (Two Columns)**

- **Left (Red Box)**: Sender details
  - Company name
  - Email
  - Phone
  - Address
- **Right (Gold Box)**: Supplier details
  - Supplier name
  - Email
  - Phone
  - Address

### 4. **Items Table (Green Header)**

- Professional table with:
  - Description (product name + days if applicable)
  - Quantity
  - Unit price in TND
  - Total HT
- **Totals Section**:
  - TOTAL HT
  - TVA (19%)
  - REMISE (discount)
  - TOTAL TTC (final total with VAT)

### 5. **Terms & Conditions (Red Border)**

- **Left**: Payment method (bank details)
- **Right**: Terms and conditions
- Professional footer section

### 6. **Footer Note**

- Small italicized thank you message

---

## 🖼️ How to Add a Real Logo

Currently, the PDF shows `[LOGO]` as a placeholder. To add your actual logo:

### **Option 1: Using Image File**

1. **Add logo to backend:**

```bash
# Create static images folder
mkdir backend/static/images

# Add your logo file (PNG, JPG)
# Place: backend/static/images/logo.png
```

2. **Update the PDF generation code in `app.py`:**

```python
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Image as RLImage

# Inside generate_purchase_pdf function, replace logo placeholder:

# Add logo image
try:
    logo_path = os.path.join(os.path.dirname(__file__), 'static', 'images', 'logo.png')
    logo = RLImage(logo_path, width=3*cm, height=2*cm)
    logo_cell = logo
except:
    # Fallback if logo not found
    logo_cell = Paragraph('<font size="24" color="#CC0000"><b>[LOGO]</b></font><br/><font size="8">EVENT MANAGEMENT</font>', styles['Normal'])

logo_title_data = [
    [
        logo_cell,
        Paragraph('<font size="36"><b>BON DE COMMANDE</b></font>', title_style)
    ]
]
```

### **Option 2: Using Base64 Encoded Image**

If you want to embed the logo directly in the code:

```python
import base64
from io import BytesIO

# Convert your logo to base64
logo_base64 = "iVBORw0KGgoAAAANSUhEUgAA..."  # Your base64 string

# In generate_purchase_pdf:
logo_data = base64.b64decode(logo_base64)
logo_image = ImageReader(BytesIO(logo_data))
logo = RLImage(logo_image, width=3*cm, height=2*cm)
```

### **Option 3: Keep Text Logo (Current)**

The current placeholder `[LOGO]` can be styled as a text logo:

```python
# Already implemented - customize the text:
Paragraph('<font size="24" color="#CC0000"><b>EVENT MGMT</b></font><br/><font size="8">PLATFORM</font>', styles['Normal'])
```

---

## 🛠️ Customization Options

### **Change Colors:**

In `app.py`, look for `colors.HexColor('#XXXXXX')` and replace with your brand colors:

```python
# Example: Change green header to blue
('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2196F3'))  # Blue instead of green
```

### **Change Company Information:**

Update the Émetteur section in `generate_purchase_pdf()`:

```python
emetteur_dest_data = [
    [
        Paragraph('<b>ÉMETTEUR:</b>', styles['Normal']),
        Paragraph('<b>DESTINATAIRE:</b>', styles['Normal'])
    ],
    [
        Paragraph('YOUR COMPANY NAME', styles['Normal']),  # Change this
        Paragraph(supplier_name, styles['Normal'])
    ],
    [
        Paragraph('your-email@company.com', styles['Normal']),  # Change this
        Paragraph(supplier_email, styles['Normal'])
    ],
    # ... etc
]
```

### **Change VAT Rate:**

Currently set to 19% (Tunisian standard):

```python
# In generate_purchase_pdf():
tva_amount = purchase.total_amount * 0.19  # Change 0.19 to your rate
```

### **Add More Fields:**

To add custom fields (PO Reference, Project Name, etc.):

```python
# Add to BC info box:
bc_info_data = [
    # ... existing data ...
    [
        Paragraph(f'<b>PROJET:</b> {purchase.stand.name if purchase.stand else "N/A"}', styles['Normal']),
    ]
]
```

---

## 📏 Layout Measurements

| Element         | Width              | Purpose             |
| --------------- | ------------------ | ------------------- |
| Page            | A4 (210mm × 297mm) | Standard            |
| Margins         | 2cm all sides      | Comfortable spacing |
| Logo area       | 7cm × 3cm          | Left header         |
| Title area      | 10cm               | Right header        |
| Info box        | 17cm               | Full width          |
| Émetteur/Dest   | 8.5cm each         | Two columns         |
| Items table     | 17cm total         | Full width          |
| Description col | 7cm                | Product names       |
| Quantity col    | 3cm                | Numbers             |
| Price cols      | 3.5cm each         | Currency values     |

---

## 🎯 Professional Features

✅ **Clean Layout**: Similar to professional invoices/quotes
✅ **Color-Coded Sections**: Easy to identify different areas
✅ **Proper Spacing**: Comfortable reading with strategic use of whitespace
✅ **Bold Totals**: Key financial information stands out
✅ **Structured Footer**: Professional terms and conditions
✅ **Consistent Fonts**: Helvetica throughout for clarity
✅ **Proper Alignment**: Text aligned for readability
✅ **Currency Format**: TND displayed with proper decimals
✅ **Date Format**: DD/MM/YYYY (European standard)
✅ **Grid Lines**: Clear table structure

---

## 🧪 Testing the New Layout

1. **Restart backend server:**

```bash
cd backend
python app.py
```

2. **Create a purchase order** in the Achat module

3. **Download PDF** - You'll see the new professional layout!

4. **Check for:**
   - All sections properly aligned
   - Colors displaying correctly
   - All data populated
   - Totals calculating correctly (including TVA)
   - Clean, professional appearance

---

## 🐛 Troubleshooting

### **PDF Shows Errors:**

- Check that all required packages are installed:

```bash
pip install reportlab
```

### **Colors Not Showing:**

- Make sure you're using a PDF viewer that supports colors (not all terminal viewers do)

### **Layout Broken:**

- Check that page size is A4
- Verify all table column widths add up correctly
- Ensure no text is too long for cells

### **Logo Not Showing:**

- Verify logo file path is correct
- Check image format (PNG, JPG supported)
- Verify image size is reasonable (< 2MB)

---

## 📝 Next Steps

1. ✅ **Test current layout** - Download a sample PDF
2. 📸 **Add your logo** - Follow Option 1 above
3. 🎨 **Customize colors** - Match your brand
4. ℹ️ **Update company info** - Add your real details
5. 💰 **Adjust VAT** - If different from 19%

The new PDF layout is production-ready and follows professional standards! 🎉
