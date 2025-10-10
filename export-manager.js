// Gestionnaire d'export multi-formats
// Supporte : Excel (XLSX), JSON, PDF

class ExportManager {
  constructor() {
    this.checkDependencies();
  }

  // Vérifier les dépendances
  checkDependencies() {
    // Charger SheetJS pour Excel si pas déjà chargé
    if (typeof XLSX === 'undefined') {
      console.log('[Export] Chargement de SheetJS...');
      this.loadSheetJS();
    }
  }

  // Charger SheetJS dynamiquement
  async loadSheetJS() {
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';

    return new Promise((resolve) => {
      script.onload = () => {
        console.log('[Export] SheetJS chargé');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  // ===== EXPORT EXCEL =====

  async exporterExcel(type = 'complet') {
    if (typeof XLSX === 'undefined') {
      await this.loadSheetJS();
    }

    const wb = XLSX.utils.book_new();

    switch (type) {
      case 'complet':
        this.ajouterFeuillesCompletes(wb);
        break;
      case 'transactions':
        this.ajouterFeuilleTransactions(wb);
        break;
      case 'adhesions':
        this.ajouterFeuilleAdhesions(wb);
        break;
      case 'ludotheque':
        this.ajouterFeuilleLudotheque(wb);
        break;
      case 'depenses':
        this.ajouterFeuilleDepenses(wb);
        break;
      default:
        this.ajouterFeuillesCompletes(wb);
    }

    // Télécharger le fichier
    const date = new Date().toISOString().split('T')[0];
    const filename = `GDJ_Export_${type}_${date}.xlsx`;

    XLSX.writeFile(wb, filename);

    return true;
  }

  // Ajouter toutes les feuilles
  ajouterFeuillesCompletes(wb) {
    // Ajouter des onglets pour chaque mois avec données
    this.ajouterOngletsParMois(wb);

    // Onglets globaux - tous les types de données
    this.ajouterFeuilleMembresDetaille(wb);
    this.ajouterFeuilleTransactions(wb);
    this.ajouterFeuilleAdhesions(wb);
    this.ajouterFeuilleLudotheque(wb);
    this.ajouterFeuilleDepenses(wb);
    this.ajouterFeuilleEvenements(wb);
    this.ajouterFeuilleStatistiques(wb);
  }

  // Créer un onglet par mois contenant les données de ce mois
  ajouterOngletsParMois(wb) {
    // Récupérer tous les mois où il y a eu des transactions ou dépenses
    const moisAvecDonnees = new Set();

    // Transactions
    (appData.transactions || []).forEach(t => {
      const date = new Date(t.date);
      const moisKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      moisAvecDonnees.add(moisKey);
    });

    // Dépenses (réapprovisionnements)
    (appData.reapprovisionnements || []).forEach(r => {
      const date = new Date(r.date);
      const moisKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      moisAvecDonnees.add(moisKey);
    });

    // Dépenses (achats divers)
    (appData.achatsDivers || []).forEach(a => {
      const date = new Date(a.date);
      const moisKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      moisAvecDonnees.add(moisKey);
    });

    // Adhésions
    (appData.adhesions || []).forEach(a => {
      const date = new Date(a.dateDebut);
      const moisKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      moisAvecDonnees.add(moisKey);
    });

    // Trier les mois par ordre chronologique
    const moisTries = Array.from(moisAvecDonnees).sort((a, b) => {
      const [moisA, anneeA] = a.split('/');
      const [moisB, anneeB] = b.split('/');
      const dateA = new Date(parseInt(anneeA), parseInt(moisA) - 1);
      const dateB = new Date(parseInt(anneeB), parseInt(moisB) - 1);
      return dateB - dateA; // Plus récent en premier
    });

    // Créer un onglet pour chaque mois
    moisTries.forEach(moisKey => {
      this.ajouterOngletMois(wb, moisKey);
    });
  }

  // Créer un onglet pour un mois spécifique (format: MM/YYYY)
  ajouterOngletMois(wb, moisKey) {
    const [mois, annee] = moisKey.split('/');
    const moisNum = parseInt(mois) - 1;
    const anneeNum = parseInt(annee);

    // Filtrer les données pour ce mois
    const debutMois = new Date(anneeNum, moisNum, 1);
    const finMois = new Date(anneeNum, moisNum + 1, 0, 23, 59, 59);

    // Transactions du mois
    const transactions = (appData.transactions || []).filter(t => {
      const date = new Date(t.date);
      return date >= debutMois && date <= finMois;
    });

    const totalRecettesVentes = transactions.reduce((sum, t) => sum + (t.montant || 0), 0);

    // Adhésions du mois
    const adhesions = (appData.adhesions || []).filter(a => {
      const date = new Date(a.dateDebut);
      return date >= debutMois && date <= finMois;
    });

    const totalRecettesCotisations = adhesions.reduce((sum, a) => sum + (a.montant || 0), 0);

    // Dépenses du mois
    const reappros = (appData.reapprovisionnements || []).filter(r => {
      const date = new Date(r.date);
      return date >= debutMois && date <= finMois;
    });

    const achats = (appData.achatsDivers || []).filter(a => {
      const date = new Date(a.date);
      return date >= debutMois && date <= finMois;
    });

    const totalDepensesReappros = reappros.reduce((sum, r) => sum + (r.cout_total || 0), 0);
    const totalDepensesAchats = achats.reduce((sum, a) => sum + (a.montant || 0), 0);
    const totalDepenses = totalDepensesReappros + totalDepensesAchats;

    const totalRecettes = totalRecettesVentes + totalRecettesCotisations;
    const resultat = totalRecettes - totalDepenses;

    // Créer les données pour l'onglet
    const data = [
      { 'Section': '--- RÉSUMÉ DU MOIS ---', 'Détail': '', 'Montant': '' },
      { 'Section': '', 'Détail': '', 'Montant': '' },
      { 'Section': 'RECETTES', 'Détail': '', 'Montant': '' },
      { 'Section': 'Ventes produits', 'Détail': `${transactions.length} transaction(s)`, 'Montant': totalRecettesVentes.toFixed(2) + ' €' },
      { 'Section': 'Cotisations', 'Détail': `${adhesions.length} adhésion(s)`, 'Montant': totalRecettesCotisations.toFixed(2) + ' €' },
      { 'Section': 'TOTAL RECETTES', 'Détail': '', 'Montant': totalRecettes.toFixed(2) + ' €' },
      { 'Section': '', 'Détail': '', 'Montant': '' },
      { 'Section': 'DÉPENSES', 'Détail': '', 'Montant': '' },
      { 'Section': 'Réapprovisionnements', 'Détail': `${reappros.length} réappro(s)`, 'Montant': totalDepensesReappros.toFixed(2) + ' €' },
      { 'Section': 'Achats divers', 'Détail': `${achats.length} achat(s)`, 'Montant': totalDepensesAchats.toFixed(2) + ' €' },
      { 'Section': 'TOTAL DÉPENSES', 'Détail': '', 'Montant': totalDepenses.toFixed(2) + ' €' },
      { 'Section': '', 'Détail': '', 'Montant': '' },
      { 'Section': 'RÉSULTAT', 'Détail': '', 'Montant': resultat.toFixed(2) + ' €' },
      { 'Section': '', 'Détail': '', 'Montant': '' },
      { 'Section': '', 'Détail': '', 'Montant': '' },
      { 'Section': '--- DÉTAIL TRANSACTIONS ---', 'Détail': '', 'Montant': '' },
      { 'Section': '', 'Détail': '', 'Montant': '' },
      ...transactions.map(t => {
        const membre = appData.membres.find(m => m.id === t.membreId);
        const produits = t.produits.map(p => {
          const produit = appData.produits.find(pr => pr.id === p.produitId);
          return `${produit ? produit.nom : 'Inconnu'} x${p.quantite}`;
        }).join(', ');

        return {
          'Section': new Date(t.date).toLocaleDateString('fr-FR'),
          'Détail': `${membre ? membre.pseudo : 'Inconnu'} - ${produits}`,
          'Montant': t.montant.toFixed(2) + ' €'
        };
      }),
      { 'Section': '', 'Détail': '', 'Montant': '' },
      { 'Section': '', 'Détail': '', 'Montant': '' },
      { 'Section': '--- DÉTAIL ADHÉSIONS ---', 'Détail': '', 'Montant': '' },
      { 'Section': '', 'Détail': '', 'Montant': '' },
      ...adhesions.map(a => {
        const membre = appData.membres.find(m => m.id === a.membreId);
        return {
          'Section': new Date(a.dateDebut).toLocaleDateString('fr-FR'),
          'Détail': `${membre ? membre.pseudo : 'Inconnu'} (jusqu'au ${new Date(a.dateFin).toLocaleDateString('fr-FR')})`,
          'Montant': a.montant.toFixed(2) + ' €'
        };
      }),
      { 'Section': '', 'Détail': '', 'Montant': '' },
      { 'Section': '', 'Détail': '', 'Montant': '' },
      { 'Section': '--- DÉTAIL DÉPENSES ---', 'Détail': '', 'Montant': '' },
      { 'Section': '', 'Détail': '', 'Montant': '' },
      ...reappros.map(r => ({
        'Section': new Date(r.date).toLocaleDateString('fr-FR'),
        'Détail': `[RÉAPPRO] ${r.produit_nom} - Qté: ${r.quantite}`,
        'Montant': r.cout_total.toFixed(2) + ' €'
      })),
      ...achats.map(a => ({
        'Section': new Date(a.date).toLocaleDateString('fr-FR'),
        'Détail': `[ACHAT] ${a.article}${a.note ? ' - ' + a.note : ''}`,
        'Montant': a.montant.toFixed(2) + ' €'
      }))
    ];

    const ws = XLSX.utils.json_to_sheet(data);

    // Nom de l'onglet (limité à 31 caractères par Excel)
    // Remplacer le "/" par "-" car "/" n'est pas autorisé dans les noms de feuilles Excel
    const sheetName = moisKey.replace('/', '-');
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Feuille Transactions
  ajouterFeuilleTransactions(wb) {
    const data = (appData.transactions || []).map(t => {
      const membre = appData.membres.find(m => m.id === t.membreId);
      const produits = t.produits.map(p => {
        const produit = appData.produits.find(pr => pr.id === p.produitId);
        return `${produit ? produit.nom : 'Inconnu'} (x${p.quantite})`;
      }).join(', ');

      return {
        'Date': new Date(t.date).toLocaleString('fr-FR'),
        'Membre': membre ? membre.pseudo : 'Inconnu',
        'Produits': produits,
        'Montant': t.montant,
        'Paiement': t.paiement,
        'Statut': t.statut
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  }

  // Feuille Adhésions
  ajouterFeuilleAdhesions(wb) {
    const data = (appData.adhesions || []).map(a => {
      const membre = appData.membres.find(m => m.id === a.membreId);

      return {
        'Date début': new Date(a.dateDebut).toLocaleDateString('fr-FR'),
        'Date fin': new Date(a.dateFin).toLocaleDateString('fr-FR'),
        'Membre': membre ? membre.pseudo : 'Inconnu',
        'Nom': membre ? decrypt(membre.nom) : 'Inconnu',
        'Prénom': membre ? decrypt(membre.prenom) : 'Inconnu',
        'Email': membre && membre.email ? decrypt(membre.email) : '',
        'Montant': a.montant,
        'Statut': a.statut
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Adhésions');
  }

  // Feuille Ludothèque
  ajouterFeuilleLudotheque(wb) {
    const data = (appData.ludotheque || []).map(j => ({
      'Nom': j.nom,
      'Propriétaire': j.proprietaire || 'Association',
      'Min Joueurs': j.minJoueurs,
      'Max Joueurs': j.maxJoueurs,
      'Durée (min)': j.duree,
      'Âge minimum': j.age,
      'Extension': j.estExtension ? 'Oui' : 'Non',
      'BGG ID': j.bggId || '',
      'Note BGG': j.note || '',
      'Date ajout': new Date(j.dateAjout).toLocaleDateString('fr-FR'),
      'Description': j.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Ludothèque');
  }

  // Feuille Dépenses
  ajouterFeuilleDepenses(wb) {
    const reappros = (appData.reapprovisionnements || []).map(r => ({
      'Date': new Date(r.date).toLocaleDateString('fr-FR'),
      'Type': 'Réapprovisionnement',
      'Article': r.produit_nom,
      'Catégorie': 'Réapprovisionnement',
      'Quantité': r.quantite,
      'Coût unitaire': r.cout_unitaire,
      'Coût total': r.cout_total,
      'Note': r.note || ''
    }));

    const achats = (appData.achatsDivers || []).map(a => ({
      'Date': new Date(a.date).toLocaleDateString('fr-FR'),
      'Type': 'Achat divers',
      'Article': a.article,
      'Catégorie': 'Achat divers',
      'Quantité': '',
      'Coût unitaire': '',
      'Coût total': a.montant,
      'Note': a.note || ''
    }));

    const data = [...reappros, ...achats].sort((a, b) => new Date(b.Date) - new Date(a.Date));

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Dépenses');
  }

  // Feuille Membres
  ajouterFeuilleMembres(wb) {
    const data = (appData.membres || []).map(m => ({
      'Pseudo': m.pseudo,
      'Nom': decrypt(m.nom),
      'Prénom': decrypt(m.prenom),
      'Email': m.email ? decrypt(m.email) : '',
      'Rôle': m.role === 'admin' ? 'Administrateur' : 'Membre',
      'Date inscription': new Date(m.dateInscription).toLocaleDateString('fr-FR'),
      'Ardoise': m.ardoise || 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Membres');
  }

  // Feuille Membres détaillée (pour export complet)
  ajouterFeuilleMembresDetaille(wb) {
    const data = (appData.membres || []).map(m => {
      // Calculer les statistiques du membre
      const transactions = (appData.transactions || []).filter(t => t.membreId === m.id);
      const nbTransactions = transactions.length;
      const totalDepense = transactions.reduce((sum, t) => sum + (t.montant || 0), 0);

      // Adhésion en cours
      const adhesionEnCours = (appData.adhesions || []).find(a =>
        a.membreId === m.id &&
        new Date(a.dateFin) >= new Date() &&
        a.statut === 'active'
      );

      // Nombre de jeux possédés
      const nbJeux = (appData.ludotheque || []).filter(j =>
        j.proprietaire === m.pseudo ||
        j.proprietaire === `${decrypt(m.prenom)} ${decrypt(m.nom)}`
      ).length;

      // Participation aux événements
      const nbEvenements = (appData.evenements || []).filter(e =>
        (e.participants || []).some(p => p.membre_id === m.id)
      ).length;

      return {
        'Pseudo': m.pseudo,
        'Nom': decrypt(m.nom),
        'Prénom': decrypt(m.prenom),
        'Email': m.email ? decrypt(m.email) : '',
        'Rôle': m.role === 'admin' ? 'Administrateur' : 'Membre',
        'Date inscription': new Date(m.dateInscription).toLocaleDateString('fr-FR'),
        'Adhésion valide': adhesionEnCours ? 'Oui' : 'Non',
        'Fin adhésion': adhesionEnCours ? new Date(adhesionEnCours.dateFin).toLocaleDateString('fr-FR') : '',
        'Ardoise': (m.ardoise || 0).toFixed(2) + ' €',
        'Nb transactions': nbTransactions,
        'Total dépensé': totalDepense.toFixed(2) + ' €',
        'Nb jeux possédés': nbJeux,
        'Nb événements participés': nbEvenements
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Membres');
  }

  // Feuille Événements
  ajouterFeuilleEvenements(wb) {
    const data = (appData.evenements || []).map(e => ({
      'Titre': e.titre,
      'Type': e.type || 'Autre',
      'Date': new Date(e.date).toLocaleString('fr-FR'),
      'Durée (h)': e.duree || '',
      'Max participants': e.maxParticipants || '',
      'Participants inscrits': (e.participants || []).length,
      'Réservistes': (e.reservistes || []).length,
      'Lieu': e.lieu || '',
      'Description': e.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Événements');
  }

  // Feuille Statistiques
  ajouterFeuilleStatistiques(wb) {
    const annee = new Date().getFullYear();
    const stats = comparaisonAnnuelle.getStatistiquesAnnee(annee);

    const data = [
      { 'Indicateur': 'Total recettes', 'Valeur': stats.recettes.total.toFixed(2) + ' €' },
      { 'Indicateur': 'Ventes produits', 'Valeur': stats.recettes.ventes.toFixed(2) + ' €' },
      { 'Indicateur': 'Cotisations', 'Valeur': stats.recettes.cotisations.toFixed(2) + ' €' },
      { 'Indicateur': 'Dons et subventions', 'Valeur': stats.recettes.dons.toFixed(2) + ' €' },
      { 'Indicateur': '', 'Valeur': '' },
      { 'Indicateur': 'Total dépenses', 'Valeur': stats.depenses.total.toFixed(2) + ' €' },
      { 'Indicateur': 'Réapprovisionnements', 'Valeur': stats.depenses.reappros.toFixed(2) + ' €' },
      { 'Indicateur': 'Achats divers', 'Valeur': stats.depenses.achats.toFixed(2) + ' €' },
      { 'Indicateur': '', 'Valeur': '' },
      { 'Indicateur': 'Résultat', 'Valeur': stats.resultat.toFixed(2) + ' €' },
      { 'Indicateur': '', 'Valeur': '' },
      { 'Indicateur': 'Membres actifs', 'Valeur': stats.activite.nbMembres },
      { 'Indicateur': 'Adhésions', 'Valeur': stats.activite.nbAdhesions },
      { 'Indicateur': 'Transactions', 'Valeur': stats.activite.nbTransactions },
      { 'Indicateur': 'Événements', 'Valeur': stats.activite.nbEvenements }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Statistiques ' + annee);
  }

  // ===== EXPORT JSON =====

  exporterJSON(type = 'complet') {
    let data = {};

    switch (type) {
      case 'complet':
        data = appData;
        break;
      case 'transactions':
        data = { transactions: appData.transactions || [] };
        break;
      case 'adhesions':
        data = { adhesions: appData.adhesions || [] };
        break;
      case 'ludotheque':
        data = { ludotheque: appData.ludotheque || [] };
        break;
      case 'membres':
        data = { membres: appData.membres || [] };
        break;
      default:
        data = appData;
    }

    // Créer un blob et télécharger
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `GDJ_Export_${type}_${date}.json`;
    a.click();

    URL.revokeObjectURL(url);

    return true;
  }

  // ===== EXPORT PDF =====

  async exporterPDF(type = 'synthese') {
    // Utiliser le générateur de rapports AG pour les PDFs
    if (type === 'rapport_ag') {
      const annee = new Date().getFullYear();
      return rapportAGGenerator.genererRapportAnnuel(annee);
    }

    // Autres types de PDF (à implémenter si besoin)
    showAlert('Type de PDF non supporté pour le moment', 'Information');
    return false;
  }
}

// Instance globale
const exportManager = new ExportManager();

// Afficher le dialogue d'export
function afficherDialogueExport() {
  const html = `
    <div style="max-width: 800px; margin: 0 auto;">
      <h2 style="color: #ffd700; margin-bottom: 20px;">💾 Exporter les données</h2>

      <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 3px solid #ffd700;">
        <p style="margin: 0; color: #e0e0e0;">
          Exportez vos données dans différents formats pour les analyser, archiver ou partager.
        </p>
      </div>

      <!-- Export Excel -->
      <div style="background: rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 25px; margin-bottom: 20px;">
        <h3 style="color: #2ecc71; margin: 0 0 15px 0;">📊 Export Excel (.xlsx)</h3>
        <p style="color: #e0e0e0; margin-bottom: 20px; font-size: 14px;">
          Format idéal pour l'analyse dans Excel, Google Sheets, LibreOffice, etc.<br>
          <strong>L'export complet inclut tous les onglets :</strong> Mois détaillés, Membres, Transactions, Adhésions, Ludothèque, Dépenses, Événements et Statistiques.
        </p>
        <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
          <button onclick="exporterExcel('complet')" class="btn-export" style="font-size: 16px; padding: 15px 20px;">📦 Export Complet</button>
        </div>
      </div>

      <!-- Export JSON -->
      <div style="background: rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 25px; margin-bottom: 20px;">
        <h3 style="color: #3498db; margin: 0 0 15px 0;">🔧 Export JSON</h3>
        <p style="color: #e0e0e0; margin-bottom: 20px; font-size: 14px;">
          Format technique pour développeurs, sauvegardes ou migrations.
        </p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          <button onclick="exporterJSON('complet')" class="btn-export">📦 Export complet</button>
          <button onclick="exporterJSON('transactions')" class="btn-export">💰 Transactions</button>
          <button onclick="exporterJSON('adhesions')" class="btn-export">👥 Adhésions</button>
          <button onclick="exporterJSON('ludotheque')" class="btn-export">🎲 Ludothèque</button>
          <button onclick="exporterJSON('membres')" class="btn-export">👤 Membres</button>
        </div>
      </div>

      <!-- Export PDF -->
      <div style="background: rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 25px;">
        <h3 style="color: #e74c3c; margin: 0 0 15px 0;">📄 Export PDF</h3>
        <p style="color: #e0e0e0; margin-bottom: 20px; font-size: 14px;">
          Rapports professionnels prêts pour impression ou présentation.
        </p>
        <div style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 10px;">
          <button onclick="afficherDialogueRapportAG(); document.getElementById('exportDialog').remove();" class="btn-export">
            📊 Rapport Annuel pour l'AG
          </button>
        </div>
      </div>
    </div>

    <style>
      .btn-export {
        background: linear-gradient(135deg, rgba(52, 152, 219, 0.2), rgba(41, 128, 185, 0.3));
        border: 2px solid rgba(52, 152, 219, 0.5);
        color: #3498db;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s;
      }

      .btn-export:hover {
        background: linear-gradient(135deg, rgba(52, 152, 219, 0.4), rgba(41, 128, 185, 0.5));
        border-color: rgba(52, 152, 219, 0.8);
        color: #5dade2;
        transform: translateY(-2px);
      }
    </style>
  `;

  const dialog = document.createElement('div');
  dialog.id = 'exportDialog';
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
    overflow-y: auto;
  `;

  dialog.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 15px;
      padding: 30px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
      position: relative;
    ">
      <button
        onclick="document.getElementById('exportDialog').remove()"
        style="
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          font-size: 24px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
        "
      >
        ×
      </button>

      ${html}
    </div>
  `;

  document.body.appendChild(dialog);
}

// Fonctions wrapper pour les boutons
async function exporterExcel(type) {
  try {
    showAlert('⏳ Génération du fichier Excel...', 'Export');
    await exportManager.exporterExcel(type);
    showAlert('✅ Fichier Excel téléchargé avec succès !', 'Succès');
  } catch (error) {
    console.error('[Export] Erreur:', error);
    showAlert('❌ Erreur lors de l\'export : ' + error.message, 'Erreur');
  }
}

function exporterJSON(type) {
  try {
    exportManager.exporterJSON(type);
    showAlert('✅ Fichier JSON téléchargé avec succès !', 'Succès');
  } catch (error) {
    console.error('[Export] Erreur:', error);
    showAlert('❌ Erreur lors de l\'export : ' + error.message, 'Erreur');
  }
}

async function exporterPDF(type) {
  try {
    await exportManager.exporterPDF(type);
  } catch (error) {
    console.error('[Export] Erreur:', error);
    showAlert('❌ Erreur lors de l\'export : ' + error.message, 'Erreur');
  }
}
