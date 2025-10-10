# 🚀 Guide de Déploiement - Les Gardiens du Jeu

## ✅ Tout est Prêt !

Votre application est **100% complète** avec toutes les fonctionnalités demandées.

## 📋 Checklist des Fonctionnalités

### Interface Admin
- ✅ **Gestion des Stocks** - Produits de consommation
- ✅ **Ludothèque** - Catalogue des jeux avec propriétaire
- ✅ **Gestion des Membres** - Détails complets (clic sur ligne)
- ✅ **Adhésions & Cotisations** - Suivi annuel avec statut
- ✅ **Calendrier** - Créer et gérer des événements
- ✅ **Annonces** - Publications (AG, événements)
- ✅ **Export Excel** - CSV des transactions mensuelles
- ✅ **Statistiques** - Membres, CA, ardoises

### Interface Membre
- ✅ **Commander** - Sélectionner des produits
- ✅ **Historique** - Transactions et ardoise
- ✅ **Ludothèque** - Voir les jeux disponibles
- ✅ **Calendrier** - Consulter les événements
- ✅ **Annonces** - Lire les communications

### Technique
- ✅ **Mobile-First** - Interface optimisée pour téléphone
- ✅ **Responsive** - Fonctionne sur tous les écrans
- ✅ **Synchronisation** - GitHub + Netlify Functions
- ✅ **Multi-appareils** - Données partagées

## 🔧 Étapes de Déploiement

### 1. Pousser sur GitHub

```bash
cd GDJ

# Si vous avez déjà créé le dépôt sur GitHub :
git remote add origin https://github.com/votre-username/GDJ.git
git branch -M main
git push -u origin main
```

### 2. Déployer sur Netlify

1. Allez sur [netlify.com](https://netlify.com)
2. "Add new site" → "Import an existing project"
3. Sélectionnez votre repo GitHub **GDJ**
4. Netlify détecte automatiquement la config

### 3. Configurer les Variables d'Environnement

**TRÈS IMPORTANT** - Sans ça, la synchronisation ne marchera pas !

Dans Netlify Dashboard :
1. Site configuration → Environment variables
2. Ajoutez ces 4 variables :

| Variable | Valeur |
|----------|--------|
| `GITHUB_TOKEN` | Votre token `ghp_...` |
| `GITHUB_OWNER` | Votre username GitHub |
| `GITHUB_REPO` | `GDJ` |
| `GITHUB_BRANCH` | `main` |

3. Sauvegardez
4. Deploys → Trigger deploy → Clear cache and deploy site

### 4. Tester

1. Ouvrez votre site Netlify
2. Créez le premier compte (sera admin automatiquement)
3. Testez toutes les fonctionnalités :
   - Ajouter un produit ✓
   - Ajouter un jeu à la ludothèque ✓
   - Créer un événement au calendrier ✓
   - Publier une annonce ✓
   - Exporter les données ✓

4. **Sur mobile** : Ouvrez le site, tout doit être bien affiché

5. **Multi-appareils** :
   - Connectez-vous sur un autre appareil
   - Vos données doivent être là !

## 📱 Utilisation Mobile

L'interface est **optimisée pour mobile** :
- Onglets en 2 colonnes sur petit écran
- Tableaux scrollables horizontalement
- Boutons tactiles agrandis
- Police 16px (évite zoom auto iOS)
- Navigation fluide

## 🎮 Fonctionnalités Détaillées

### Ludothèque
- **Ajouter un jeu** : Nom, propriétaire, joueurs, durée, âge, description
- **Admin** : Modifier/supprimer
- **Membre** : Consultation uniquement

### Adhésions
- **Création** : Définir le montant (défaut 20€)
- **Durée** : 1 an automatique
- **Statut visuel** : Vert (à jour) / Rouge (expirée)

### Calendrier
- **Navigation** : Mois par mois
- **Événements** : Clic sur jour pour voir/créer
- **Admin** : Créer des événements
- **Membre** : Consulter les événements

### Annonces
- **Types** : AG, événements, infos générales
- **Affichage** : Chronologique (plus récent en haut)
- **Admin** : Publier et supprimer
- **Membre** : Lecture seule

### Export Excel
- **Format** : CSV (compatible Excel)
- **Contenu** : Date, membre, produits, montant, paiement, statut
- **Période** : Mois en cours
- **Stats** : Membres, transactions, CA, ardoises

### Détails Membres
- **Accès** : Cliquer sur une ligne dans "Membres"
- **Infos** : Ardoise, total dépensé, nb transactions
- **Adhésion** : Statut et date de fin

## 🔄 Synchronisation

Toutes les données sont **synchronisées automatiquement** :

```
Utilisateur → localStorage (cache local)
              ↓
         Netlify Function
              ↓
          GitHub API
              ↓
      data/data.json (source de vérité)
```

Chaque modification crée un commit sur GitHub !

## 📊 Structure des Données

```json
{
  "produits": [...],           // Stock de consommables
  "ludotheque": [...],         // Jeux de société
  "membres": [...],            // Utilisateurs
  "adhesions": [...],          // Cotisations annuelles
  "transactions": [...],       // Achats de produits
  "evenements": [...],         // Calendrier
  "annonces": [...],           // Communications
  "settings": {
    "lastProductId": 0,
    "lastGameId": 0,
    "lastMembreId": 0,
    "lastAdhesionId": 0,
    "lastTransactionId": 0,
    "lastEvenementId": 0,
    "lastAnnonceId": 0
  }
}
```

## 🎯 Cas d'Usage

### Soirée Jeux
1. **Membre** ouvre le site sur téléphone
2. Consulte le **calendrier** pour voir la prochaine soirée
3. Consulte la **ludothèque** pour choisir un jeu
4. Achète un Coca via **Commander**
5. Paye en **ardoise**

### Assemblée Générale
1. **Admin** publie une **annonce** : "AG le 15/03"
2. Crée un **événement** au calendrier
3. Après l'AG, publie le **rapport**
4. Exporte les **données financières** pour présentation

### Fin de Mois
1. **Admin** va dans **Export**
2. Télécharge le CSV des transactions
3. Ouvre dans Excel
4. Envoie au trésorier

## 🆘 Support

Si problème :
1. F12 → Console → Regardez les erreurs
2. Vérifiez les variables d'environnement Netlify
3. Vérifiez que le token GitHub a permission `repo`

## ✨ C'est Parti !

```bash
git push origin main
```

Votre association est prête à gérer :
- 🎮 Sa ludothèque
- 🍫 Ses stocks
- 👥 Ses membres
- 📅 Ses événements
- 💰 Ses finances

**Tout est automatique, tout est synchronisé ! 🚀**
