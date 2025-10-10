# ✅ Mise à Jour: Bon de Commande Indépendant des Stands

## 🔄 Changements Effectués

### Concept Clé:

Le **Bon de Commande** est maintenant **complètement indépendant des stands**. Vous commandez directement des produits auprès de fournisseurs, sans avoir besoin de créer un stand d'abord.

---

## 📦 BON DE COMMANDE (Mis à Jour)

### Nouveau Workflow:

```
Sélectionner Fournisseur → Ajouter Produits → Créer Bon de Commande → Générer PDF
```

### Caractéristiques:

- ✅ Sélection directe du fournisseur
- ✅ Ajout manuel de produits
- ✅ Quantité et nombre de jours configurables
- ✅ Stand optionnel (peut être lié ou non)
- ✅ Notes optionnelles pour le bon de commande

---

## 🛠️ Modifications Techniques

### 1. Backend (app.py)

#### Modèle Purchase:

```python
class Purchase(db.Model):
    stand_id = nullable=True  # ✅ OPTIONNEL maintenant
    notes = db.Column(db.Text, nullable=True)  # ✅ NOUVEAU champ
```

#### Endpoint POST /api/purchases:

- `stand_id` est maintenant optionnel
- `notes` ajouté pour des remarques

#### PDF Generation:

- Le stand n'apparaît dans le PDF que s'il existe
- Format: `N°: BC-2025-001 | DATE: 10/10/2025 | STAND: xxx (si présent) | ÉCHÉANCE`

### 2. Frontend (Achat.jsx) - COMPLÈTEMENT RÉÉCRIT

#### Interface de Création Simplifiée:

1. **Sélectionner Fournisseur** (obligatoire)
2. **Ajouter Produits** du fournisseur
   - Tableau interactif
   - Modifier quantité
   - Modifier jours (si applicable)
   - Supprimer un produit
3. **Notes** (optionnel)
4. **Créer**

#### Fonctionnalités:

```javascript
-getSupplierProducts() - // Filtre produits par fournisseur
  addProductToOrder() - // Ajoute un produit à la commande
  updateItemQuantity() - // Modifie la quantité
  updateItemDays() - // Modifie les jours (si Par Jour)
  removeItem() - // Supprime un produit
  calculateTotal(); // Calcule le total automatiquement
```

---

## 💡 Utilisation

### Créer un Bon de Commande:

1. **Module Achat** → Cliquer "Nouveau Bon de Commande"

2. **Sélectionner un Fournisseur**

   - Liste de tous vos fournisseurs

3. **Ajouter des Produits**
   - Sélectionnez parmi les produits du fournisseur
   - Le produit est ajouté au tableau
4. **Configurer chaque produit**:

   - **Quantité**: Nombre d'unités
   - **Jours**: Si pricing "Par Jour" (sinon désactivé)
   - **Supprimer**: Retirer du bon

5. **Ajouter des Notes** (optionnel)

   - Ex: "Urgent - Livraison avant le 15/10"
   - Ex: "Commande pour événement XYZ"

6. **Créer le Bon de Commande**

7. **Télécharger le PDF**

---

## 📄 Exemple de Bon de Commande

### Sans Stand:

```
┌─────────────────────────────────────┐
│ [LOGO]     BON DE COMMANDE          │
├─────────────────────────────────────┤
│ N°: BC-2025-001                     │
│ DATE: 10/10/2025                    │
│ ÉCHÉANCE: À RÉCEPTION               │
├─────────────────────────────────────┤
│ ÉMETTEUR: Event Management          │
│ DESTINATAIRE: Fournisseur ABC       │
├─────────────────────────────────────┤
│ PRODUITS:                           │
│ - Tables pliantes    10  50  500    │
│ - Chaises           20  25  500     │
├─────────────────────────────────────┤
│ TOTAL HT: 1000.00 TND               │
│ TVA (19%): 190.00 TND               │
│ TOTAL TTC: 1190.00 TND              │
└─────────────────────────────────────┘
```

### Avec Stand (référence optionnelle):

