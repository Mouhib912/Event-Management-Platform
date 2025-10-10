# 🚀 Quick Logo Setup - 3 Steps

## Step 1: Create the static folder

```powershell
# Run this in PowerShell from the backend directory
cd C:\Users\mouhib\Downloads\event-management-platform\backend
mkdir static
```

## Step 2: Add your logo

Place your company logo in the `backend/static/` folder and name it `logo.png`

**Path should be:**

```
backend/
  static/
    logo.png    ← Your logo here
```

## Step 3: Restart Flask

Stop your Flask server (Ctrl+C) and start it again:

```powershell
python app.py
```

---

## 📋 Logo Requirements

- **Format:** PNG (recommended), JPG, or JPEG
- **Recommended size:** 300x150 pixels or 400x200 pixels
- **Background:** Transparent PNG works best
- **Aspect ratio:** 2:1 (width:height) looks professional

---

## ✅ How to Test

1. **Go to the Achat module** in your application
2. **Create a purchase order** for an approved stand
3. **Download the PDF** - your logo should appear in the top-left corner!

**If the logo doesn't appear**, check the Flask terminal for these messages:

- ✓ `Logo loaded successfully from ...` - **Success!**
- ℹ `Logo not found at ...` - **File missing or wrong name**
- ✗ `Error loading logo: ...` - **File format issue**

---

## 🎨 Customization Options

### Change Logo Size

Edit `app.py` line ~715:

```python
logo = RLImage(logo_path, width=5*cm, height=2.5*cm)
#                                ^^^^        ^^^^^
# Increase or decrease these values
```

### Change Logo Position

The logo is in a table layout. To adjust spacing, edit line ~746:

```python
logo_title_table = Table(logo_title_data, colWidths=[7*cm, 10*cm])
#                                                      ^^^^  ^^^^^
# First value: logo column width
# Second value: title column width
```

---

## 🔧 Troubleshooting

### Logo appears stretched or distorted

→ Use aspect ratio 2:1 (width twice the height)
→ Or adjust the `width` and `height` parameters in the code

### Logo is too small/large

→ Increase/decrease the `width` and `height` values in `app.py`

### Logo has white background

→ Use PNG format with transparency
→ Or edit your logo in a tool like Photoshop/GIMP to remove background

### File not found error

→ Make sure the file is named exactly `logo.png` (lowercase)
→ Make sure it's in `backend/static/` folder
→ Restart the Flask server

---

## 📁 Example Folder Structure

```
event-management-platform/
├── backend/
│   ├── app.py
│   ├── static/
│   │   └── logo.png          ← Your logo here
│   └── instance/
│       └── event_management.db
├── src/
└── package.json
```

---

## 💡 Pro Tips

1. **Export from design software:** If you have your logo in AI or PSD format, export as PNG with transparent background
2. **Online tools:** Use tools like remove.bg to remove background from existing logos
3. **Test locally first:** Always test the PDF locally before sharing with clients
4. **Backup:** Keep a copy of your original high-resolution logo

---

## Need More Help?

See the detailed guide: `LOGO_SETUP_GUIDE.md`
