# ✅ Système de Facturation Complet - Résumé des Changements

## 🎯 Ce qui a été implémenté

Vous avez maintenant **2 systèmes de PDF distincts**:

### 1. 📦 BON DE COMMANDE (Existant - Amélioré)

- **Vous = CLIENT** → Vous achetez des produits auprès de fournisseurs
- Module: **Achat** (`/achat`)
- Format PDF sans couleurs, compact (1 page)
- Nom fichier: `bon_commande_{id}.pdf`

### 2. 💰 FACTURE CLIENT (NOUVEAU)

- **Vous = FOURNISSEUR** → Vous vendez un stand/service à un client
- Module: **Factures Clients** (`/invoices`)
- Format PDF sans couleurs, compact (1 page)
- Nom fichier: `facture_client_{id}.pdf`

---

## 📝 Fichiers Modifiés

### Backend:

1. **app.py**

   - Ajout du modèle `Invoice` avec tous les champs client
   - Ajout endpoints:
     - `GET /api/invoices` - Liste des factures
     - `POST /api/invoices` - Créer facture
     - `PUT /api/invoices/{id}` - Mettre à jour statut
     - `GET /api/invoices/{id}/pdf` - Télécharger PDF
   - Ajout fonction `generate_invoice_pdf()` - PDF sans couleurs
   - PDF Bon de Commande mis à jour (sans couleurs, compact)

2. **update_db.py** (NOUVEAU)

   - Script pour créer la table Invoice

3. **PDF_SYSTEM_GUIDE.md** (NOUVEAU)
   - Documentation complète du système de facturation
   - Explications Bon de Commande vs Facture
   - Workflows et cas d'usage

### Frontend:

1. **src/components/Invoices.jsx** (NOUVEAU)

   - Interface complète de gestion des factures
   - Formulaire de création avec infos client
   - Liste des factures avec filtres
   - Statuts: En attente, Payée, Annulée
   - Téléchargement PDF
   - Statistiques (total, payé, en attente)

2. **src/services/api.js**

   - Ajout `getInvoices()`
   - Ajout `createInvoice()`
   - Ajout `updateInvoiceStatus()`
   - Ajout `downloadInvoicePDF()`
   - Renommage PDF achat: `bon_commande_{id}.pdf`

3. **src/App.jsx**

   - Ajout route `/invoices`
   - Import du composant Invoices

4. **src/components/Layout.jsx**

   - Ajout menu "Factures Clients" avec icône FileText
   - Import FileText depuis lucide-react
   - Nettoyage imports dupliqués

5. **src/contexts/AuthContext.jsx**
   - Ajout permission 'invoices' pour: Propriétaire, Commercial, Finance

---

## 🗄️ Structure Base de Données

### Nouvelle Table: `invoice`

```sql
- id (INTEGER, PRIMARY KEY)
- invoice_number (STRING, UNIQUE)     # INV-2025-0001
- stand_id (INTEGER, FOREIGN KEY)
- client_name (STRING)                # Obligatoire
- client_email (STRING)
- client_phone (STRING)
- client_address (TEXT)
- total_ht (FLOAT)
- tva_amount (FLOAT)                  # 19%
- total_ttc (FLOAT)
- status (STRING)                     # pending, paid, cancelled
- created_at (DATETIME)
- created_by (INTEGER, FOREIGN KEY)
```

---

## 🚀 Comment Utiliser

### ÉTAPE 1: Mettre à jour la base de données

```powershell
cd C:\Users\mouhib\Downloads\event-management-platform\backend
python update_db.py
```

### ÉTAPE 2: Redémarrer Flask (si en cours d'exécution)

```powershell
# Arrêter avec Ctrl+C, puis:
python app.py
```

### ÉTAPE 3: Tester la création de facture

1. Connectez-vous à l'application
2. Assurez-vous d'avoir un stand avec status `approved`
3. Allez dans **"Factures Clients"** (menu de gauche)
4. Cliquez **"Créer une Facture"**
5. Remplissez:
   - Sélectionnez un stand approuvé
   - Nom du client (obligatoire)
   - Email, téléphone, adresse (optionnel)
   - Le montant HT est auto-calculé
6. Cliquez **"Créer la Facture"**
7. Téléchargez le PDF

---

## 🎨 Format PDF (Sans Couleurs)

Les deux PDFs ont maintenant:

