// Générateur de rapports comptables pour l'Assemblée Générale
// Utilise jsPDF et jsPDF-AutoTable pour la génération PDF

class RapportAGGenerator {
  constructor() {
    this.checkDependencies();
  }

  // Vérifier que jsPDF est chargé
  checkDependencies() {
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
      console.warn('[RapportAG] jsPDF non chargé. Chargement...');
      this.loadJsPDF();
    }
  }

  // Charger jsPDF dynamiquement
  async loadJsPDF() {
    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

    const script2 = document.createElement('script');
    script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';

    return new Promise((resolve) => {
      script1.onload = () => {
        script2.onload = () => {
          console.log('[RapportAG] jsPDF chargé');
          resolve();
        };
        document.head.appendChild(script2);
      };
      document.head.appendChild(script1);
    });
  }

  // Générer le rapport annuel complet
  async genererRapportAnnuel(annee) {
    // Attendre que jsPDF soit chargé si nécessaire
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
      await this.loadJsPDF();
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Page de couverture
    this.ajouterPageCouverture(doc, annee);

    // Page 2 : Résumé financier
    doc.addPage();
    this.ajouterResume(doc, annee);

    // Page 3 : Détail des recettes
    doc.addPage();
    this.ajouterRecettes(doc, annee);

    // Page 4 : Détail des dépenses
    doc.addPage();
    this.ajouterDepenses(doc, annee);

    // Page 5 : Adhésions
    doc.addPage();
    this.ajouterAdhesions(doc, annee);

    // Page 6 : Ludothèque
    doc.addPage();
    this.ajouterLudotheque(doc);

    // Page 7 : Événements
    doc.addPage();
    this.ajouterEvenements(doc, annee);

    // Numérotation des pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} / ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Télécharger le PDF
    doc.save(`GDJ_Rapport_Annuel_${annee}.pdf`);

    return true;
  }

  // Page de couverture
  ajouterPageCouverture(doc, annee) {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Fond coloré
    doc.setFillColor(26, 35, 46);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Titre principal
    doc.setTextColor(255, 215, 0);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('Les Gardiens du Jeu', pageWidth / 2, 60, { align: 'center' });

    // Sous-titre
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('Rapport Annuel', pageWidth / 2, 80, { align: 'center' });

    // Année
    doc.setFontSize(48);
    doc.setTextColor(255, 215, 0);
    doc.text(annee.toString(), pageWidth / 2, 120, { align: 'center' });

    // Date de génération
    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    const dateGeneration = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Généré le ${dateGeneration}`, pageWidth / 2, pageHeight - 40, { align: 'center' });

    // Logo ou icône (optionnel)
    doc.setFontSize(64);
    doc.text('🎲', pageWidth / 2, 160, { align: 'center' });
  }

  // Résumé financier
  ajouterResume(doc, annee) {
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Résumé Financier', 20, 20);

    const stats = this.calculerStatistiques(annee);

    // Tableau récapitulatif
    doc.autoTable({
      startY: 30,
      head: [['Catégorie', 'Montant (€)']],
      body: [
        ['💰 RECETTES', ''],
        ['   Ventes de produits', stats.recettes.ventes.toFixed(2)],
        ['   Cotisations', stats.recettes.cotisations.toFixed(2)],
        ['   Dons et subventions', stats.recettes.dons.toFixed(2)],
        ['TOTAL RECETTES', stats.recettes.total.toFixed(2)],
        ['', ''],
        ['💸 DÉPENSES', ''],
        ['   Réapprovisionnements', stats.depenses.reappros.toFixed(2)],
        ['   Achats divers', stats.depenses.achats.toFixed(2)],
        ['TOTAL DÉPENSES', stats.depenses.total.toFixed(2)],
        ['', ''],
        ['📈 RÉSULTAT', stats.resultat.toFixed(2)]
      ],
      theme: 'striped',
      headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0] },
      styles: { fontSize: 11 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' }
      }
    });

    // Indicateurs clés
    const finalY = doc.lastAutoTable.finalY + 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📌 Indicateurs Clés', 20, finalY);

    doc.autoTable({
      startY: finalY + 5,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Nombre de membres', stats.indicateurs.nbMembres],
        ['Nombre d\'adhésions', stats.indicateurs.nbAdhesions],
        ['Jeux dans la ludothèque', stats.indicateurs.nbJeux],
        ['Événements organisés', stats.indicateurs.nbEvenements],
        ['Transactions effectuées', stats.indicateurs.nbTransactions]
      ],
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219], textColor: [255, 255, 255] },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  // Détail des recettes
  ajouterRecettes(doc, annee) {
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('💰 Détail des Recettes', 20, 20);

    const transactions = this.getTransactionsAnnee(annee).filter(t => t.statut === 'payee');

    // Ventes par catégorie de produit
    const ventesParCategorie = {};

    transactions.forEach(t => {
      t.produits.forEach(p => {
        const produit = appData.produits.find(pr => pr.id === p.produitId);
        if (produit) {
          const categorie = produit.categorie || 'Autre';
          if (!ventesParCategorie[categorie]) {
            ventesParCategorie[categorie] = 0;
          }
          ventesParCategorie[categorie] += p.quantite * p.prix;
        }
      });
    });

    const ventesData = Object.keys(ventesParCategorie).map(cat => [
      cat,
      ventesParCategorie[cat].toFixed(2)
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Catégorie de produit', 'Montant (€)']],
      body: [
        ...ventesData,
        ['TOTAL VENTES', Object.values(ventesParCategorie).reduce((a, b) => a + b, 0).toFixed(2)]
      ],
      theme: 'striped',
      headStyles: { fillColor: [46, 204, 113] },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // Cotisations
    const adhesions = this.getAdhesionsAnnee(annee);
    const totalCotisations = adhesions.reduce((sum, a) => sum + a.montant, 0);

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.autoTable({
      startY: finalY,
      head: [['Type', 'Nombre', 'Montant (€)']],
      body: [
        ['Adhésions', adhesions.length, totalCotisations.toFixed(2)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  // Détail des dépenses
  ajouterDepenses(doc, annee) {
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('💸 Détail des Dépenses', 20, 20);

    const depenses = categoriesDepensesManager.getDepensesParCategorie(annee);

    const depensesData = [];

    Object.keys(depenses).forEach(catId => {
      const categorie = categoriesDepensesManager.getCategorie(catId);
      if (depenses[catId].total > 0) {
        depensesData.push([
          `${categorie.icon} ${categorie.nom}`,
          depenses[catId].total.toFixed(2)
        ]);

        // Ajouter les sous-catégories
        Object.keys(depenses[catId].sousCategories).forEach(sousCatId => {
          const montant = depenses[catId].sousCategories[sousCatId];
          if (montant > 0) {
            const sousCat = categorie.sousCat[sousCatId];
            depensesData.push([
              `    ${sousCat.icon} ${sousCat.nom}`,
              montant.toFixed(2)
            ]);
          }
        });
      }
    });

    const totalDepenses = Object.values(depenses).reduce((sum, cat) => sum + cat.total, 0);

    doc.autoTable({
      startY: 30,
      head: [['Catégorie', 'Montant (€)']],
      body: [
        ...depensesData,
        ['', ''],
        ['TOTAL DÉPENSES', totalDepenses.toFixed(2)]
      ],
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60] },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  // Adhésions
  ajouterAdhesions(doc, annee) {
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('👥 Adhésions', 20, 20);

    const adhesions = this.getAdhesionsAnnee(annee);

    // Évolution mensuelle
    const parMois = {};
    for (let i = 0; i < 12; i++) {
      parMois[i] = 0;
    }

    adhesions.forEach(a => {
      const mois = new Date(a.dateDebut).getMonth();
      parMois[mois]++;
    });

    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    const adhesionsData = Object.keys(parMois).map(m => [
      moisNoms[m],
      parMois[m],
      `${((parMois[m] / adhesions.length) * 100).toFixed(1)}%`
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Mois', 'Nombre', 'Proportion']],
      body: adhesionsData,
      theme: 'grid',
      headStyles: { fillColor: [155, 89, 182] },
      columnStyles: {
        1: { halign: 'center', fontStyle: 'bold' },
        2: { halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.text(`Total : ${adhesions.length} adhésions`, 20, finalY);
    doc.text(`Montant total : ${adhesions.reduce((sum, a) => sum + a.montant, 0).toFixed(2)} €`, 20, finalY + 10);
  }

  // Ludothèque
  ajouterLudotheque(doc) {
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('🎲 Ludothèque', 20, 20);

    const jeux = appData.ludotheque || [];

    // Statistiques
    const parProprietaire = {};

    jeux.forEach(j => {
      const proprio = j.proprietaire || 'Association';
      if (!parProprietaire[proprio]) {
        parProprietaire[proprio] = 0;
      }
      parProprietaire[proprio]++;
    });

    const statsData = Object.keys(parProprietaire).map(p => [
      p,
      parProprietaire[p]
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Propriétaire', 'Nombre de jeux']],
      body: [
        ...statsData,
        ['TOTAL', jeux.length]
      ],
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  // Événements
  ajouterEvenements(doc, annee) {
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('📅 Événements', 20, 20);

    const evenements = (appData.evenements || []).filter(e => {
      const date = new Date(e.date);
      return date.getFullYear() === annee;
    });

    // Par type
    const parType = {};

    evenements.forEach(e => {
      const type = e.type || 'Autre';
      if (!parType[type]) {
        parType[type] = { count: 0, participants: 0 };
      }
      parType[type].count++;
      parType[type].participants += (e.participants || []).length;
    });

    const eventsData = Object.keys(parType).map(type => [
      type,
      parType[type].count,
      parType[type].participants
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Type', 'Nombre', 'Participants']],
      body: [
        ...eventsData,
        ['TOTAL', evenements.length, Object.values(parType).reduce((s, t) => s + t.participants, 0)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [241, 196, 15] },
      columnStyles: {
        1: { halign: 'center', fontStyle: 'bold' },
        2: { halign: 'center', fontStyle: 'bold' }
      }
    });
  }

  // Calcul des statistiques
  calculerStatistiques(annee) {
    const transactions = this.getTransactionsAnnee(annee).filter(t => t.statut === 'payee');
    const adhesions = this.getAdhesionsAnnee(annee);
    const reappros = this.getReapprosAnnee(annee);
    const achats = this.getAchatsAnnee(annee);
    const fonds = this.getFondsAnnee(annee);

    // Recettes
    const ventes = transactions.reduce((sum, t) => sum + t.montant, 0);
    const cotisations = adhesions.reduce((sum, a) => sum + a.montant, 0);
    const dons = fonds.reduce((sum, f) => sum + f.montant, 0);

    const totalRecettes = ventes + cotisations + dons;

    // Dépenses
    const totalReappros = reappros.reduce((sum, r) => sum + r.cout_total, 0);
    const totalAchats = achats.reduce((sum, a) => sum + a.montant, 0);

    const totalDepenses = totalReappros + totalAchats;

    // Résultat
    const resultat = totalRecettes - totalDepenses;

    return {
      recettes: {
        ventes,
        cotisations,
        dons,
        total: totalRecettes
      },
      depenses: {
        reappros: totalReappros,
        achats: totalAchats,
        total: totalDepenses
      },
      resultat,
      indicateurs: {
        nbMembres: appData.membres ? appData.membres.length : 0,
        nbAdhesions: adhesions.length,
        nbJeux: appData.ludotheque ? appData.ludotheque.length : 0,
        nbEvenements: this.getEvenementsAnnee(annee).length,
        nbTransactions: transactions.length
      }
    };
  }

  // Helpers pour filtrer par année
  getTransactionsAnnee(annee) {
    return (appData.transactions || []).filter(t => new Date(t.date).getFullYear() === annee);
  }

  getAdhesionsAnnee(annee) {
    return (appData.adhesions || []).filter(a => new Date(a.dateDebut).getFullYear() === annee);
  }

  getReapprosAnnee(annee) {
    return (appData.reapprovisionnements || []).filter(r => new Date(r.date).getFullYear() === annee);
  }

  getAchatsAnnee(annee) {
    return (appData.achatsDivers || []).filter(a => new Date(a.date).getFullYear() === annee);
  }

  getFondsAnnee(annee) {
    return (appData.fonds || []).filter(f => new Date(f.date).getFullYear() === annee);
  }

  getEvenementsAnnee(annee) {
    return (appData.evenements || []).filter(e => new Date(e.date).getFullYear() === annee);
  }
}

// Instance globale
const rapportAGGenerator = new RapportAGGenerator();

// Fonction pour afficher le dialogue de génération
function afficherDialogueRapportAG() {
  const anneeActuelle = new Date().getFullYear();
  const anneesDisponibles = getAnneesDisponibles();

  const html = `
    <div style="max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ffd700; margin-bottom: 20px;">📊 Générer un Rapport pour l'AG</h2>

      <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #ffd700;">
        <p style="margin: 0; color: #e0e0e0;">
          Le rapport PDF comprendra :
        </p>
        <ul style="color: #e0e0e0; margin: 10px 0 0 20px;">
          <li>Résumé financier complet</li>
          <li>Détail des recettes et dépenses</li>
          <li>Statistiques d'adhésions</li>
          <li>État de la ludothèque</li>
          <li>Bilan des événements</li>
        </ul>
      </div>

      <div style="margin: 20px 0;">
        <label style="display: block; margin-bottom: 10px; color: #ffd700; font-weight: 600;">
          Sélectionnez l'année :
        </label>
        <select
          id="anneeRapportSelect"
          style="
            width: 100%;
            padding: 15px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            background: rgba(0, 0, 0, 0.3);
            color: #ffffff;
            border-radius: 8px;
            font-size: 16px;
          "
        >
          ${anneesDisponibles.map(annee => `
            <option value="${annee}" ${annee === anneeActuelle ? 'selected' : ''}>${annee}</option>
          `).join('')}
        </select>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 30px;">
        <button
          onclick="genererRapportAG()"
          style="
            flex: 1;
            background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            color: white;
            border: none;
            padding: 18px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 18px;
          "
        >
          📄 Générer le PDF
        </button>
        <button
          onclick="document.getElementById('rapportAGDialog').remove()"
          style="
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            padding: 18px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          "
        >
          ✕
        </button>
      </div>
    </div>
  `;

  const dialog = document.createElement('div');
  dialog.id = 'rapportAGDialog';
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
  `;

  dialog.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 15px;
      padding: 30px;
      max-width: 700px;
      width: 100%;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
    ">
      ${html}
    </div>
  `;

  document.body.appendChild(dialog);
}

// Générer le rapport
async function genererRapportAG() {
  const annee = parseInt(document.getElementById('anneeRapportSelect').value);

  try {
    showAlert('⏳ Génération du rapport en cours...', 'Génération');

    await rapportAGGenerator.genererRapportAnnuel(annee);

    document.getElementById('rapportAGDialog').remove();

    showAlert('✅ Rapport PDF généré avec succès !', 'Succès');

  } catch (error) {
    console.error('[RapportAG] Erreur:', error);
    showAlert('❌ Erreur lors de la génération du rapport : ' + error.message, 'Erreur');
  }
}
