# 📋 Guide: Comment Approuver un Stand pour l'Achat

## 🎯 Vue d'ensemble

Pour créer un **Bon d'Achat** (Purchase Order), vous devez d'abord avoir un stand **approuvé**.
Les stands passent par un workflow de validation en 3 étapes avant d'être utilisables dans le module Achat.

---

## 📊 Workflow de Validation d'un Stand

```
┌─────────────┐    Validation     ┌──────────────────────┐    Validation    ┌────────────┐
│   📝 Draft   │ ──Logistique──▶  │ 📦 Validated Logistics│ ────Finance───▶ │ ✅ Approved │
│  Brouillon   │                  │                      │                 │            │
└─────────────┘                  └──────────────────────┘                 └────────────┘
                                                                                  │
                                                                                  │
                                                                                  ▼
                                                                          Utilisable dans
                                                                          Module Achat
```

### Statuts des Stands

| Statut                  | Badge                | Description                                     | Peut créer Bon d'Achat? |
| ----------------------- | -------------------- | ----------------------------------------------- | ----------------------- |
| **draft**               | 📝 Brouillon         | Stand nouvellement créé                         | ❌ Non                  |
| **validated_logistics** | 📦 Validé Logistique | Approuvé par l'équipe logistique                | ❌ Non                  |
| **validated_finance**   | 💰 Validé Finance    | Approuvé par l'équipe finance (sans logistique) | ❌ Non                  |
| **approved**            | ✅ Approuvé          | Complètement approuvé (Logistique + Finance)    | ✅ **OUI**              |

---

## 🔐 Permissions Requises

### Pour Valider Logistique:

- **Rôle Logistique** (`Logistique`)
- **OU Propriétaire** (`Propriétaire`) - peut tout faire

### Pour Valider Finance:

- **Rôle Finance** (`Finance`)
- **OU Propriétaire** (`Propriétaire`)

### Votre Rôle Actuel:

Connecté comme: **owner@eventmanagement.com**
Rôle: **Propriétaire** → Vous pouvez effectuer **TOUTES** les validations! 🎉

---

## 📝 Instructions Étape par Étape

### Étape 1️⃣: Créer un Stand (si pas déjà fait)

1. Allez dans **"Simulateur de Stand"**
2. Sélectionnez des produits et ajoutez-les au stand
3. Donnez un nom au stand
4. Cliquez sur **"Sauvegarder le Stand"**
5. Le stand est créé avec le statut **📝 Brouillon** (`draft`)

**✅ Un stand de test a déjà été créé pour vous: "Stand Test Demo"**

---

### Étape 2️⃣: Valider le Stand (Logistique)

1. Allez dans **"Catalogue des Stands"**
2. Trouvez votre stand (statut: 📝 Brouillon)
3. Cliquez sur le bouton **"Valider Logistique"** (bouton bleu avec icône ✓)
4. Le stand passe au statut **📦 Validé Logistique** (`validated_logistics`)

**Critères de validation logistique:**

- Vérifier que tous les produits sont disponibles
- Confirmer les quantités demandées
- Valider les délais de livraison

---

### Étape 3️⃣: Valider le Stand (Finance)

1. Dans **"Catalogue des Stands"**
2. Trouvez le stand (statut: 📦 Validé Logistique)
3. Cliquez sur le bouton **"Valider Finance"** (bouton vert avec icône ✓✓)
4. Le stand passe au statut **✅ Approuvé** (`approved`)

**Critères de validation finance:**

- Vérifier le budget disponible
- Confirmer les prix unitaires
- Valider le total du stand

---

### Étape 4️⃣: Créer un Bon d'Achat

Maintenant que le stand est approuvé, vous pouvez créer des bons d'achat:

1. Allez dans **"Module Achat"**
2. Cliquez sur **"Nouveau Bon de Commande"**
3. **Sélectionnez le stand approuvé** dans le dropdown (maintenant visible! 🎉)
4. Sélectionnez un **fournisseur**
   - Seuls les fournisseurs ayant des produits dans ce stand apparaîtront
   - Le système filtre automatiquement les produits par fournisseur
5. Vérifiez les produits et le total
6. Cliquez sur **"Créer le Bon de Commande"**

Le bon d'achat est créé et peut être téléchargé en PDF!

---