```
┌─────────────────────────────────────┐
│ [LOGO]     BON DE COMMANDE          │
├─────────────────────────────────────┤
│ N°: BC-2025-002                     │
│ DATE: 10/10/2025                    │
│ STAND: Salon Tech 2025              │ ← Affiché si présent
│ ÉCHÉANCE: À RÉCEPTION               │
├─────────────────────────────────────┤
...
```

---

## 🔄 Différences Avant/Après

| Aspect      | Avant                        | Après                              |
| ----------- | ---------------------------- | ---------------------------------- |
| Stand       | **Obligatoire**              | **Optionnel**                      |
| Produits    | Depuis le stand              | **Sélection directe**              |
| Workflow    | Stand → Validation → Achat   | **Fournisseur → Produits → Achat** |
| Flexibilité | Limité aux produits du stand | **Tous produits du fournisseur**   |
| Notes       | Non                          | **Oui**                            |

---

## 💰 FACTURE CLIENT (Inchangée)

La facture client reste liée aux stands car elle facture une prestation complète:

```
Stand Approuvé → Module Factures → Créer Facture Client
```

---

## 🎯 Cas d'Usage Typiques

### Scénario 1: Achat Direct (NOUVEAU)

```
Besoin de matériel → Module Achat → Sélectionner Fournisseur
→ Ajouter Produits → Créer Bon → Envoyer au Fournisseur
```

**Exemple**: Commander 50 chaises sans avoir de stand spécifique

### Scénario 2: Achat pour un Événement

```
Stand Créé → Module Achat → Sélectionner Fournisseur
→ Ajouter Produits → (Optionnel: mentionner le stand) → Créer Bon
```

**Exemple**: Commander pour le "Salon Tech 2025" en référençant le stand

### Scénario 3: Facturation Client (Inchangé)

```
Stand Approuvé → Module Factures → Créer Facture
→ Remplir infos client → Générer PDF → Envoyer au client
```

**Exemple**: Facturer "Entreprise XYZ" pour le stand complet

---

## 🗄️ Base de Données

### Table `purchase` (Mise à Jour):

```sql
CREATE TABLE purchase (
    id INTEGER PRIMARY KEY,
    stand_id INTEGER NULL,  -- ✅ Nullable
    purchase_number VARCHAR(20) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    total_amount FLOAT NOT NULL,
    notes TEXT NULL,  -- ✅ NOUVEAU
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (stand_id) REFERENCES stand(id),
    FOREIGN KEY (supplier_id) REFERENCES supplier(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);
```

---

## ✅ Checklist de Mise à Jour

- [x] Modèle Purchase mis à jour (stand_id nullable, notes)
- [x] Endpoint POST /api/purchases mis à jour
- [x] PDF generation mis à jour (stand optionnel)
- [x] Achat.jsx complètement réécrit
- [x] Interface utilisateur simplifiée
- [x] Support pour ajout/modification/suppression de produits
- [ ] Mettre à jour la base de données
- [ ] Redémarrer Flask
- [ ] Tester la création d'un bon de commande

---

## 🚀 Déploiement

### 1. Mettre à Jour la Base de Données:

```powershell
cd backend
python update_db.py
```

### 2. Redémarrer Flask:

```powershell
python app.py
```

### 3. Tester:

- Aller dans Module Achat
- Créer un bon de commande sans stand
- Vérifier que tout fonctionne

---

## 🆘 Dépannage

### Erreur: "stand_id cannot be null"

→ La base de données n'a pas été mise à jour
→ Exécuter `python backend/update_db.py`

### Les produits ne s'affichent pas

→ Vérifier que le fournisseur a des produits associés
→ Aller dans "Produits" et assigner des produits au fournisseur

### Le fichier Achat.jsx a été supprimé

→ Normal, j'ai complètement réécrit le composant
→ Le nouveau fichier est créé automatiquement

---

## 📊 Résumé

**Bon de Commande** = Acheter des produits d'un fournisseur (avec ou sans stand)
**Facture Client** = Vendre une prestation complète à un client (toujours avec stand)

Les deux sont maintenant **indépendants** et servent des objectifs différents!

---

Date de mise à jour: 10 Octobre 2025
