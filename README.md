# Les Gardiens du Jeu - Gestion d'Association

Application web statique complète pour la gestion d'une association de jeux de société : gestion de stock, ludothèque, événements, adhésions et plus.

## 🚀 Fonctionnalités

### Interface Administrateur
- **Gestion des produits** : Ajouter, modifier et supprimer des produits (boissons, snacks, etc.)
- **Gestion des stocks** : Gérer les prix, stocks et réapprovisionnements
- **Gestion des membres** : Voir la liste des membres, leurs ardoises et statuts
- **Ludothèque** : Gérer les jeux de l'association avec recherche et filtres par durée (≤10, ≤30, ≤60, ≤120, ≤240 min)
- **Calendrier** : Créer et gérer les événements de jeux
- **Adhésions** : Gérer les adhésions annuelles avec tarification automatique selon la période
- **Soumissions** : Valider ou refuser les jeux et événements proposés par les membres
- **Export** : Exporter les données (transactions, adhésions, réapprovisionnements) en CSV
- **Statistiques** : Tableau de bord avec vue d'ensemble de l'activité
- **Synchronisation automatique** avec GitHub

### Interface Membre
- **S'enregistrer et se connecter** avec pseudo (email optionnel)
- **Commander** : Sélectionner des produits à consommer
- **Modes de paiement** : Espèces, PayPal, ou ardoise
- **Historique** : Consulter l'historique des transactions et l'ardoise
- **Payer** : Payer les transactions en attente
- **Ludothèque** : Consulter les jeux disponibles avec recherche et filtres
- **Calendrier** : Voir les événements à venir et s'inscrire
  - **Inscription standard** : Participant prioritaire
  - **Liste de réserve** : S'inscrire en réserve volontairement
  - **⏰ Promotion automatique** : Les réservistes sont automatiquement promus en participants **24h avant l'événement** s'il reste des places disponibles (dans l'ordre d'inscription)
- **Soumissions** : Proposer des jeux ou événements pour validation
- **Profil** : Voir son statut d'adhésion

## 📦 Technologies

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Stockage**: localStorage + GitHub (fichier JSON)
- **Hébergement**: Netlify
- **Backend**: Netlify Functions
- **API**: GitHub API pour la synchronisation des données

## 🔧 Installation et déploiement

### 1. Prérequis

- Un compte GitHub
- Un compte Netlify
- Un Personal Access Token GitHub

### 2. Créer un Personal Access Token GitHub

