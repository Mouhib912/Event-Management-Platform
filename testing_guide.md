'''
# Guide de Test Local - Plateforme de Gestion Événementielle

Ce guide vous explique comment lancer et tester l'application de gestion événementielle en local sur votre machine.

## Prérequis

Avant de commencer, assurez-vous d'avoir les outils suivants installés :

- **Node.js** (version 18 ou supérieure)
- **pnpm** (gestionnaire de paquets)

## Étapes de Lancement

1.  **Décompressez le projet** :
    Extraire tous les fichiers du projet dans un dossier de votre choix.

2.  **Ouvrez un terminal** :
    Naviguez jusqu'au répertoire racine du projet (le dossier `event-management-platform`).

3.  **Installez les dépendances** :
    Exécutez la commande suivante pour installer tous les paquets nécessaires. Cela peut prendre quelques minutes.

    ```bash
    pnpm install
    ```

4.  **Lancez le serveur de développement** :
    Une fois l'installation terminée, lancez l'application avec la commande :

    ```bash
    pnpm run dev
    ```

5.  **Accédez à l'application** :
    Ouvrez votre navigateur web et rendez-vous à l'adresse suivante :

    [http://localhost:5173](http://localhost:5173)

    Si le port 5173 est déjà utilisé, le terminal vous indiquera une autre adresse (par exemple, `http://localhost:5174`).

## Scénarios de Test

Une fois l'application lancée, vous pouvez suivre ces scénarios pour tester les fonctionnalités principales.

### 1. Connexion et Déconnexion

-   **Email** : `test@example.com`
-   **Mot de passe** : `password123`
-   **Rôle** : Sélectionnez "Commercial" dans la liste déroulante.
-   Cliquez sur **"Se connecter"**.
-   Vous devriez être redirigé vers le **Tableau de Bord**.
-   Pour vous déconnecter, cliquez sur l'avatar en haut à droite, puis sur **"Se déconnecter"**.

### 2. Navigation

-   Une fois connecté, utilisez le menu latéral pour naviguer entre les différentes sections :
    -   Tableau de Bord
    -   Statistiques
    -   Fournisseurs
    -   Catégories
    -   Produits
    -   Créer un Stand
    -   Catalogue des Stands

### 3. Gestion des Fournisseurs, Catégories et Produits

-   Naviguez vers les sections **Fournisseurs**, **Catégories** et **Produits**.
-   Utilisez les boutons **"Ajouter"** pour créer de nouvelles entrées.
-   Testez les fonctionnalités de **modification** et de **suppression** sur les fiches existantes.
-   Utilisez la barre de recherche et les filtres pour trier les données.

### 4. Création d'un Stand

-   Allez dans la section **"Créer un Stand"**.
-   Donnez un nom à votre projet (ex: "Mon Premier Stand").
-   Ajoutez des produits au stand en cliquant sur le bouton **"Ajouter"** de chaque produit.
-   Modifiez la **quantité** et le **nombre de jours** (si applicable) dans le tableau du stand.
-   Vérifiez que le **total général** se met à jour automatiquement.
-   Cliquez sur **"Sauvegarder"** pour enregistrer votre stand.
-   Cliquez sur **"Excel"** pour exporter le tableau du stand au format `.xlsx`.

### 5. Consultation du Catalogue

-   Naviguez vers le **"Catalogue des Stands"**.
-   Retrouvez le stand que vous venez de sauvegarder.
-   Cliquez sur **"Voir"** pour afficher les détails du stand.
-   Cliquez sur l'icône de téléchargement pour exporter le stand depuis le catalogue.

## Notes

-   Les données sont stockées localement dans le `localStorage` de votre navigateur. Elles persisteront tant que vous ne videz pas le cache de votre navigateur pour ce site.
-   Il s'agit d'une version de démonstration. Certaines fonctionnalités (comme la validation par département) sont simulées.
'''