## 🚀 Test Rapide (Pour Vous)

Un stand de test a été créé. Suivez ces étapes:

### ✅ ÉTAPE 1: Validation Logistique

```
1. Rafraîchir le navigateur
2. Aller dans "Catalogue des Stands"
3. Trouver "Stand Test Demo" (📝 Brouillon)
4. Cliquer sur "Valider Logistique"
5. Vérifier que le statut devient 📦 Validé Logistique
```

### ✅ ÉTAPE 2: Validation Finance

```
1. Cliquer sur "Valider Finance"
2. Vérifier que le statut devient ✅ Approuvé
```

### ✅ ÉTAPE 3: Créer Bon d'Achat

```
1. Aller dans "Module Achat"
2. Cliquer "Nouveau Bon de Commande"
3. Le stand "Stand Test Demo" devrait maintenant apparaître dans le dropdown!
4. Sélectionner le stand
5. Choisir un fournisseur
6. Créer le bon de commande
```

---

## 🎨 Boutons de Validation dans l'Interface

Les boutons de validation apparaissent automatiquement dans les cartes de stand selon:

- **Votre rôle**: Propriétaire voit tous les boutons
- **Le statut du stand**: Seules les validations nécessaires sont affichées
- **Stand approuvé**: Aucun bouton de validation (déjà fait!)

### Exemple visuel:

```
┌─────────────────────────────────────────┐
│  Stand Test Demo        📝 Brouillon    │
├─────────────────────────────────────────┤
│  👤 Créé par System Owner               │
│  📦 3 produits    💰 4410.00 TND        │
│  📅 Créé le 09/10/2025                  │
├─────────────────────────────────────────┤
│  [👁 Voir]  [⬇ Export]                  │
├─────────────────────────────────────────┤
│  [✓ Valider Logistique]                 │  ← Bouton bleu
│  [✓✓ Valider Finance]                   │  ← Bouton vert
└─────────────────────────────────────────┘
```

---

## ❓ FAQ

### Q: Je ne vois pas les boutons de validation?

**R:** Vérifiez que:

- Vous êtes connecté avec le bon rôle (Propriétaire peut tout voir)
- Le stand n'est pas déjà approuvé
- Vous avez rafraîchi la page après la mise à jour

### Q: Le dropdown "Stand" est vide dans Module Achat?

**R:** Causes possibles:

1. **Aucun stand créé** → Créez-en un dans "Simulateur de Stand"
2. **Aucun stand approuvé** → Validez un stand existant (Logistique + Finance)
3. **Cache navigateur** → Rafraîchissez la page (F5 ou Ctrl+R)

### Q: Puis-je sauter la validation logistique?

**R:** Techniquement oui si vous êtes Finance/Propriétaire, vous pouvez valider la finance directement sur un stand en brouillon. Mais le workflow recommandé est: Logistique → Finance

### Q: Que se passe-t-il si je valide Finance avant Logistique?

**R:** Le stand passe au statut `validated_finance`. Il faudra ensuite une validation logistique pour qu'il devienne `approved`.

---

## 🔧 Dépannage

### Erreur: "Aucun stand approuvé"

```bash
# Vérifier les stands dans la base de données:
cd backend
python check_db.py

# Créer un stand de test:
python create_test_stand.py
```

### Console du navigateur

Ouvrir les outils développeur (F12) et vérifier les logs:

```
✅ Loaded stands: 3
   - Approved stands: 1
```

Si "Approved stands: 0", validez vos stands!

---

## 📊 Récapitulatif

| Action             | Où                   | Rôle Requis              | Résultat                |
| ------------------ | -------------------- | ------------------------ | ----------------------- |
| Créer Stand        | Simulateur de Stand  | Commercial, Propriétaire | Stand en Brouillon      |
| Valider Logistique | Catalogue des Stands | Logistique, Propriétaire | Stand Validé Logistique |
| Valider Finance    | Catalogue des Stands | Finance, Propriétaire    | Stand **Approuvé** ✅   |
| Créer Bon d'Achat  | Module Achat         | Tous                     | Bon de commande créé    |

---

**🎉 Vous êtes maintenant prêt à approuver des stands et créer des bons d'achat!**

En cas de problème, consultez les logs de la console du navigateur (F12) pour plus de détails.
