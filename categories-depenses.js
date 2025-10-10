// Gestion des catégories et sous-catégories de dépenses

// Structure des catégories de dépenses
const CATEGORIES_DEPENSES = {
  reappro: {
    nom: 'Réapprovisionnements',
    icon: '📦',
    color: '#3498db',
    sousCat: {
      boissons: { nom: 'Boissons', icon: '🥤' },
      snacks: { nom: 'Snacks & Chips', icon: '🍿' },
      chocolat: { nom: 'Chocolat & Confiseries', icon: '🍫' },
      autre: { nom: 'Autre produits', icon: '📦' }
    }
  },
  materiel: {
    nom: 'Matériel & Équipement',
    icon: '🛠️',
    color: '#e67e22',
    sousCat: {
      mobilier: { nom: 'Mobilier (tables, chaises)', icon: '🪑' },
      rangement: { nom: 'Rangement & Organisation', icon: '📚' },
      informatique: { nom: 'Informatique', icon: '💻' },
      electronique: { nom: 'Électronique (TV, son)', icon: '📺' },
      decoration: { nom: 'Décoration', icon: '🎨' },
      autre: { nom: 'Autre matériel', icon: '🛠️' }
    }
  },
  evenements: {
    nom: 'Événements & Animations',
    icon: '🎉',
    color: '#9b59b6',
    sousCat: {
      location: { nom: 'Location de salle', icon: '🏢' },
      animation: { nom: 'Animateurs & Intervenants', icon: '🎭' },
      prix: { nom: 'Prix & Récompenses', icon: '🏆' },
      communication: { nom: 'Communication & Flyers', icon: '📢' },
      autre: { nom: 'Autre événements', icon: '🎉' }
    }
  },
  jeux: {
    nom: 'Jeux & Ludothèque',
    icon: '🎲',
    color: '#1abc9c',
    sousCat: {
      jeux_societe: { nom: 'Jeux de société', icon: '🎲' },
      extensions: { nom: 'Extensions de jeux', icon: '📦' },
      protections: { nom: 'Protections & Accessoires', icon: '🛡️' },
      reparation: { nom: 'Réparation & Entretien', icon: '🔧' },
      autre: { nom: 'Autre ludothèque', icon: '🎲' }
    }
  },
  administratif: {
    nom: 'Administratif & Services',
    icon: '📋',
    color: '#34495e',
    sousCat: {
      assurance: { nom: 'Assurances', icon: '🛡️' },
      banque: { nom: 'Frais bancaires', icon: '🏦' },
      comptable: { nom: 'Expert-comptable', icon: '📊' },
      juridique: { nom: 'Frais juridiques', icon: '⚖️' },
      abonnements: { nom: 'Abonnements & Licences', icon: '📝' },
      autre: { nom: 'Autre administratif', icon: '📋' }
    }
  },
  communication: {
    nom: 'Communication & Marketing',
    icon: '📣',
    color: '#e74c3c',
    sousCat: {
      site_web: { nom: 'Site web & Hébergement', icon: '🌐' },
      impression: { nom: 'Impression & Papeterie', icon: '🖨️' },
      publicite: { nom: 'Publicité', icon: '📺' },
      goodies: { nom: 'Goodies & Merchandising', icon: '🎁' },
      autre: { nom: 'Autre communication', icon: '📣' }
    }
  },
  autre: {
    nom: 'Autres dépenses',
    icon: '💰',
    color: '#95a5a6',
    sousCat: {
      divers: { nom: 'Divers', icon: '💰' },
      imprevus: { nom: 'Imprévus', icon: '❓' }
    }
  }
};

// Classe pour gérer les catégories de dépenses
class CategoriesDepensesManager {
  constructor() {
    this.categories = CATEGORIES_DEPENSES;
    this.init();
  }

  init() {
    // Initialiser les catégories dans appData si elles n'existent pas
    if (!appData.reapprovisionnements) {
      appData.reapprovisionnements = [];
    }

    if (!appData.achatsDivers) {
      appData.achatsDivers = [];
    }

    // Migrer les anciennes données sans catégories
    this.migrerDonneesAnciennes();

    console.log('[CategoriesDepenses] Gestionnaire initialisé');
  }

  // Migrer les anciennes données sans catégories
  migrerDonneesAnciennes() {
    let updated = false;

    // Réapprovisionnements
    appData.reapprovisionnements.forEach(reappro => {
      if (!reappro.categorie) {
        // Deviner la catégorie selon le produit
        const produit = reappro.produit_nom.toLowerCase();
        if (produit.includes('coca') || produit.includes('boisson') || produit.includes('eau')) {
          reappro.categorie = 'reappro';
          reappro.sousCategorie = 'boissons';
        } else if (produit.includes('chips') || produit.includes('snack')) {
          reappro.categorie = 'reappro';
          reappro.sousCategorie = 'snacks';
        } else if (produit.includes('chocolat') || produit.includes('bonbon')) {
          reappro.categorie = 'reappro';
          reappro.sousCategorie = 'chocolat';
        } else {
          reappro.categorie = 'reappro';
          reappro.sousCategorie = 'autre';
        }
        updated = true;
      }
    });

    // Achats divers
    appData.achatsDivers.forEach(achat => {
      if (!achat.categorie) {
        achat.categorie = 'autre';
        achat.sousCategorie = 'divers';
        updated = true;
      }
    });

    if (updated) {
      saveData();
      console.log('[CategoriesDepenses] Données migrées');
    }
  }

