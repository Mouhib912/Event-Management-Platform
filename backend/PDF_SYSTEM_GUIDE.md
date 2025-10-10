# 📄 Documentation: Bon de Commande vs Facture Client

## Overview

Le système génère maintenant **2 types de documents PDF** différents pour deux workflows distincts:

---

## 1. 📦 BON DE COMMANDE (Purchase Order)

**Vous êtes le CLIENT** qui achète des produits/services auprès de fournisseurs

### Workflow:

```
Stand Approuvé → Module Achat → Créer Bon de Commande → PDF Généré
```

### Détails:

- **Module:** Achat (`/achat`)
- **Document:** Bon de Commande
- **Vous êtes:** CLIENT (acheteur)
- **Autre partie:** FOURNISSEUR (vendeur)
- **But:** Commander des produits pour réaliser un stand
- **Endpoint API:** `POST /api/purchases`
- **PDF Endpoint:** `GET /api/purchases/{id}/pdf`
- **Nom fichier:** `bon_commande_{purchase_id}.pdf`

### Processus:

1. Un stand est validé par Logistique et Finance → Status: `approved`
2. Aller dans **Module Achat**
3. Sélectionner le stand approuvé
4. Sélectionner le fournisseur
5. Cliquer "Créer Bon d'Achat"
6. Télécharger le PDF du bon de commande

### Structure PDF:

```
┌─────────────────────────────────────┐
│ [LOGO]     BON DE COMMANDE          │
├─────────────────────────────────────┤
│ N°: BC-2025-001 | DATE: 10/10/2025  │
├─────────────────────────────────────┤
│ ÉMETTEUR:          DESTINATAIRE:    │
│ Event Management   [Fournisseur]    │
│ (Votre société)                     │
├─────────────────────────────────────┤
│ ARTICLES                            │
│ - Produit 1      Qté   Prix   Total│
│ - Produit 2      ...   ...    ...  │
├─────────────────────────────────────┤
│ TOTAL HT:  1000.00 TND             │
│ TVA (19%):  190.00 TND             │
│ TOTAL TTC: 1190.00 TND             │
└─────────────────────────────────────┘
```

---

## 2. 💰 FACTURE CLIENT (Client Invoice)

**Vous êtes le FOURNISSEUR** qui vend un stand/service à un client

### Workflow:

```
Stand Approuvé → Module Factures → Créer Facture → PDF Généré
```

### Détails:

- **Module:** Factures Clients (`/invoices`)
- **Document:** Facture
- **Vous êtes:** FOURNISSEUR (vendeur)
- **Autre partie:** CLIENT (acheteur)
- **But:** Facturer un client pour un stand réalisé
- **Endpoint API:** `POST /api/invoices`
- **PDF Endpoint:** `GET /api/invoices/{id}/pdf`
- **Nom fichier:** `facture_client_{invoice_id}.pdf`

### Processus:

1. Un stand est validé → Status: `approved`
2. Aller dans **Factures Clients**
3. Cliquer "Créer une Facture"
4. Sélectionner le stand approuvé
5. Remplir les informations du client:
   - Nom du client **(obligatoire)**
   - Email
   - Téléphone
   - Adresse
6. Le montant HT est automatiquement calculé depuis le stand
7. Cliquer "Créer la Facture"
8. Télécharger le PDF de la facture

### Structure PDF:

```
┌─────────────────────────────────────┐
│ [LOGO]           FACTURE            │
├─────────────────────────────────────┤
│ N°: INV-2025-0001 | DATE: 10/10/2025│
│ STAND: Mon Stand Événement          │
├─────────────────────────────────────┤
│ ÉMETTEUR:          CLIENT:          │
│ Event Management   [Client Final]   │
│ (Votre société)                     │
├─────────────────────────────────────┤
│ PRESTATIONS                         │
│ - Service 1      Qté   Prix   Total│
│ - Service 2      ...   ...    ...  │
├─────────────────────────────────────┤
│ TOTAL HT:  5000.00 TND             │
│ TVA (19%):  950.00 TND             │
│ TOTAL TTC: 5950.00 TND             │
├─────────────────────────────────────┤
│ Modalités de paiement              │
│ Payable sous 30 jours              │
└─────────────────────────────────────┘
```

---

## 📊 Comparaison Rapide

| Critère           | BON DE COMMANDE    | FACTURE CLIENT        |
| ----------------- | ------------------ | --------------------- |
| **Vous êtes**     | Client (Acheteur)  | Fournisseur (Vendeur) |
| **Destinataire**  | Fournisseur        | Client final          |
| **Module**        | Achat              | Factures Clients      |
| **Route**         | `/achat`           | `/invoices`           |
| **Numérotation**  | BC-YYYY-XXX        | INV-YYYY-XXXX         |
| **Objectif**      | Commander produits | Facturer services     |
| **Flux d'argent** | Vous PAYEZ         | Vous RECEVEZ          |

---

## 🔑 Différences Clés dans le Code

### Base de données:

