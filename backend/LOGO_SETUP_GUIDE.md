# 🎨 Guide: Ajouter Votre Logo au Bon de Commande PDF

## 📋 Vue d'ensemble

Ce guide vous explique comment ajouter le logo de votre entreprise au PDF des bons de commande.

---

## 🖼️ Option 1: Utiliser un Fichier Image (Recommandé)

### **Étape 1: Préparer Votre Logo**

**Formats acceptés:**

- PNG (recommandé - fond transparent)
- JPG/JPEG
- GIF

**Dimensions recommandées:**

- Largeur: 200-400 pixels
- Hauteur: 80-150 pixels
- Ratio: Environ 3:1 ou 2:1

**Exemple de fichiers:**

```
✅ logo.png
✅ company-logo.jpg
✅ event-management-logo.png
```

---

### **Étape 2: Placer le Logo**

**Créez le dossier static/images:**

```bash
# Dans le dossier backend
mkdir -p static/images
```

**Copiez votre logo:**

```bash
# Windows
copy "C:\chemin\vers\votre\logo.png" "backend\static\images\logo.png"

# Linux/Mac
cp /chemin/vers/votre/logo.png backend/static/images/logo.png
```

**Structure finale:**

```
backend/
├── app.py
├── static/
│   └── images/
│       └── logo.png          ← Votre logo ici
├── instance/
└── requirements.txt
```

---

### **Étape 3: Installer la Bibliothèque PIL/Pillow**

ReportLab nécessite Pillow pour gérer les images:

```bash
# Activez votre environnement virtuel
.venv\Scripts\activate

# Installez Pillow
pip install Pillow
```

Ou ajoutez à `requirements.txt`:

```txt
Pillow>=10.0.0
```

---

### **Étape 4: Mettre à Jour le Code**

Le code a été mis à jour pour chercher automatiquement le logo dans:

1. `backend/static/images/logo.png`
2. `backend/static/images/logo.jpg`
3. `backend/static/images/company-logo.png`

Si aucun logo n'est trouvé, un placeholder texte s'affiche.

---

## 🔧 Option 2: Code Personnalisé pour Logo

Si vous voulez contrôler précisément la position et la taille:

```python
from reportlab.platypus import Image
from reportlab.lib.units import cm
import os

# Chemin vers votre logo
logo_path = os.path.join('static', 'images', 'logo.png')

if os.path.exists(logo_path):
    # Créer l'image avec dimensions spécifiques
    logo = Image(logo_path, width=5*cm, height=2*cm)
    content.append(logo)
else:
    # Fallback text
    content.append(Paragraph('[LOGO]', styles['Normal']))
```

---

## 📐 Ajuster la Taille du Logo

Dans `app.py`, ligne ~730, vous pouvez modifier:

```python
# Taille actuelle (par défaut)
logo_img = Image(logo_path, width=5*cm, height=2*cm)

# Logo plus grand
logo_img = Image(logo_path, width=7*cm, height=2.8*cm)

# Logo plus petit
logo_img = Image(logo_path, width=4*cm, height=1.6*cm)

# Garder le ratio d'origine
logo_img = Image(logo_path, width=6*cm, height=None)  # hauteur auto
```

---

## 🎨 Personnalisation Avancée

### **Positionner le Logo Différemment:**

```python
# Logo à gauche avec texte à droite (actuel)
logo_title_data = [
    [logo_img, title_paragraph]
]

# Logo centré seul
logo_title_data = [
    [logo_img]
]
logo_title_table = Table(logo_title_data, colWidths=[17*cm])
```

### **Ajouter un Cadre au Logo:**

```python
logo_title_table.setStyle(TableStyle([
    ('BOX', (0, 0), (0, 0), 2, colors.HexColor('#CC0000')),  # Cadre rouge
    ('ALIGN', (0, 0), (0, 0), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
```

---

## 📝 Exemple Complet: Créer un Logo Simple

Si vous n'avez pas encore de logo, créez un logo texte temporaire:

**Option A: Logo texte stylisé (actuel)**

```python
logo_text = Paragraph(
    '<font size="24" color="#CC0000"><b>MA SOCIÉTÉ</b></font><br/>'
    '<font size="8">EVENT MANAGEMENT</font>',
    styles['Normal']
)
```