  // Obtenir toutes les catégories
  getCategories() {
    return this.categories;
  }

  // Obtenir une catégorie spécifique
  getCategorie(categorieId) {
    return this.categories[categorieId];
  }

  // Obtenir toutes les sous-catégories d'une catégorie
  getSousCategories(categorieId) {
    const categorie = this.categories[categorieId];
    return categorie ? categorie.sousCat : {};
  }

  // Obtenir le nom complet d'une catégorie/sous-catégorie
  getNomComplet(categorieId, sousCategorieId) {
    const categorie = this.getCategorie(categorieId);
    if (!categorie) return 'Inconnu';

    if (!sousCategorieId || !categorie.sousCat[sousCategorieId]) {
      return categorie.nom;
    }

    return `${categorie.nom} > ${categorie.sousCat[sousCategorieId].nom}`;
  }

  // Obtenir l'icône d'une sous-catégorie
  getIcon(categorieId, sousCategorieId) {
    const categorie = this.getCategorie(categorieId);
    if (!categorie) return '💰';

    if (!sousCategorieId || !categorie.sousCat[sousCategorieId]) {
      return categorie.icon;
    }

    return categorie.sousCat[sousCategorieId].icon;
  }

  // Obtenir la couleur d'une catégorie
  getColor(categorieId) {
    const categorie = this.getCategorie(categorieId);
    return categorie ? categorie.color : '#95a5a6';
  }

  // Obtenir les dépenses par catégorie
  getDepensesParCategorie(annee = null) {
    const depenses = {};

    Object.keys(this.categories).forEach(catId => {
      depenses[catId] = {
        total: 0,
        sousCategories: {}
      };

      Object.keys(this.categories[catId].sousCat).forEach(sousCatId => {
        depenses[catId].sousCategories[sousCatId] = 0;
      });
    });

    // Calculer les totaux
    const filtrerParAnnee = (item) => {
      if (!annee) return true;
      const date = new Date(item.date);
      return date.getFullYear() === annee;
    };

    // Réapprovisionnements
    appData.reapprovisionnements
      .filter(filtrerParAnnee)
      .forEach(reappro => {
        const cat = reappro.categorie || 'reappro';
        const sousCat = reappro.sousCategorie || 'autre';

        if (depenses[cat]) {
          depenses[cat].total += reappro.cout_total || 0;
          if (depenses[cat].sousCategories[sousCat] !== undefined) {
            depenses[cat].sousCategories[sousCat] += reappro.cout_total || 0;
          }
        }
      });

    // Achats divers
    appData.achatsDivers
      .filter(filtrerParAnnee)
      .forEach(achat => {
        const cat = achat.categorie || 'autre';
        const sousCat = achat.sousCategorie || 'divers';

        if (depenses[cat]) {
          depenses[cat].total += achat.montant || 0;
          if (depenses[cat].sousCategories[sousCat] !== undefined) {
            depenses[cat].sousCategories[sousCat] += achat.montant || 0;
          }
        }
      });

    return depenses;
  }

  // Obtenir les statistiques détaillées
  getStatistiques(annee = null) {
    const depensesParCategorie = this.getDepensesParCategorie(annee);
    const totalDepenses = Object.values(depensesParCategorie).reduce((sum, cat) => sum + cat.total, 0);

    const stats = {
      totalDepenses,
      categories: []
    };

    Object.keys(depensesParCategorie).forEach(catId => {
      const categorie = this.categories[catId];
      const depensesCat = depensesParCategorie[catId];

      if (depensesCat.total > 0) {
        stats.categories.push({
          id: catId,
          nom: categorie.nom,
          icon: categorie.icon,
          color: categorie.color,
          total: depensesCat.total,
          pourcentage: totalDepenses > 0 ? ((depensesCat.total / totalDepenses) * 100).toFixed(1) : 0,
          sousCategories: Object.keys(depensesCat.sousCategories)
            .map(sousCatId => ({
              id: sousCatId,
              nom: categorie.sousCat[sousCatId].nom,
              icon: categorie.sousCat[sousCatId].icon,
              montant: depensesCat.sousCategories[sousCatId],
              pourcentage: depensesCat.total > 0
                ? ((depensesCat.sousCategories[sousCatId] / depensesCat.total) * 100).toFixed(1)
                : 0
            }))
            .filter(sc => sc.montant > 0)
            .sort((a, b) => b.montant - a.montant)
        });
      }
    });

    stats.categories.sort((a, b) => b.total - a.total);

    return stats;
  }
}

// Instance globale
const categoriesDepensesManager = new CategoriesDepensesManager();

// Exposer globalement
window.categoriesDepensesManager = categoriesDepensesManager;
window.CATEGORIES_DEPENSES = CATEGORIES_DEPENSES;
