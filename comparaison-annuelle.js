// Comparaison annuelle - Graphiques et statistiques année N vs N-1

class ComparaisonAnnuelle {
  constructor() {
    this.anneeActuelle = new Date().getFullYear();
    this.anneePrecedente = this.anneeActuelle - 1;
  }

  // Obtenir les données comparatives
  getDonneesComparatives(anneeN, anneeN1) {
    const statsN = this.getStatistiquesAnnee(anneeN);
    const statsN1 = this.getStatistiquesAnnee(anneeN1);

    return {
      anneeN: { annee: anneeN, ...statsN },
      anneeN1: { annee: anneeN1, ...statsN1 },
      evolution: this.calculerEvolution(statsN, statsN1)
    };
  }

  // Obtenir les statistiques d'une année
  getStatistiquesAnnee(annee) {
    // Recettes
    const transactions = this.getTransactionsAnnee(annee).filter(t => t.statut === 'payee');
    const ventes = transactions.reduce((sum, t) => sum + t.montant, 0);

    const adhesions = this.getAdhesionsAnnee(annee);
    const cotisations = adhesions.reduce((sum, a) => sum + a.montant, 0);

    const fonds = this.getFondsAnnee(annee);
    const dons = fonds.reduce((sum, f) => sum + f.montant, 0);

    const totalRecettes = ventes + cotisations + dons;

    // Dépenses
    const reappros = this.getReapprosAnnee(annee);
    const totalReappros = reappros.reduce((sum, r) => sum + r.cout_total, 0);

    const achats = this.getAchatsAnnee(annee);
    const totalAchats = achats.reduce((sum, a) => sum + a.montant, 0);

    const totalDepenses = totalReappros + totalAchats;

    // Résultat
    const resultat = totalRecettes - totalDepenses;

    // Indicateurs d'activité
    const evenements = this.getEvenementsAnnee(annee);
    const nbParticipantsTotal = evenements.reduce((sum, e) => {
      return sum + (e.participants ? e.participants.length : 0);
    }, 0);

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
      activite: {
        nbMembres: this.getNbMembresActifsAnnee(annee),
        nbAdhesions: adhesions.length,
        nbTransactions: transactions.length,
        nbEvenements: evenements.length,
        nbParticipantsEvenements: nbParticipantsTotal,
        moyenneParticipants: evenements.length > 0 ? nbParticipantsTotal / evenements.length : 0
      },
      mensuel: this.getStatistiquesMensuelles(annee)
    };
  }

  // Calculer l'évolution entre deux années
  calculerEvolution(statsN, statsN1) {
    const evolution = {};

    const calculerPourcentage = (valN, valN1) => {
      if (valN1 === 0) return valN > 0 ? 100 : 0;
      return ((valN - valN1) / valN1) * 100;
    };

    // Recettes
    evolution.recettes = {
      ventes: calculerPourcentage(statsN.recettes.ventes, statsN1.recettes.ventes),
      cotisations: calculerPourcentage(statsN.recettes.cotisations, statsN1.recettes.cotisations),
      dons: calculerPourcentage(statsN.recettes.dons, statsN1.recettes.dons),
      total: calculerPourcentage(statsN.recettes.total, statsN1.recettes.total)
    };

    // Dépenses
    evolution.depenses = {
      reappros: calculerPourcentage(statsN.depenses.reappros, statsN1.depenses.reappros),
      achats: calculerPourcentage(statsN.depenses.achats, statsN1.depenses.achats),
      total: calculerPourcentage(statsN.depenses.total, statsN1.depenses.total)
    };

    // Résultat
    evolution.resultat = calculerPourcentage(statsN.resultat, statsN1.resultat);

    // Activité
    evolution.activite = {
      nbMembres: calculerPourcentage(statsN.activite.nbMembres, statsN1.activite.nbMembres),
      nbAdhesions: calculerPourcentage(statsN.activite.nbAdhesions, statsN1.activite.nbAdhesions),
      nbTransactions: calculerPourcentage(statsN.activite.nbTransactions, statsN1.activite.nbTransactions),
      nbEvenements: calculerPourcentage(statsN.activite.nbEvenements, statsN1.activite.nbEvenements)
    };

    return evolution;
  }

  // Obtenir les statistiques mensuelles
  getStatistiquesMensuelles(annee) {
    const mois = Array.from({ length: 12 }, (_, i) => ({
      mois: i,
      ventes: 0,
      depenses: 0,
      adhesions: 0,
      evenements: 0
    }));

    // Ventes
    const transactions = this.getTransactionsAnnee(annee).filter(t => t.statut === 'payee');
    transactions.forEach(t => {
      const m = new Date(t.date).getMonth();
      mois[m].ventes += t.montant;
    });

    // Dépenses
    const reappros = this.getReapprosAnnee(annee);
    reappros.forEach(r => {
      const m = new Date(r.date).getMonth();
      mois[m].depenses += r.cout_total;
    });

    const achats = this.getAchatsAnnee(annee);
    achats.forEach(a => {
      const m = new Date(a.date).getMonth();
      mois[m].depenses += a.montant;
    });

    // Adhésions
    const adhesions = this.getAdhesionsAnnee(annee);
    adhesions.forEach(a => {
      const m = new Date(a.dateDebut).getMonth();
      mois[m].adhesions++;
    });

    // Événements
    const evenements = this.getEvenementsAnnee(annee);
    evenements.forEach(e => {
      const m = new Date(e.date).getMonth();
      mois[m].evenements++;
    });

    return mois;
  }

  // Helpers
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

  getNbMembresActifsAnnee(annee) {
    // Membres ayant fait une transaction ou ayant adhéré cette année
    const transactions = this.getTransactionsAnnee(annee);
    const adhesions = this.getAdhesionsAnnee(annee);

    const membresActifs = new Set();

    transactions.forEach(t => membresActifs.add(t.membreId));
    adhesions.forEach(a => membresActifs.add(a.membreId));

    return membresActifs.size;
  }
}