```python
# BON DE COMMANDE
class Purchase(db.Model):
    purchase_number = db.Column(db.String(20))  # BC-2025-001
    supplier_id = db.Column(db.Integer)         # Fournisseur

class PurchaseItem(db.Model):
    purchase_id = db.Column(db.Integer)
    product_id = db.Column(db.Integer)

# FACTURE CLIENT
class Invoice(db.Model):
    invoice_number = db.Column(db.String(20))   # INV-2025-0001
    client_name = db.Column(db.String(100))     # Client final
    client_email = db.Column(db.String(120))
    client_phone = db.Column(db.String(20))
    client_address = db.Column(db.Text)
```

### Endpoints API:

```python
# BON DE COMMANDE
POST   /api/purchases              # Créer bon de commande
GET    /api/purchases              # Lister bons de commande
GET    /api/purchases/{id}/pdf     # Télécharger PDF

# FACTURE CLIENT
POST   /api/invoices               # Créer facture
GET    /api/invoices               # Lister factures
PUT    /api/invoices/{id}          # Mettre à jour statut
GET    /api/invoices/{id}/pdf      # Télécharger PDF
```

### Composants React:

```javascript
// BON DE COMMANDE
<Achat />                          // src/components/Achat.jsx
apiService.createPurchase()
apiService.downloadPurchasePDF()

// FACTURE CLIENT
<Invoices />                       // src/components/Invoices.jsx
apiService.createInvoice()
apiService.downloadInvoicePDF()
```

---

## 🎯 Cas d'Usage Typiques

### Scénario 1: Organisation d'un événement

1. **Création du stand** (Stand Simulator)
   - Créer un stand "Salon Tech 2025"
   - Ajouter tables, chaises, écrans
2. **Validation interne** (Stand Catalog)

   - Logistique valide la faisabilité
   - Finance valide le budget
   - Stand devient `approved`

3. **Achat des fournitures** (Module Achat)
   - Créer BON DE COMMANDE pour Fournisseur A
   - Commander tables et chaises
   - → Vous PAYEZ le fournisseur
4. **Facturation du client** (Module Factures)
   - Créer FACTURE CLIENT pour "Entreprise XYZ"
   - Facturer la prestation complète
   - → Le client vous PAIE

### Résultat:

- **Dépense:** 1190 TND (BON DE COMMANDE)
- **Revenu:** 5950 TND (FACTURE CLIENT)
- **Marge:** 4760 TND

---

## 🚀 Comment Utiliser

### Pour acheter (Bon de Commande):

```bash
1. Aller dans "Module Achat" (menu de gauche)
2. Cliquer "Créer Bon d'Achat"
3. Sélectionner stand + fournisseur
4. Télécharger PDF → Envoyer au fournisseur
```

### Pour vendre (Facture Client):

```bash
1. Aller dans "Factures Clients" (menu de gauche)
2. Cliquer "Créer une Facture"
3. Sélectionner stand + remplir infos client
4. Télécharger PDF → Envoyer au client
```

---

## 📈 Statistiques

Les **Statistiques** (`/statistics`) montrent maintenant:

- **Dépenses totales:** Somme des bons de commande
- **Revenus totaux:** Somme des factures clients
- **Marge bénéficiaire:** Revenus - Dépenses
- **Dépenses par fournisseur**
- **Revenus par stand**

---

## ✅ Checklist de Mise en Place

- [x] Modèle `Invoice` créé
- [x] Endpoints API `/api/invoices` créés
- [x] Fonction `generate_invoice_pdf()` créée
- [x] Composant React `Invoices.jsx` créé
- [x] Route `/invoices` ajoutée
- [x] Menu "Factures Clients" ajouté
- [x] Permissions configurées (Propriétaire, Commercial, Finance)
- [ ] Base de données mise à jour (exécuter `update_db.py`)
- [ ] Tester création de facture
- [ ] Tester téléchargement PDF

---

## 🔧 Prochaines Étapes

1. **Mettre à jour la base de données:**

   ```bash
   cd backend
   python update_db.py
   ```

2. **Redémarrer le serveur Flask:**

   ```bash
   python app.py
   ```

3. **Tester le système:**

   - Créer une facture pour un stand approuvé
   - Télécharger le PDF
   - Vérifier les informations client

4. **Optionnel - Améliorer:**
   - Ajouter numéro de TVA
   - Ajouter conditions générales de vente
   - Ajouter signature électronique
   - Export Excel des factures

---

## 💡 Questions Fréquentes

**Q: Quelle est la différence entre les deux PDF?**
A: Le Bon de Commande est pour ACHETER (vous payez), la Facture est pour VENDRE (vous recevez de l'argent).

**Q: Peut-on créer plusieurs factures pour un même stand?**
A: Oui, mais en général, un stand = une facture client.

**Q: Le stand doit-il être approuvé?**
A: Oui, pour les deux documents, le stand doit avoir le statut `approved`.

**Q: Qui a accès au module Factures?**
A: Propriétaire, Commercial, et Finance.

**Q: Comment suivre les paiements?**
A: Dans le module Factures, vous pouvez marquer une facture comme "Payée" ou "Annulée".

---

Dernière mise à jour: 10 Octobre 2025