- ✅ Pas de couleurs (noir, blanc, gris)
- ✅ Marges réduites (1cm)
- ✅ Espacement réduit
- ✅ Polices plus petites
- ✅ Tient sur 1 page
- ✅ Support logo (backend/static/logo.png)

### Différences PDF:

**Bon de Commande:**

- Titre: "BON DE COMMANDE"
- Section: ÉMETTEUR (vous) / DESTINATAIRE (fournisseur)
- Numéro: BC-2025-XXX

**Facture Client:**

- Titre: "FACTURE"
- Section: ÉMETTEUR (vous) / CLIENT (client final)
- Numéro: INV-2025-XXXX
- Mention stand incluse

---

## 📊 Fonctionnalités de la Page Factures

### Statistiques (en haut):

- Total Factures
- Chiffre d'affaires Total
- Montant Payé (factures avec status "paid")
- Montant En Attente (factures avec status "pending")

### Tableau:

- N° Facture
- Date de création
- Nom du stand
- Nom + email du client
- Total HT / TVA / Total TTC
- Statut avec badge coloré
- Actions:
  - Télécharger PDF
  - Marquer comme payée (si en attente)
  - Annuler (si en attente)

### Formulaire de création:

- Sélection du stand (auto-calcule le montant)
- Informations client complètes
- Aperçu du total TTC (HT × 1.19)

---

## 🔐 Permissions

### Qui peut accéder aux Factures Clients?

- ✅ Propriétaire (accès complet)
- ✅ Commercial (peut créer et gérer)
- ✅ Finance (peut consulter et marquer payé)
- ❌ Logistique (pas d'accès)
- ❌ Visiteur (pas d'accès)

---

## 🔄 Workflow Complet

```
1. Stand Créé (Stand Simulator)
   ↓
2. Validation Logistique
   ↓
3. Validation Finance
   ↓
4. Stand Approuvé ✓
   ↓
5a. Créer BON DE COMMANDE      5b. Créer FACTURE CLIENT
    (Module Achat)                  (Module Factures)
    → Acheter fournitures          → Vendre au client
    → Vous PAYEZ                   → Vous RECEVEZ
```

---

## 🧪 Tests à Effectuer

- [ ] Créer une facture pour un stand approuvé
- [ ] Vérifier que le PDF se télécharge
- [ ] Vérifier les informations du client dans le PDF
- [ ] Vérifier les calculs HT/TVA/TTC
- [ ] Marquer une facture comme "Payée"
- [ ] Annuler une facture
- [ ] Vérifier que les statistiques se mettent à jour
- [ ] Tester avec un utilisateur Finance
- [ ] Tester avec un utilisateur Commercial

---

## 📈 Prochaines Améliorations Possibles

1. **Export Excel** des factures (comme les statistiques)
2. **Envoi par email** automatique des factures
3. **Historique des paiements** pour chaque facture
4. **Rappels automatiques** pour factures impayées
5. **Multi-devise** (EUR, USD, TND)
6. **Remises** et codes promo
7. **Factures récurrentes** pour clients réguliers
8. **Intégration comptable** (export vers logiciel comptable)

---

## 📚 Documentation Complète

Voir **PDF_SYSTEM_GUIDE.md** pour:

- Explications détaillées Bon de Commande vs Facture
- Cas d'usage complets
- Structure du code
- Questions fréquentes

---

## ✅ Checklist de Déploiement

- [x] Code backend écrit
- [x] Code frontend écrit
- [x] Documentation créée
- [ ] Base de données mise à jour (`update_db.py`)
- [ ] Serveur Flask redémarré
- [ ] Tests effectués
- [ ] Logo ajouté (optionnel, voir QUICK_LOGO_SETUP.md)

---

## 🆘 En Cas de Problème

### Erreur: "Invoice table not found"

→ Exécuter: `python backend/update_db.py`

### Erreur: "No approved stands available"

→ Aller dans Stand Catalog et valider un stand (logistique + finance)

### PDF ne se télécharge pas

→ Vérifier les logs Flask dans le terminal
→ Vérifier que le stand a des items

### Menu "Factures Clients" n'apparaît pas

→ Vérifier votre rôle (doit être Propriétaire, Commercial, ou Finance)

---

**Système prêt à l'emploi! 🎉**

Date de création: 10 Octobre 2025