// Instance globale
const comparaisonAnnuelle = new ComparaisonAnnuelle();

// Afficher le dialogue de comparaison annuelle
function afficherComparaisonAnnuelle() {
  const anneeActuelle = new Date().getFullYear();
  const anneePrecedente = anneeActuelle - 1;

  const donnees = comparaisonAnnuelle.getDonneesComparatives(anneeActuelle, anneePrecedente);

  const html = `
    <div style="max-width: 1400px; margin: 0 auto;">
      <h2 style="color: #ffd700; margin-bottom: 20px;">
        📊 Comparaison ${anneePrecedente} vs ${anneeActuelle}
      </h2>

      <!-- Résumé global -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
        ${creerCarteStat('💰 Recettes totales', donnees.anneeN.recettes.total, donnees.anneeN1.recettes.total, donnees.evolution.recettes.total, true)}
        ${creerCarteStat('💸 Dépenses totales', donnees.anneeN.depenses.total, donnees.anneeN1.depenses.total, donnees.evolution.depenses.total, false)}
        ${creerCarteStat('📈 Résultat', donnees.anneeN.resultat, donnees.anneeN1.resultat, donnees.evolution.resultat, true)}
        ${creerCarteStat('👥 Adhésions', donnees.anneeN.activite.nbAdhesions, donnees.anneeN1.activite.nbAdhesions, donnees.evolution.activite.nbAdhesions, true, false)}
      </div>

      <!-- Graphiques comparatifs -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <!-- Recettes vs Dépenses -->
        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 15px; padding: 25px;">
          <h3 style="color: #ffd700; margin-bottom: 15px; text-align: center;">💰 Recettes vs Dépenses</h3>
          <canvas id="chartRecettesDepenses"></canvas>
        </div>

        <!-- Évolution mensuelle -->
        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 15px; padding: 25px;">
          <h3 style="color: #ffd700; margin-bottom: 15px; text-align: center;">📅 Évolution mensuelle ${anneeActuelle}</h3>
          <canvas id="chartEvolutionMensuelle"></canvas>
        </div>
      </div>

      <!-- Détails des évolutions -->
      <div style="background: rgba(255, 255, 255, 0.05); border-radius: 15px; padding: 25px; margin-bottom: 20px;">
        <h3 style="color: #ffd700; margin-bottom: 20px;">📋 Détails des évolutions</h3>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
          <!-- Finances -->
          <div>
            <h4 style="color: #3498db; margin-bottom: 15px;">💵 Finances</h4>
            ${creerLigneEvolution('Ventes produits', donnees.anneeN.recettes.ventes, donnees.anneeN1.recettes.ventes, donnees.evolution.recettes.ventes)}
            ${creerLigneEvolution('Cotisations', donnees.anneeN.recettes.cotisations, donnees.anneeN1.recettes.cotisations, donnees.evolution.recettes.cotisations)}
            ${creerLigneEvolution('Dons & subventions', donnees.anneeN.recettes.dons, donnees.anneeN1.recettes.dons, donnees.evolution.recettes.dons)}
            <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">
            ${creerLigneEvolution('Réapprovisionnements', donnees.anneeN.depenses.reappros, donnees.anneeN1.depenses.reappros, donnees.evolution.depenses.reappros, false)}
            ${creerLigneEvolution('Achats divers', donnees.anneeN.depenses.achats, donnees.anneeN1.depenses.achats, donnees.evolution.depenses.achats, false)}
          </div>

          <!-- Activité -->
          <div>
            <h4 style="color: #9b59b6; margin-bottom: 15px;">📊 Activité</h4>
            ${creerLigneEvolution('Membres actifs', donnees.anneeN.activite.nbMembres, donnees.anneeN1.activite.nbMembres, donnees.evolution.activite.nbMembres, true, false)}
            ${creerLigneEvolution('Adhésions', donnees.anneeN.activite.nbAdhesions, donnees.anneeN1.activite.nbAdhesions, donnees.evolution.activite.nbAdhesions, true, false)}
            ${creerLigneEvolution('Transactions', donnees.anneeN.activite.nbTransactions, donnees.anneeN1.activite.nbTransactions, donnees.evolution.activite.nbTransactions, true, false)}
            ${creerLigneEvolution('Événements', donnees.anneeN.activite.nbEvenements, donnees.anneeN1.activite.nbEvenements, donnees.evolution.activite.nbEvenements, true, false)}
            ${creerLigneEvolution('Moy. participants/événement', donnees.anneeN.activite.moyenneParticipants.toFixed(1), donnees.anneeN1.activite.moyenneParticipants.toFixed(1), null, true, false)}
          </div>
        </div>
      </div>
    </div>
  `;

  const dialog = document.createElement('div');
  dialog.id = 'comparaisonDialog';
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
      max-width: 1500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
      position: relative;
    ">
      <button
        onclick="document.getElementById('comparaisonDialog').remove()"
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

  // Créer les graphiques
  setTimeout(() => {
    creerGraphiquesComparaison(donnees);
  }, 100);
}

