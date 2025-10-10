// Interface des statistiques de dépenses par catégories

// Afficher les statistiques de dépenses détaillées
function afficherStatistiquesDepenses() {
  const anneeActuelle = new Date().getFullYear();
  const stats = categoriesDepensesManager.getStatistiques(anneeActuelle);

  const html = `
    <div style="max-width: 1200px; margin: 0 auto;">
      <h2 style="color: #ffd700; margin-bottom: 20px;">💰 Dépenses par catégorie (${anneeActuelle})</h2>

      <!-- Total -->
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        margin-bottom: 30px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
      ">
        <div style="font-size: 16px; color: rgba(255,255,255,0.8); margin-bottom: 10px;">
          Total des dépenses
        </div>
        <div style="font-size: 48px; font-weight: bold; color: white;">
          ${stats.totalDepenses.toFixed(2)} €
        </div>
      </div>

      <!-- Sélecteur d'année -->
      <div style="margin-bottom: 20px; text-align: center;">
        <select
          id="anneeStatsSelect"
          onchange="changerAnneeStats(this.value)"
          style="
            padding: 12px 20px;
            border-radius: 8px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            background: rgba(0, 0, 0, 0.3);
            color: #fff;
            font-size: 16px;
          "
        >
          ${getAnneesDisponibles().map(annee => `
            <option value="${annee}" ${annee === anneeActuelle ? 'selected' : ''}>
              ${annee}
            </option>
          `).join('')}
        </select>
      </div>

      ${stats.categories.length === 0 ? `
        <div style="text-align: center; padding: 60px; color: #888;">
          <p style="font-size: 48px; margin: 0;">📊</p>
          <p style="font-size: 18px; margin-top: 20px;">Aucune dépense pour cette année</p>
        </div>
      ` : `
        <!-- Catégories -->
        <div style="display: grid; gap: 20px;">
          ${stats.categories.map(cat => `
            <div style="
              background: rgba(255, 255, 255, 0.05);
              border-left: 5px solid ${cat.color};
              border-radius: 10px;
              padding: 25px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            ">
              <!-- En-tête de catégorie -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                  <h3 style="margin: 0 0 5px 0; color: ${cat.color}; font-size: 24px;">
                    ${cat.icon} ${cat.nom}
                  </h3>
                  <div style="color: #999; font-size: 14px;">
                    ${cat.pourcentage}% du total
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 32px; font-weight: bold; color: ${cat.color};">
                    ${cat.total.toFixed(2)} €
                  </div>
                </div>
              </div>

              <!-- Barre de progression -->
              <div style="
                background: rgba(0, 0, 0, 0.2);
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 20px;
              ">
                <div style="
                  background: ${cat.color};
                  height: 100%;
                  width: ${cat.pourcentage}%;
                  transition: width 0.5s;
                "></div>
              </div>

              <!-- Sous-catégories -->
              ${cat.sousCategories.length > 0 ? `
                <div style="
                  background: rgba(0, 0, 0, 0.2);
                  border-radius: 8px;
                  padding: 15px;
                ">
                  <div style="font-weight: bold; color: #e0e0e0; margin-bottom: 15px; font-size: 16px;">
                    📊 Détails par sous-catégorie
                  </div>

                  <div style="display: grid; gap: 10px;">
                    ${cat.sousCategories.map(sousCat => `
                      <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 6px;
                        border-left: 3px solid ${cat.color};
                      ">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <span style="font-size: 20px;">${sousCat.icon}</span>
                          <div>
                            <div style="color: #e0e0e0; font-weight: 500;">${sousCat.nom}</div>
                            <div style="color: #999; font-size: 12px;">${sousCat.pourcentage}% de la catégorie</div>
                          </div>
                        </div>
                        <div style="font-size: 18px; font-weight: bold; color: ${cat.color};">
                          ${sousCat.montant.toFixed(2)} €
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Graphique circulaire -->
        <div style="
          background: rgba(255, 255, 255, 0.05);
          border-radius: 15px;
          padding: 30px;
          margin-top: 30px;
        ">
          <h3 style="color: #ffd700; margin-bottom: 20px; text-align: center;">
            📊 Répartition des dépenses
          </h3>
          <canvas id="chartDepensesCategories" style="max-height: 400px;"></canvas>
        </div>
      `}
    </div>
  `;

  // Créer la boîte de dialogue
  const dialog = document.createElement('div');
  dialog.id = 'statsDepensesDialog';
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
      max-width: 1300px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
      position: relative;
    ">
      <button
        onclick="document.getElementById('statsDepensesDialog').remove()"
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

  // Créer le graphique si des données existent
  if (stats.categories.length > 0) {
    setTimeout(() => {
      creerGraphiqueDepenses(stats);
    }, 100);
  }
}

// Créer le graphique des dépenses par catégorie
function creerGraphiqueDepenses(stats) {
  const canvas = document.getElementById('chartDepensesCategories');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const data = {
    labels: stats.categories.map(c => c.nom),
    datasets: [{
      data: stats.categories.map(c => c.total),
      backgroundColor: stats.categories.map(c => c.color),
      borderWidth: 2,
      borderColor: '#1a1a2e'
    }]
  };

  new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#e0e0e0',
            font: { size: 14 },
            generateLabels: (chart) => {
              const data = chart.data;
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);

                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              return `${label}: ${value.toFixed(2)} €`;
            }
          }
        }
      }
    }
  });
}

// Changer l'année des statistiques
function changerAnneeStats(annee) {
  document.getElementById('statsDepensesDialog').remove();
  setTimeout(() => {
    afficherStatistiquesDepenses();
  }, 100);
}

// Obtenir les années disponibles
function getAnneesDisponibles() {
  const annees = new Set();

  appData.reapprovisionnements.forEach(r => {
    const annee = new Date(r.date).getFullYear();
    annees.add(annee);
  });

  appData.achatsDivers.forEach(a => {
    const annee = new Date(a.date).getFullYear();
    annees.add(annee);
  });

  // Ajouter l'année actuelle si pas de données
  if (annees.size === 0) {
    annees.add(new Date().getFullYear());
  }

  return Array.from(annees).sort((a, b) => b - a);
}

// Créer un sélecteur de catégorie/sous-catégorie pour les formulaires
function creerSelecteurCategorie(categorieSelectionnee = null, sousCategorieSelectionnee = null) {
  const categories = categoriesDepensesManager.getCategories();

  let html = `
    <div style="display: grid; gap: 15px; margin: 15px 0;">
      <!-- Catégorie principale -->
      <div>
        <label style="display: block; margin-bottom: 5px; color: #ffd700; font-weight: 600;">
          Catégorie :
        </label>
        <select
          id="categorieDepenseSelect"
          onchange="updateSousCategoriesSelect()"
          required
          style="
            width: 100%;
            padding: 12px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            background: rgba(0, 0, 0, 0.3);
            color: #ffffff;
            border-radius: 8px;
            font-size: 16px;
          "
        >
          <option value="">-- Sélectionner une catégorie --</option>
          ${Object.keys(categories).map(catId => {
            const cat = categories[catId];
            return `<option value="${catId}" ${categorieSelectionnee === catId ? 'selected' : ''}>
              ${cat.icon} ${cat.nom}
            </option>`;
          }).join('')}
        </select>
      </div>

      <!-- Sous-catégorie -->
      <div id="sousCategorieContainer" style="${categorieSelectionnee ? '' : 'display: none;'}">
        <label style="display: block; margin-bottom: 5px; color: #ffd700; font-weight: 600;">
          Sous-catégorie :
        </label>
        <select
          id="sousCategorieDepenseSelect"
          required
          style="
            width: 100%;
            padding: 12px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            background: rgba(0, 0, 0, 0.3);
            color: #ffffff;
            border-radius: 8px;
            font-size: 16px;
          "
        >
          <!-- Sera rempli dynamiquement -->
        </select>
      </div>
    </div>
  `;

  // Mise à jour des sous-catégories
  window.updateSousCategoriesSelect = function() {
    const categorieId = document.getElementById('categorieDepenseSelect').value;
    const sousCatContainer = document.getElementById('sousCategorieContainer');
    const sousCatSelect = document.getElementById('sousCategorieDepenseSelect');

    if (!categorieId) {
      sousCatContainer.style.display = 'none';
      return;
    }

    const sousCategories = categoriesDepensesManager.getSousCategories(categorieId);

    sousCatSelect.innerHTML = Object.keys(sousCategories).map(sousCatId => {
      const sousCat = sousCategories[sousCatId];
      return `<option value="${sousCatId}">
        ${sousCat.icon} ${sousCat.nom}
      </option>`;
    }).join('');

    sousCatContainer.style.display = 'block';
  };

  // Initialiser les sous-catégories si une catégorie est présélectionnée
  if (categorieSelectionnee) {
    setTimeout(() => {
      const sousCatSelect = document.getElementById('sousCategorieDepenseSelect');
      if (sousCatSelect && sousCategorieSelectionnee) {
        sousCatSelect.value = sousCategorieSelectionnee;
      }
    }, 50);
  }

  return html;
}