**Option B: Utiliser une police spéciale**

```python
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Enregistrer une police personnalisée (si vous en avez une)
pdfmetrics.registerFont(TTFont('MaPolice', 'chemin/vers/police.ttf'))

logo_text = Paragraph(
    '<font face="MaPolice" size="24" color="#CC0000"><b>MA SOCIÉTÉ</b></font>',
    styles['Normal']
)
```

---

## 🔍 Dépannage

### **Problème: "Image not found" ou "No such file"**

**Solution:**

```python
import os
logo_path = os.path.join('static', 'images', 'logo.png')
print(f"Checking for logo at: {os.path.abspath(logo_path)}")
print(f"Logo exists: {os.path.exists(logo_path)}")
```

Vérifiez le chemin complet affiché.

---

### **Problème: "cannot identify image file"**

**Causes:**

- Fichier corrompu
- Format non supporté
- Extension incorrecte

**Solution:**

1. Vérifiez que le fichier est bien une image
2. Convertissez en PNG avec un éditeur d'images
3. Assurez-vous que l'extension correspond au format réel

---

### **Problème: Logo trop grand ou déformé**

**Solution:**

```python
# Conserver le ratio d'aspect
logo_img = Image(logo_path, width=5*cm)  # Hauteur automatique

# OU spécifier les deux avec le bon ratio
logo_img = Image(logo_path, width=6*cm, height=2*cm)
```

---

### **Problème: Logo ne s'affiche pas dans le PDF**

**Vérifications:**

1. Pillow est installé: `pip list | grep -i pillow`
2. Le fichier existe: `ls -la backend/static/images/`
3. Le chemin est correct dans le code
4. Redémarrez le serveur Flask après modification

---

## 🎯 Résumé Rapide

### **Pour Ajouter Votre Logo en 3 Minutes:**

1. **Préparez votre logo** (PNG ou JPG, ~300px large)
2. **Copiez-le dans** `backend/static/images/logo.png`
3. **Installez Pillow:** `pip install Pillow`
4. **Redémarrez** le serveur Flask
5. **Testez** en téléchargeant un bon de commande PDF

✅ **Le logo apparaîtra automatiquement en haut à gauche du PDF!**

---

## 📸 Où Trouver/Créer un Logo?

### **Outils Gratuits:**

- **Canva** - https://www.canva.com (Templates de logos)
- **LogoMakr** - https://logomakr.com
- **FreeLogoDesign** - https://www.freelogodesign.org

### **Conseils Design:**

- Gardez-le simple et lisible
- Utilisez 2-3 couleurs maximum
- Assurez-vous qu'il soit lisible en petit
- Exportez en PNG avec fond transparent
- Résolution: 300 DPI pour impression

---

## 🔗 Ressources Additionnelles

**ReportLab Images Documentation:**
https://www.reportlab.com/docs/reportlab-userguide.pdf (Chapter 7)

**Pillow Documentation:**
https://pillow.readthedocs.io/

**Formats d'image supportés:**

- PNG (recommandé)
- JPEG/JPG
- GIF
- BMP
- TIFF

---

## 💡 Exemple de Configuration Complète

**Fichier: `backend/app.py` (extrait)**

```python
# Au début du fichier
import os
from reportlab.platypus import Image

# Dans la fonction generate_purchase_pdf
logo_paths = [
    os.path.join('static', 'images', 'logo.png'),
    os.path.join('static', 'images', 'logo.jpg'),
    os.path.join('static', 'images', 'company-logo.png')
]

logo_element = None
for path in logo_paths:
    if os.path.exists(path):
        try:
            logo_element = Image(path, width=5*cm, height=2*cm)
            break
        except Exception as e:
            print(f"Error loading logo from {path}: {e}")
            continue

if not logo_element:
    # Fallback: Text logo
    logo_element = Paragraph(
        '<font size="24" color="#CC0000"><b>[VOTRE SOCIÉTÉ]</b></font><br/>'
        '<font size="8">EVENT MANAGEMENT</font>',
        styles['Normal']
    )
```

---

**Besoin d'aide? Contactez le support ou consultez la documentation ReportLab!** 🚀