// Créer une carte de statistique
function creerCarteStat(titre, valeurN, valeurN1, evolution, positifEstBon = true, estMontant = true) {
  const diff = valeurN - valeurN1;
  const symbole = estMontant ? ' €' : '';
  const couleur = positifEstBon
    ? (evolution >= 0 ? '#2ecc71' : '#e74c3c')
    : (evolution <= 0 ? '#2ecc71' : '#e74c3c');

  return `
    <div style="
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 20px;
      border-left: 4px solid ${couleur};
    ">
      <div style="font-size: 12px; color: #999; margin-bottom: 8px;">${titre}</div>
      <div style="font-size: 28px; font-weight: bold; color: #ffd700; margin-bottom: 5px;">
        ${estMontant ? valeurN.toFixed(2) : valeurN}${symbole}
      </div>
      <div style="font-size: 14px; color: #e0e0e0; margin-bottom: 10px;">
        ${estMontant ? valeurN1.toFixed(2) : valeurN1}${symbole} en ${new Date().getFullYear() - 1}
      </div>
      <div style="font-size: 16px; font-weight: bold; color: ${couleur};">
        ${evolution >= 0 ? '▲' : '▼'} ${Math.abs(evolution).toFixed(1)}%
        <span style="font-size: 12px; color: #999; margin-left: 5px;">
          (${diff >= 0 ? '+' : ''}${estMontant ? diff.toFixed(2) : diff}${symbole})
        </span>
      </div>
    </div>
  `;
}

