// ===== DASHBOARD ET EXPORTS =====

// Charger toutes les stats et graphiques
function loadStats() {
    loadBasicStats();
    loadCaisseDetails();
    loadFluxFinanciers();
    loadTransactionsTable();
    loadReapprosTable();
    loadAchatsDiversTable();
    loadFondsTable();
    loadCharts();
}

// Stats de base
function loadBasicStats() {
    const totalMembres = appData.membres.length;
    const now = new Date();
    const thisMonth = appData.transactions.filter(t => {
        const d = new Date(t.date_transaction);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const ca = thisMonth.reduce((sum, t) => sum + t.montant_total, 0);
    const ardoisesTotales = appData.membres.reduce((sum, m) => sum + m.ardoise, 0);

    document.getElementById('statTotalMembres').textContent = totalMembres;
    document.getElementById('statTransactionsMois').textContent = thisMonth.length;
    document.getElementById('statCA').textContent = ca.toFixed(2) + ' €';
    document.getElementById('statArdoises').textContent = ardoisesTotales.toFixed(2) + ' €';
}

// Détails de la caisse
function loadCaisseDetails() {
    // Caisse réelle = transactions payées (espèces + paypal)
    const caisseReelle = appData.transactions
        .filter(t => t.statut === 'payee' && t.mode_paiement !== 'ardoise')
        .reduce((sum, t) => sum + t.montant_total, 0);

    // Ardoises = transactions en attente
    const caisseArdoise = appData.transactions
        .filter(t => t.statut === 'en_attente')
        .reduce((sum, t) => sum + t.montant_total, 0);

    // Total cotisations
    const totalCotisations = appData.adhesions
        .reduce((sum, a) => sum + a.montant, 0);

    // Total fonds ajoutés
    if (!appData.fonds) appData.fonds = [];
    const totalFonds = appData.fonds.reduce((sum, f) => sum + f.montant, 0);

    // Total dépenses (réappros + achats divers)
    if (!appData.reapprovisionnements) appData.reapprovisionnements = [];
    if (!appData.achatsDivers) appData.achatsDivers = [];
    const totalReappros = appData.reapprovisionnements.reduce((sum, r) => sum + r.cout_total, 0);
    const totalAchatsDivers = appData.achatsDivers.reduce((sum, a) => sum + a.montant, 0);

    // Caisse totale = entrées - sorties
    const caisseTotal = caisseReelle + totalCotisations + totalFonds - totalReappros - totalAchatsDivers;

    document.getElementById('caisseReelle').textContent = caisseReelle.toFixed(2) + ' €';
    document.getElementById('caisseArdoise').textContent = caisseArdoise.toFixed(2) + ' €';
    document.getElementById('totalCotisations').textContent = totalCotisations.toFixed(2) + ' €';
    document.getElementById('caisseTotal').textContent = caisseTotal.toFixed(2) + ' €';
}

// Récapitulatif des flux financiers pour l'année en cours
function loadFluxFinanciers() {
    const currentYear = new Date().getFullYear();

    // Entrées
    const totalVentes = appData.transactions
        .filter(t => {
            const d = new Date(t.date_transaction);
            return t.statut === 'payee' && d.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.montant_total, 0);

    const totalCotisationsAnnee = appData.adhesions
        .filter(a => {
            const d = new Date(a.date_debut);
            return d.getFullYear() === currentYear;
        })
        .reduce((sum, a) => sum + a.montant, 0);

    if (!appData.fonds) appData.fonds = [];
    const totalFondsAnnee = appData.fonds
        .filter(f => {
            const d = new Date(f.date);
            return d.getFullYear() === currentYear;
        })
        .reduce((sum, f) => sum + f.montant, 0);

    const totalEntrees = totalVentes + totalCotisationsAnnee + totalFondsAnnee;

    // Sorties
    if (!appData.reapprovisionnements) appData.reapprovisionnements = [];
    const totalReapprosAnnee = appData.reapprovisionnements
        .filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === currentYear;
        })
        .reduce((sum, r) => sum + r.cout_total, 0);

    if (!appData.achatsDivers) appData.achatsDivers = [];
    const totalAchatsDiversAnnee = appData.achatsDivers
        .filter(a => {
            const d = new Date(a.date);
            return d.getFullYear() === currentYear;
        })
        .reduce((sum, a) => sum + a.montant, 0);

    const totalSorties = totalReapprosAnnee + totalAchatsDiversAnnee;

    // Bilan
    const bilan = totalEntrees - totalSorties;

    // Mise à jour de l'affichage
    document.getElementById('totalVentes').textContent = totalVentes.toFixed(2) + ' €';
    document.getElementById('totalCotisationsAnnee').textContent = totalCotisationsAnnee.toFixed(2) + ' €';
    document.getElementById('totalFondsAnnee').textContent = totalFondsAnnee.toFixed(2) + ' €';
    document.getElementById('totalEntrees').textContent = totalEntrees.toFixed(2) + ' €';

    document.getElementById('totalReapprosAnnee').textContent = totalReapprosAnnee.toFixed(2) + ' €';
    document.getElementById('totalAchatsDiversAnnee').textContent = totalAchatsDiversAnnee.toFixed(2) + ' €';
    document.getElementById('totalSorties').textContent = totalSorties.toFixed(2) + ' €';

    const bilanEl = document.getElementById('bilanAnnee');
    bilanEl.textContent = bilan.toFixed(2) + ' €';
    // Couleur selon le bilan
    if (bilan > 0) {
        bilanEl.style.color = '#2ecc71';
    } else if (bilan < 0) {
        bilanEl.style.color = '#e74c3c';
    } else {
        bilanEl.style.color = '#9b59b6';
    }
}

// Table des transactions
function loadTransactionsTable(filter = 'mois') {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    let filteredTransactions = filterTransactionsByPeriod(appData.transactions, filter);

    // Trier par date décroissante
    filteredTransactions.sort((a, b) => new Date(b.date_transaction) - new Date(a.date_transaction));

    filteredTransactions.forEach(t => {
        const membre = appData.membres.find(m => m.id === t.membre_id);
        const produits = t.produits.map(p => `${p.nom} (x${p.quantite})`).join(', ');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(t.date_transaction).toLocaleString()}</td>
            <td>${membre ? membre.prenom + ' ' + membre.nom : 'Inconnu'}</td>
            <td>${produits}</td>
            <td>${t.montant_total.toFixed(2)} €</td>
            <td>${t.mode_paiement}</td>
            <td>
                <span class="badge ${t.statut === 'payee' ? 'success' : 'warning'}">
                    ${t.statut === 'payee' ? 'Payé' : 'En attente'}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filtrer les transactions par période
function filterTransactionsByPeriod(transactions, period) {
    const now = new Date();

    switch(period) {
        case 'jour':
            return transactions.filter(t => {
                const d = new Date(t.date_transaction);
                return d.toDateString() === now.toDateString();
            });
        case 'semaine':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transactions.filter(t => new Date(t.date_transaction) >= weekAgo);
        case 'mois':
            return transactions.filter(t => {
                const d = new Date(t.date_transaction);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        case 'tout':
        default:
            return transactions;
    }
}

// Table des réapprovisionnements
function loadReapprosTable() {
    const tbody = document.getElementById('reapprosTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // S'assurer que reapprovisionnements existe
    if (!appData.reapprovisionnements) appData.reapprovisionnements = [];

    if (appData.reapprovisionnements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#e0e0e0;">Aucun réapprovisionnement enregistré</td></tr>';
        return;
    }

    // Trier par date décroissante
    const sorted = [...appData.reapprovisionnements].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    sorted.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(r.date).toLocaleString()}</td>
            <td>${r.produit_nom}</td>
            <td>${r.quantite}</td>
            <td>${r.cout_unitaire.toFixed(2)} €</td>
            <td>${r.cout_total.toFixed(2)} €</td>
            <td>${r.note || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Ajouter un réapprovisionnement
async function ajouterReapprovisionnement() {
    // S'assurer que reapprovisionnements existe
    if (!appData.reapprovisionnements) appData.reapprovisionnements = [];
    if (!appData.settings.lastReapproId) appData.settings.lastReapproId = 0;

    if (appData.produits.length === 0) {
        await alert('Aucun produit disponible. Créez d\'abord des produits.');
        return;
    }

    // Sélectionner le produit
    const produitId = parseInt(await prompt('ID du produit à réapprovisionner:\n' +
        appData.produits.map(p => `${p.id}: ${p.nom}`).join('\n')));

    const produit = appData.produits.find(p => p.id === produitId);
    if (!produit) {
        await alert('Produit introuvable');
        return;
    }

    const quantite = parseInt(await prompt('Quantité à ajouter:'));
    if (!quantite || quantite <= 0) return;

    const coutUnitaire = parseFloat(await prompt('Coût du pack (€):', '14.92'));
    if (coutUnitaire === null) return;

    const note = await prompt('Note (optionnel):') || '';

    const reappro = {
        id: ++appData.settings.lastReapproId,
        produit_id: produitId,
        produit_nom: produit.nom,
        quantite: quantite,
        cout_unitaire: coutUnitaire,
        cout_total: coutUnitaire,
        note: note,
        date: new Date().toISOString(),
        auteur_id: currentUser.id
    };

    // Mettre à jour le stock
    produit.stock += quantite;

    appData.reapprovisionnements.push(reappro);
    saveLocalData();
    syncWithGitHub();
    loadReapprosTable();
    loadProducts();
    await alert('Réapprovisionnement enregistré !');
}

// Table des achats divers
function loadAchatsDiversTable() {
    const tbody = document.getElementById('achatsDiversTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // S'assurer que achatsDivers existe
    if (!appData.achatsDivers) appData.achatsDivers = [];

    if (appData.achatsDivers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#e0e0e0;">Aucun achat enregistré</td></tr>';
        return;
    }

    // Trier par date décroissante
    const sorted = [...appData.achatsDivers].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    sorted.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(a.date).toLocaleString()}</td>
            <td>${a.article}</td>
            <td>${a.montant.toFixed(2)} €</td>
            <td>${a.note || '-'}</td>
            <td>
                <button class="btn-danger" onclick="supprimerAchatDivers(${a.id})">Supprimer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Ajouter un achat divers
async function ajouterAchatDivers() {
    // S'assurer que achatsDivers existe
    if (!appData.achatsDivers) appData.achatsDivers = [];
    if (!appData.settings.lastAchatDiversId) appData.settings.lastAchatDiversId = 0;

    const article = await prompt('Nom de l\'article (ex: Armoire, Console, Jeux de société, etc.):');
    if (!article) return;

    const montant = parseFloat(await prompt('Montant (€):'));
    if (!montant || montant <= 0) return;

    const note = await prompt('Note (optionnel):') || '';

    const achat = {
        id: ++appData.settings.lastAchatDiversId,
        article: article,
        montant: montant,
        note: note,
        date: new Date().toISOString(),
        auteur_id: currentUser.id
    };

    appData.achatsDivers.push(achat);
    saveLocalData();
    syncWithGitHub();
    loadAchatsDiversTable();
    loadCaisseDetails();
    loadCharts(); // Recharger le graphique de caisse
    await alert('Achat enregistré !');
}

// Supprimer un achat divers
async function supprimerAchatDivers(id) {
    if (!await confirm('Supprimer cet achat ?')) return;

    appData.achatsDivers = appData.achatsDivers.filter(a => a.id !== id);
    saveLocalData();
    syncWithGitHub();
    loadAchatsDiversTable();
    loadCaisseDetails();
    loadCharts();
    await alert('Achat supprimé !');
}

// Table des fonds ajoutés
function loadFondsTable() {
    const tbody = document.getElementById('fondsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // S'assurer que fonds existe
    if (!appData.fonds) appData.fonds = [];

    if (appData.fonds.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#e0e0e0;">Aucun fond ajouté</td></tr>';
        return;
    }

    // Trier par date décroissante
    const sorted = [...appData.fonds].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    sorted.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(f.date).toLocaleString()}</td>
            <td>${f.montant.toFixed(2)} €</td>
            <td>${f.provenance}</td>
            <td>${f.note || '-'}</td>
            <td>
                <button class="btn-danger" onclick="supprimerFonds(${f.id})">Supprimer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Ajouter des fonds
async function ajouterFonds() {
    // S'assurer que fonds existe
    if (!appData.fonds) appData.fonds = [];
    if (!appData.settings.lastFondsId) appData.settings.lastFondsId = 0;

    const montant = parseFloat(await prompt('Montant ajouté (€):'));
    if (!montant || montant <= 0) return;

    const provenance = await prompt('Provenance (ex: Don anonyme, Subvention mairie, Vente de gâteaux, etc.):');
    if (!provenance) return;

    const note = await prompt('Note (optionnel):') || '';

    const fonds = {
        id: ++appData.settings.lastFondsId,
        montant: montant,
        provenance: provenance,
        note: note,
        date: new Date().toISOString(),
        auteur_id: currentUser.id
    };

    appData.fonds.push(fonds);
    saveLocalData();
    syncWithGitHub();
    loadFondsTable();
    loadCaisseDetails();
    loadCharts(); // Recharger le graphique de caisse
    await alert('Fonds ajoutés !');
}

// Supprimer des fonds
async function supprimerFonds(id) {
    if (!await confirm('Supprimer cette entrée de fonds ?')) return;

    appData.fonds = appData.fonds.filter(f => f.id !== id);
    saveLocalData();
    syncWithGitHub();
    loadFondsTable();
    loadCaisseDetails();
    loadCharts();
    await alert('Fonds supprimés !');
}

// Charger les graphiques
let chartCategories = null;
let chartPaiements = null;
let chartAdhesions = null;
let chartCaisse = null;

function loadCharts() {
    createCategoriesChart();
    createPaiementsChart();
    createAdhesionsChart();
    createCaisseChart();
}

function createCategoriesChart() {
    const ctx = document.getElementById('chartCategories');
    if (!ctx) return;

    // Calculer les ventes par catégorie
    const ventesParCategorie = {};
    appData.transactions.forEach(t => {
        t.produits.forEach(p => {
            const produit = appData.produits.find(prod => prod.nom === p.nom);
            if (produit) {
                const cat = produit.categorie;
                if (!ventesParCategorie[cat]) ventesParCategorie[cat] = 0;
                ventesParCategorie[cat] += p.prix_unitaire * p.quantite;
            }
        });
    });

    const labels = Object.keys(ventesParCategorie);
    const data = Object.values(ventesParCategorie);

    if (chartCategories) chartCategories.destroy();

    chartCategories = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventes (€)',
                data: data,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(243, 156, 18, 0.8)',
                    'rgba(52, 152, 219, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function createPaiementsChart() {
    const ctx = document.getElementById('chartPaiements');
    if (!ctx) return;

    // Calculer par mode de paiement
    const paiements = {};
    appData.transactions.forEach(t => {
        const mode = t.mode_paiement;
        if (!paiements[mode]) paiements[mode] = 0;
        paiements[mode] += t.montant_total;
    });

    const labels = Object.keys(paiements);
    const data = Object.values(paiements);

    if (chartPaiements) chartPaiements.destroy();

    chartPaiements = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(243, 156, 18, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createAdhesionsChart() {
    const ctx = document.getElementById('chartAdhesions');
    if (!ctx) return;

    // Calculer les adhésions par mois pour l'année en cours
    const currentYear = new Date().getFullYear();
    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const adhesionsParMois = new Array(12).fill(0);

    appData.adhesions.forEach(a => {
        const dateDebut = new Date(a.date_debut);
        if (dateDebut.getFullYear() === currentYear) {
            const mois = dateDebut.getMonth();
            adhesionsParMois[mois]++;
        }
    });

    if (chartAdhesions) chartAdhesions.destroy();

    chartAdhesions = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: moisLabels,
            datasets: [{
                label: 'Nouvelles adhésions',
                data: adhesionsParMois,
                backgroundColor: 'rgba(155, 89, 182, 0.8)',
                borderColor: 'rgba(155, 89, 182, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createCaisseChart() {
    const ctx = document.getElementById('chartCaisse');
    if (!ctx) return;

    // Calculer l'évolution de la caisse par mois pour l'année en cours
    const currentYear = new Date().getFullYear();
    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const gainsParMois = new Array(12).fill(0);
    const pertesParMois = new Array(12).fill(0);

    // Gains: transactions payées + cotisations + fonds ajoutés
    appData.transactions.forEach(t => {
        if (t.statut === 'payee') {
            const date = new Date(t.date_transaction);
            if (date.getFullYear() === currentYear) {
                const mois = date.getMonth();
                gainsParMois[mois] += t.montant_total;
            }
        }
    });

    appData.adhesions.forEach(a => {
        const date = new Date(a.date_debut);
        if (date.getFullYear() === currentYear) {
            const mois = date.getMonth();
            gainsParMois[mois] += a.montant;
        }
    });

    // Fonds ajoutés
    if (appData.fonds) {
        appData.fonds.forEach(f => {
            const date = new Date(f.date);
            if (date.getFullYear() === currentYear) {
                const mois = date.getMonth();
                gainsParMois[mois] += f.montant;
            }
        });
    }

    // Pertes: réapprovisionnements + achats divers
    if (appData.reapprovisionnements) {
        appData.reapprovisionnements.forEach(r => {
            const date = new Date(r.date);
            if (date.getFullYear() === currentYear) {
                const mois = date.getMonth();
                pertesParMois[mois] += r.cout_total;
            }
        });
    }

    if (appData.achatsDivers) {
        appData.achatsDivers.forEach(a => {
            const date = new Date(a.date);
            if (date.getFullYear() === currentYear) {
                const mois = date.getMonth();
                pertesParMois[mois] += a.montant;
            }
        });
    }

    if (chartCaisse) chartCaisse.destroy();

    chartCaisse = new Chart(ctx, {
        type: 'line',
        data: {
            labels: moisLabels,
            datasets: [
                {
                    label: 'Gains',
                    data: gainsParMois,
                    borderColor: 'rgba(46, 204, 113, 1)',
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Dépenses',
                    data: pertesParMois,
                    borderColor: 'rgba(231, 76, 60, 1)',
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// ===== EXPORTS =====

function exportTransactions() {
    if (appData.transactions.length === 0) {
        alert('Aucune transaction à exporter');
        return;
    }

    let csv = 'Date,Membre,Produits,Montant,Mode de paiement,Statut\n';

    appData.transactions.forEach(t => {
        const membre = appData.membres.find(m => m.id === t.membre_id);
        const produits = t.produits.map(p => `${p.nom} (x${p.quantite})`).join(' - ');

        csv += `"${new Date(t.date_transaction).toLocaleString()}",`;
        csv += `"${membre ? membre.prenom + ' ' + membre.nom : 'Inconnu'}",`;
        csv += `"${produits}",`;
        csv += `"${t.montant_total.toFixed(2)}",`;
        csv += `"${t.mode_paiement}",`;
        csv += `"${t.statut}"\n`;
    });

    downloadCSV(csv, 'transactions.csv');
}

function exportAdhesions() {
    if (appData.adhesions.length === 0) {
        alert('Aucune adhésion à exporter');
        return;
    }

    let csv = 'Membre,Email,Année,Montant,Date début,Date fin,Mode paiement\n';

    appData.adhesions.forEach(a => {
        const membre = appData.membres.find(m => m.id === a.membre_id);
        const modePaiement = a.mode_paiement === 'especes' ? 'Espèces' :
                            a.mode_paiement === 'paypal' ? 'PayPal' :
                            a.mode_paiement === 'autre' && a.mode_paiement_autre ? a.mode_paiement_autre :
                            'Autre';
        csv += `"${membre ? membre.prenom + ' ' + membre.nom : 'Inconnu'}",`;
        csv += `"${membre ? membre.email : '-'}",`;
        csv += `"${a.annee}",`;
        csv += `"${a.montant.toFixed(2)}",`;
        csv += `"${new Date(a.date_debut).toLocaleDateString()}",`;
        csv += `"${new Date(a.date_fin).toLocaleDateString()}",`;
        csv += `"${modePaiement}"\n`;
    });

    downloadCSV(csv, 'adhesions.csv');
}

function exportReappros() {
    // S'assurer que reapprovisionnements existe
    if (!appData.reapprovisionnements) appData.reapprovisionnements = [];

    if (appData.reapprovisionnements.length === 0) {
        alert('Aucun réapprovisionnement à exporter');
        return;
    }

    let csv = 'Date,Produit,Quantité,Coût unitaire,Coût total,Note\n';

    appData.reapprovisionnements.forEach(r => {
        csv += `"${new Date(r.date).toLocaleString()}",`;
        csv += `"${r.produit_nom}",`;
        csv += `"${r.quantite}",`;
        csv += `"${r.cout_unitaire.toFixed(2)}",`;
        csv += `"${r.cout_total.toFixed(2)}",`;
        csv += `"${r.note || '-'}"\n`;
    });

    downloadCSV(csv, 'reapprovisionnements.csv');
}

function exportAchatsDivers() {
    if (!appData.achatsDivers) appData.achatsDivers = [];

    if (appData.achatsDivers.length === 0) {
        alert('Aucun achat divers à exporter');
        return;
    }

    let csv = 'Date,Article,Montant,Note\n';

    appData.achatsDivers.forEach(a => {
        csv += `"${new Date(a.date).toLocaleString()}",`;
        csv += `"${a.article}",`;
        csv += `"${a.montant.toFixed(2)}",`;
        csv += `"${a.note || '-'}"\n`;
    });

    downloadCSV(csv, 'achats_divers.csv');
}

function exportFonds() {
    if (!appData.fonds) appData.fonds = [];

    if (appData.fonds.length === 0) {
        alert('Aucun fonds à exporter');
        return;
    }

    let csv = 'Date,Montant,Provenance,Note\n';

    appData.fonds.forEach(f => {
        csv += `"${new Date(f.date).toLocaleString()}",`;
        csv += `"${f.montant.toFixed(2)}",`;
        csv += `"${f.provenance}",`;
        csv += `"${f.note || '-'}"\n`;
    });

    downloadCSV(csv, 'fonds_ajoutes.csv');
}

function exportComplet() {
    const now = new Date();
    const filename = `export_complet_${now.getFullYear()}_${now.getMonth()+1}_${now.getDate()}.csv`;

    let csv = '--- RAPPORT COMPLET LES GARDIENS DU JEU ---\n';
    csv += `Généré le: ${now.toLocaleString()}\n\n`;

    // Caisse
    const caisseReelle = appData.transactions
        .filter(t => t.statut === 'payee' && t.mode_paiement !== 'ardoise')
        .reduce((sum, t) => sum + t.montant_total, 0);
    const caisseArdoise = appData.transactions
        .filter(t => t.statut === 'en_attente')
        .reduce((sum, t) => sum + t.montant_total, 0);
    const totalCotisations = appData.adhesions.reduce((sum, a) => sum + a.montant, 0);

    if (!appData.fonds) appData.fonds = [];
    const totalFonds = appData.fonds.reduce((sum, f) => sum + f.montant, 0);

    if (!appData.reapprovisionnements) appData.reapprovisionnements = [];
    if (!appData.achatsDivers) appData.achatsDivers = [];
    const totalReappros = appData.reapprovisionnements.reduce((sum, r) => sum + r.cout_total, 0);
    const totalAchatsDivers = appData.achatsDivers.reduce((sum, a) => sum + a.montant, 0);

    csv += '--- CAISSE ---\n';
    csv += `Caisse réelle (payé):,${caisseReelle.toFixed(2)} €\n`;
    csv += `Ardoises (en attente):,${caisseArdoise.toFixed(2)} €\n`;
    csv += `Cotisations:,${totalCotisations.toFixed(2)} €\n`;
    csv += `Fonds ajoutés (dons/subventions):,${totalFonds.toFixed(2)} €\n`;
    csv += `Réapprovisionnements:,-${totalReappros.toFixed(2)} €\n`;
    csv += `Achats divers:,-${totalAchatsDivers.toFixed(2)} €\n`;
    csv += `Total:,${(caisseReelle + totalCotisations + totalFonds - totalReappros - totalAchatsDivers).toFixed(2)} €\n\n`;

    // Membres
    csv += '--- MEMBRES ---\n';
    csv += `Total membres:,${appData.membres.filter(m => !m.supprime).length}\n`;
    csv += `Membres avec ardoise:,${appData.membres.filter(m => !m.supprime && m.ardoise > 0).length}\n\n`;

    // Adhésions
    csv += '--- ADHÉSIONS ---\n';
    csv += 'Membre,Email,Année,Montant,Date début,Date fin,Mode paiement\n';
    appData.adhesions.forEach(a => {
        const membre = appData.membres.find(m => m.id === a.membre_id);
        const modePaiement = a.mode_paiement === 'especes' ? 'Espèces' :
                            a.mode_paiement === 'paypal' ? 'PayPal' :
                            a.mode_paiement === 'autre' && a.mode_paiement_autre ? a.mode_paiement_autre :
                            'Autre';
        csv += `"${membre ? membre.prenom + ' ' + membre.nom : 'Inconnu'}",`;
        csv += `"${membre ? membre.email : '-'}",`;
        csv += `"${a.annee}",`;
        csv += `"${a.montant.toFixed(2)} €",`;
        csv += `"${new Date(a.date_debut).toLocaleDateString()}",`;
        csv += `"${new Date(a.date_fin).toLocaleDateString()}",`;
        csv += `"${modePaiement}"\n`;
    });
    csv += '\n';

    // Transactions
    csv += '--- TRANSACTIONS ---\n';
    csv += 'Date,Membre,Produits,Montant,Mode de paiement,Statut\n';
    appData.transactions.forEach(t => {
        const membre = appData.membres.find(m => m.id === t.membre_id);
        const produits = t.produits.map(p => `${p.nom} (x${p.quantite})`).join(' - ');
        csv += `"${new Date(t.date_transaction).toLocaleString()}","${membre ? membre.prenom + ' ' + membre.nom : 'Inconnu'}","${produits}","${t.montant_total.toFixed(2)}","${t.mode_paiement}","${t.statut}"\n`;
    });
    csv += '\n';

    // Réapprovisionnements
    csv += '--- RÉAPPROVISIONNEMENTS ---\n';
    csv += 'Date,Produit,Quantité,Coût unitaire,Coût total,Note\n';
    appData.reapprovisionnements.forEach(r => {
        csv += `"${new Date(r.date).toLocaleString()}",`;
        csv += `"${r.produit_nom}",`;
        csv += `"${r.quantite}",`;
        csv += `"${r.cout_unitaire.toFixed(2)} €",`;
        csv += `"${r.cout_total.toFixed(2)} €",`;
        csv += `"${r.note || '-'}"\n`;
    });
    csv += '\n';

    // Achats divers
    csv += '--- ACHATS DIVERS ---\n';
    csv += 'Date,Article,Montant,Note\n';
    appData.achatsDivers.forEach(a => {
        csv += `"${new Date(a.date).toLocaleString()}",`;
        csv += `"${a.article}",`;
        csv += `"${a.montant.toFixed(2)} €",`;
        csv += `"${a.note || '-'}"\n`;
    });
    csv += '\n';

    // Fonds ajoutés
    csv += '--- FONDS AJOUTÉS ---\n';
    csv += 'Date,Montant,Provenance,Note\n';
    appData.fonds.forEach(f => {
        csv += `"${new Date(f.date).toLocaleString()}",`;
        csv += `"${f.montant.toFixed(2)} €",`;
        csv += `"${f.provenance}",`;
        csv += `"${f.note || '-'}"\n`;
    });
    csv += '\n';

    // Produits
    csv += '--- PRODUITS (STOCK ACTUEL) ---\n';
    csv += 'Nom,Catégorie,Prix,Stock\n';
    appData.produits.forEach(p => {
        csv += `"${p.nom}","${p.categorie}","${p.prix.toFixed(2)} €","${p.stock}"\n`;
    });
    csv += '\n';

    // Ludothèque
    if (appData.ludotheque && appData.ludotheque.length > 0) {
        csv += '--- LUDOTHÈQUE ---\n';
        csv += 'Nom,Propriétaire,Min joueurs,Max joueurs,Durée (min),Âge minimum,Description\n';
        appData.ludotheque.forEach(j => {
            csv += `"${j.nom}","${j.proprietaire}","${j.min_joueurs}","${j.max_joueurs}","${j.duree}","${j.age}","${j.description || '-'}"\n`;
        });
        csv += '\n';
    }

    // Événements
    if (appData.evenements && appData.evenements.length > 0) {
        csv += '--- ÉVÉNEMENTS ---\n';
        csv += 'Titre,Date,Description,Nombre de participants\n';
        appData.evenements.forEach(e => {
            const nbParticipants = e.participants ? e.participants.length : 0;
            csv += `"${e.titre}","${new Date(e.date).toLocaleString()}","${e.description || '-'}","${nbParticipants}"\n`;
        });
        csv += '\n';
    }

    downloadCSV(csv, filename);
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event listener pour le filtre de période
if (document.getElementById('filterPeriod')) {
    document.getElementById('filterPeriod').addEventListener('change', (e) => {
        loadTransactionsTable(e.target.value);
    });
}