1. Allez sur [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Cliquez sur "Generate new token (classic)"
3. Donnez un nom au token (ex: "GDJ-Netlify")
4. Sélectionnez la portée **`repo`** (accès complet au dépôt)
5. Cliquez sur "Generate token"
6. **Copiez le token immédiatement** (vous ne pourrez plus le voir après)

### 3. Pousser le projet sur GitHub

```bash
cd GDJ

# Configurer Git (si nécessaire)
git config user.email "votre@email.com"
git config user.name "Votre Nom"

# Créer le dépôt local et pousser
git add .
git commit -m "Configuration avec Netlify Functions"
git branch -M main
git remote add origin https://github.com/votre-username/GDJ.git
git push -u origin main
```

### 4. Déployer sur Netlify

#### Via l'interface Netlify

1. Connectez-vous sur [netlify.com](https://www.netlify.com/)
2. Cliquez sur **"Add new site"** → **"Import an existing project"**
3. Sélectionnez **GitHub** et autorisez l'accès
4. Choisissez votre dépôt **`GDJ`**
5. Netlify détectera automatiquement la configuration
6. **AVANT** de cliquer sur "Deploy site", configurez les variables d'environnement :

#### 5. Configurer les variables d'environnement dans Netlify

**IMPORTANT** : Ces étapes sont essentielles pour que la synchronisation fonctionne !

1. Dans l'interface de configuration du site sur Netlify
2. Allez dans **"Site configuration"** → **"Environment variables"**
3. Cliquez sur **"Add a variable"**
4. Ajoutez les variables suivantes :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `GITHUB_TOKEN` | `ghp_...` | Votre Personal Access Token GitHub |
| `GITHUB_OWNER` | `votre-username` | Votre nom d'utilisateur GitHub |
| `GITHUB_REPO` | `GDJ` | Nom du dépôt |
| `GITHUB_BRANCH` | `main` | Branche principale |

5. Cliquez sur **"Deploy site"**

### 6. Vérifier que tout fonctionne

1. Attendez que le déploiement soit terminé (environ 1-2 minutes)
2. Ouvrez votre site (ex: `https://votre-site.netlify.app`)
3. Créez un compte (le premier sera automatiquement admin)
4. Ajoutez un produit
5. Ouvrez la console du navigateur (F12) et vérifiez le message : "Données synchronisées avec GitHub"
6. Allez sur GitHub et vérifiez que le fichier `data/data.json` a été créé/mis à jour
7. Ouvrez le site sur un autre appareil et connectez-vous avec le même compte → vous devriez voir vos données !

## 📖 Utilisation

### Premier lancement

1. Ouvrez le site sur Netlify
2. Créez le premier compte (il sera automatiquement administrateur)
3. Ajoutez des produits depuis l'interface administrateur
4. Les autres utilisateurs peuvent s'inscrire (ils seront membres par défaut)

### Accès multi-appareils

Une fois la synchronisation configurée :
- Créez un compte sur n'importe quel appareil
- Connectez-vous sur n'importe quel autre appareil avec le même email/mot de passe
- Toutes les données sont partagées via GitHub

### Mode Administrateur

- **Onglet Produits** : Gérer les produits (ajouter, modifier, supprimer)
- **Onglet Membres** : Voir la liste des membres et leurs ardoises
- Toute modification est automatiquement synchronisée avec GitHub

### Mode Membre

- **Onglet Commander** : Sélectionner les produits et valider une commande
- **Onglet Historique** : Voir l'historique des transactions et l'ardoise
- Possibilité de payer les transactions en attente

## 🕐 Gestion des dates et heures

L'application utilise le **fuseau horaire local de l'utilisateur** pour toutes les opérations :

- **Pour les utilisateurs en France** : UTC+2 (heure d'été) ou UTC+1 (heure d'hiver) automatiquement
- **Stockage** : Les dates sont enregistrées au format ISO 8601 en UTC dans `data.json`
- **Affichage** : Les dates sont affichées dans le fuseau local de chaque utilisateur
- **Promotion automatique** : Le système vérifie toutes les 24h avant l'événement (basé sur l'heure locale du serveur/navigateur)

### Exemple de fonctionnement de la promotion automatique

Si un événement est prévu le **5 octobre à 19h00** :
- Un membre en réserve depuis le **3 octobre à 14h30**
- **24h avant** (le 4 octobre à 19h00), si des places sont disponibles : **promotion automatique** en participant
- L'ordre d'inscription est respecté (premier inscrit en réserve = premier promu)

## 🔄 Comment fonctionne la synchronisation ?

### Architecture

```
Utilisateur (navigateur)
    ↕
localStorage (cache local)
    ↕
Netlify Function
    ↕
GitHub API
    ↕
data/data.json (stockage centralisé)
```

### Flux de données

1. **Chargement de la page** :
   - La fonction Netlify récupère `data/data.json` depuis GitHub
   - Les données sont affichées et mises en cache dans localStorage

2. **Modification (ajout produit, transaction, etc.)** :
   - Modification immédiate dans localStorage (performance)
   - Envoi automatique à la fonction Netlify
   - La fonction Netlify met à jour `data/data.json` sur GitHub
   - Commit automatique créé sur GitHub

3. **Autre appareil** :
   - Au chargement, récupère la dernière version depuis GitHub
   - Les données sont synchronisées entre tous les appareils

### Avantages

- ✅ **Pas de base de données** à gérer
- ✅ **Hébergement gratuit** (Netlify + GitHub)
- ✅ **Historique complet** (Git versioning)
- ✅ **Synchronisation automatique** entre appareils
- ✅ **Fonctionnement hors ligne** (localStorage)
- ✅ **Sécurisé** (token stocké côté serveur Netlify)

## 📁 Structure du projet

```
GDJ/
├── index.html                    # Page principale
├── app.js                        # Logique principale (auth, produits, transactions)
├── admin-extended.js             # Fonctionnalités admin (ludothèque, adhésions, export)
├── init-new-features.js          # Fonctionnalités membres (ludothèque, calendrier)
├── soumissions.js                # Système de soumissions (jeux, événements)
├── dialogs.js                    # Système de dialogues personnalisés (alert, confirm, prompt)
├── style.css                     # Styles CSS (thème héroïque/fantasy)
├── netlify.toml                  # Configuration Netlify
├── package.json                  # Dépendances Node.js
├── netlify/
│   └── functions/
│       └── github-sync.js        # Fonction de synchronisation GitHub
├── data/
│   └── data.json                 # Données centralisées (créé automatiquement)
├── .env.example                  # Exemple de variables d'environnement
└── README.md                     # Ce fichier
```

## 🔒 Sécurité

### Points importants

- ✅ Le token GitHub est stocké dans les variables d'environnement Netlify (côté serveur)
- ✅ Le token n'est jamais exposé au client
- ✅ **Chiffrement des données sensibles** : Les noms, prénoms, emails et mots de passe sont chiffrés dans `data.json` (XOR + Base64)
- ⚠️ Les données lisibles : produits, transactions (anonymisées), statistiques

### Données chiffrées vs en clair

**Chiffré dans data.json** :
- Noms et prénoms des membres
- Adresses email
- Mots de passe

**En clair dans data.json** :
- Pseudos (utilisés pour le login)
- Noms des produits et jeux
- Montants des transactions
- Dates et heures
- Statistiques globales

### Pour un usage en production

Cette application est conçue pour un usage interne et de petites associations. Pour une utilisation avec des données plus sensibles :

1. **Hashage des mots de passe** : Implémenter bcrypt ou Argon2 côté serveur
2. **Authentification robuste** : Utiliser OAuth ou JWT avec refresh tokens
3. **Chiffrement fort** : Remplacer XOR par AES-256
4. **Validation côté serveur** : Ajouter des règles de validation dans la fonction Netlify
5. **Rôles et permissions** : Ajouter une gestion fine des autorisations
6. **HTTPS** : S'assurer que le site est accessible uniquement en HTTPS (Netlify le fait par défaut)

## 🐛 Dépannage

### Les données ne se synchronisent pas

1. Vérifiez que les variables d'environnement sont bien configurées dans Netlify
2. Ouvrez la console du navigateur (F12) et regardez les erreurs
3. Vérifiez que le token GitHub a la permission `repo`
4. Testez la fonction : `https://votre-site.netlify.app/.netlify/functions/github-sync`

### Erreur 404 sur la fonction Netlify

1. Vérifiez que le dossier `netlify/functions/` existe
2. Redéployez le site sur Netlify
3. Attendez quelques minutes que les fonctions soient déployées

### Les données ne sont pas partagées entre appareils

1. Vérifiez que la synchronisation GitHub fonctionne (console du navigateur)
2. Rafraîchissez la page (F5) pour forcer le rechargement depuis GitHub
3. Vérifiez que le fichier `data/data.json` existe sur GitHub

## 📝 Mises à jour

Pour mettre à jour le site :

```bash
git add .
git commit -m "Description des modifications"
git push
```

Netlify redéploiera automatiquement le site en 1-2 minutes.

## 🤝 Support

Pour toute question ou problème, créez une issue sur GitHub.

## 📄 Licence

MIT