// Créer une ligne d'évolution
function creerLigneEvolution(label, valeurN, valeurN1, evolution, positifEstBon = true, estMontant = true) {
  const symbole = estMontant ? ' €' : '';
  const hasDiff = evolution !== null && evolution !== undefined;
  const couleur = hasDiff
    ? (positifEstBon
      ? (evolution >= 0 ? '#2ecc71' : '#e74c3c')
      : (evolution <= 0 ? '#2ecc71' : '#e74c3c'))
    : '#999';

  return `
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
    ">
      <div>
        <div style="color: #e0e0e0; font-weight: 500;">${label}</div>
        <div style="color: #999; font-size: 12px;">
          ${estMontant ? valeurN1.toFixed(2) : valeurN1}${symbole} → ${estMontant ? valeurN.toFixed(2) : valeurN}${symbole}
        </div>
      </div>
      ${hasDiff ? `
        <div style="font-size: 16px; font-weight: bold; color: ${couleur};">
          ${evolution >= 0 ? '▲' : '▼'} ${Math.abs(evolution).toFixed(1)}%
        </div>
      ` : ''}
    </div>
  `;
}

// Créer les graphiques de comparaison
function creerGraphiquesComparaison(donnees) {
  const anneeN = donnees.anneeN.annee;
  const anneeN1 = donnees.anneeN1.annee;

  // Graphique Recettes vs Dépenses
  const ctx1 = document.getElementById('chartRecettesDepenses');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['Recettes', 'Dépenses', 'Résultat'],
        datasets: [
          {
            label: anneeN1,
            data: [
              donnees.anneeN1.recettes.total,
              donnees.anneeN1.depenses.total,
              donnees.anneeN1.resultat
            ],
            backgroundColor: 'rgba(149, 165, 166, 0.7)',
            borderColor: 'rgba(149, 165, 166, 1)',
            borderWidth: 2
          },
          {
            label: anneeN,
            data: [
              donnees.anneeN.recettes.total,
              donnees.anneeN.depenses.total,
              donnees.anneeN.resultat
            ],
            backgroundColor: 'rgba(52, 152, 219, 0.7)',
            borderColor: 'rgba(52, 152, 219, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#e0e0e0' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          x: {
            ticks: { color: '#e0e0e0' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        },
        plugins: {
          legend: {
            labels: { color: '#e0e0e0', font: { size: 14 } }
          }
        }
      }
    });
  }

  // Graphique évolution mensuelle
  const ctx2 = document.getElementById('chartEvolutionMensuelle');
  if (ctx2) {
    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    new Chart(ctx2, {
      type: 'line',
      data: {
        labels: moisNoms,
        datasets: [
          {
            label: 'Ventes',
            data: donnees.anneeN.mensuel.map(m => m.ventes),
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Dépenses',
            data: donnees.anneeN.mensuel.map(m => m.depenses),
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#e0e0e0' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          x: {
            ticks: { color: '#e0e0e0' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        },
        plugins: {
          legend: {
            labels: { color: '#e0e0e0', font: { size: 14 } }
          }
        }
      }
    });
  }
}
