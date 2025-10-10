// Gestionnaire des extensions de jeux

class ExtensionsManager {
  constructor() {
    this.init();
  }

  init() {
    console.log('[Extensions] Gestionnaire initialisé');
  }

  // Marquer un jeu comme extension et l'associer à un jeu de base
  marquerCommeExtension(jeuId, jeuDeBaseId) {
    const jeu = appData.ludotheque.find(j => j.id === jeuId);
    const jeuDeBase = appData.ludotheque.find(j => j.id === jeuDeBaseId);

    if (!jeu) {
      throw new Error('Jeu non trouvé');
    }

    if (!jeuDeBase) {
      throw new Error('Jeu de base non trouvé');
    }

    // Empêcher une extension d'être jeu de base d'une autre extension
    if (jeuDeBase.est_extension) {
      throw new Error('Impossible d\'associer une extension à une autre extension. Choisissez le jeu de base principal.');
    }

    jeu.est_extension = true;
    jeu.jeu_de_base = jeuDeBaseId;

    saveLocalData();
    syncWithGitHub();

    console.log(`[Extensions] ${jeu.nom} marqué comme extension de ${jeuDeBase.nom}`);

    return true;
  }

  // Retirer le statut d'extension
  retirerStatutExtension(jeuId) {
    const jeu = appData.ludotheque.find(j => j.id === jeuId);

    if (!jeu) {
      throw new Error('Jeu non trouvé');
    }

    jeu.est_extension = false;
    jeu.jeu_de_base = null;

    saveLocalData();
    syncWithGitHub();

    console.log(`[Extensions] ${jeu.nom} n'est plus une extension`);

    return true;
  }

  // Obtenir toutes les extensions d'un jeu de base
  getExtensions(jeuDeBaseId) {
    return appData.ludotheque.filter(j => j.est_extension && j.jeu_de_base === jeuDeBaseId);
  }

  // Obtenir tous les jeux de base (qui ont des extensions)
  getJeuxAvecExtensions() {
    const jeuxAvecExtensions = [];

    appData.ludotheque.forEach(jeu => {
      if (!jeu.est_extension) {
        const extensions = this.getExtensions(jeu.id);
        if (extensions.length > 0) {
          jeuxAvecExtensions.push({
            jeu,
            extensions
          });
        }
      }
    });

    return jeuxAvecExtensions;
  }

  // Obtenir tous les jeux qui peuvent être jeux de base (non-extensions)
  getJeuxDeBasePossibles() {
    return appData.ludotheque.filter(j => !j.est_extension);
  }

  // Vérifier si un jeu a des extensions
  hasExtensions(jeuId) {
    return this.getExtensions(jeuId).length > 0;
  }

  // Obtenir le jeu de base d'une extension
  getJeuDeBase(extensionId) {
    const extension = appData.ludotheque.find(j => j.id === extensionId);

    if (!extension || !extension.est_extension || !extension.jeu_de_base) {
      return null;
    }

    return appData.ludotheque.find(j => j.id === extension.jeu_de_base);
  }
}

// Instance globale
const extensionsManager = new ExtensionsManager();

// ===== CALCUL DES DONNÉES JEU + EXTENSIONS =====

// Calculer les données d'un jeu en tenant compte de ses extensions
function getGameDataWithExtensions(game) {
    // Vérifications de sécurité
    if (!game) {
        return {
            min_joueurs: 0,
            max_joueurs: 0,
            duree: 0,
            age_min: 0,
            extensionsCount: 0
        };
    }

    // Si appData n'est pas encore chargé, retourner les données du jeu
    if (!appData || !appData.ludotheque) {
        return {
            min_joueurs: game.min_joueurs || 0,
            max_joueurs: game.max_joueurs || 0,
            duree: game.duree || 0,
            age_min: game.age_min || 0,
            extensionsCount: 0
        };
    }

    // Récupérer toutes les extensions de ce jeu
    const extensions = appData.ludotheque.filter(g => g.jeu_de_base === game.id);

    if (extensions.length === 0) {
        // Pas d'extensions, retourner les données d'origine
        return {
            min_joueurs: game.min_joueurs,
            max_joueurs: game.max_joueurs,
            duree: game.duree,
            age_min: game.age_min,
            extensionsCount: 0
        };
    }

    // Calculer les min/max en incluant toutes les extensions
    const allGames = [game, ...extensions];

    const minJoueurs = Math.min(...allGames.map(g => g.min_joueurs || 0));
    const maxJoueurs = Math.max(...allGames.map(g => g.max_joueurs || 0));
    const dureeMax = Math.max(...allGames.map(g => g.duree || 0)); // Prendre la durée max (les extensions englobent le jeu de base)
    const ageMin = Math.min(...allGames.map(g => g.age_min || 0));

    return {
        min_joueurs: minJoueurs,
        max_joueurs: maxJoueurs,
        duree: dureeMax,
        age_min: ageMin,
        extensionsCount: extensions.length
    };
}

// ===== INTERFACE UTILISATEUR =====

// Ouvrir la fenêtre de gestion des extensions pour un jeu
async function gererExtensions(jeuId) {
    const jeu = appData.ludotheque.find(g => g.id === jeuId);
    if (!jeu) return;

    // Récupérer les extensions déjà rattachées
    const extensions = appData.ludotheque.filter(g => g.jeu_de_base === jeuId);

    // Récupérer les jeux qui ne sont pas encore des extensions (ou extensions d'autres jeux)
    let jeuxDisponibles = appData.ludotheque.filter(g =>
        g.id !== jeuId && // Pas le jeu lui-même
        !g.jeu_de_base    // Pas déjà une extension d'un autre jeu
    );

    // Trier les jeux : d'abord ceux qui ressemblent au jeu de base (extensions potentielles)
    const jeuNomLower = jeu.nom.toLowerCase();
    const motsCles = jeuNomLower.split(/[\s:]+/).filter(m => m.length > 3); // Mots de plus de 3 lettres

    jeuxDisponibles.sort((a, b) => {
        const aNomLower = a.nom.toLowerCase();
        const bNomLower = b.nom.toLowerCase();

        // Vérifier si le nom contient le nom complet du jeu de base
        const aContientNomComplet = aNomLower.includes(jeuNomLower);
        const bContientNomComplet = bNomLower.includes(jeuNomLower);

        if (aContientNomComplet && !bContientNomComplet) return -1;
        if (!aContientNomComplet && bContientNomComplet) return 1;

        // Vérifier si le nom contient des mots-clés du jeu de base
        const aScore = motsCles.filter(mot => aNomLower.includes(mot)).length;
        const bScore = motsCles.filter(mot => bNomLower.includes(mot)).length;

        if (aScore !== bScore) return bScore - aScore;

        // Sinon, tri alphabétique
        return a.nom.localeCompare(b.nom);
    });

    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog active';
    dialog.innerHTML = `
        <div class="dialog-box" style="max-width: 700px; max-height: 90vh; display: flex; flex-direction: column;">
            <div class="dialog-title" style="flex-shrink: 0;">🧩 Extensions - ${jeu.nom}</div>

            <div class="dialog-message" style="flex-grow: 1; overflow-y: auto; padding: 20px 0;">
                <!-- Liste des extensions déjà rattachées -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #ffd700; margin-bottom: 15px; font-size: 16px;">
                        📋 Extensions rattachées (${extensions.length})
                    </h3>
                    <div id="extensionsList" style="max-height: 200px; overflow-y: auto;">
                        ${extensions.length === 0
                            ? '<p style="text-align:center;color:#999;padding:20px;font-style:italic;">Aucune extension rattachée</p>'
                            : extensions.map(ext => `
                                <div style="
                                    background: rgba(255, 215, 0, 0.1);
                                    border: 1px solid rgba(255, 215, 0, 0.3);
                                    border-radius: 8px;
                                    padding: 12px;
                                    margin-bottom: 10px;
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                ">
                                    <div>
                                        <div style="font-weight: bold; color: #ffd700;">${ext.nom}</div>
                                        <div style="font-size: 12px; color: #a0a0a0; margin-top: 4px;">
                                            👥 ${ext.min_joueurs}-${ext.max_joueurs} | ⏱️ ${ext.duree} min | 🎯 ${ext.age_min}+
                                        </div>
                                    </div>
                                    <button
                                        class="btn-danger"
                                        onclick="detacherExtension(${ext.id})"
                                        style="padding: 8px 15px; font-size: 13px;"
                                    >
                                        🔗 Détacher
                                    </button>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>

                <!-- Ajouter une extension -->
                <div>
                    <h3 style="color: #ffd700; margin-bottom: 15px; font-size: 16px;">
                        ➕ Rattacher une nouvelle extension
                    </h3>

                    <!-- Bouton pour rechercher sur BGG -->
                    <div style="margin-bottom: 20px; text-align: center;">
                        <button
                            class="btn-primary"
                            onclick="event.stopPropagation(); ajouterExtensionDepuisBGG(${jeuId})"
                            style="padding: 12px 24px; font-size: 15px;"
                        >
                            🌐 Rechercher une extension sur BoardGameGeek
                        </button>
                    </div>

                    ${jeuxDisponibles.length === 0
                        ? '<p style="text-align:center;color:#999;padding:20px;font-style:italic;">Aucun jeu disponible pour être rattaché comme extension</p>'
                        : `
                            <div style="margin-bottom: 15px;">
                                <input
                                    type="text"
                                    id="searchExtension"
                                    placeholder="🔍 Rechercher un jeu..."
                                    style="
                                        width: 100%;
                                        padding: 12px;
                                        border: 2px solid rgba(255, 215, 0, 0.3);
                                        background: rgba(0, 0, 0, 0.3);
                                        color: #ffffff;
                                        border-radius: 8px;
                                        font-size: 14px;
                                    "
                                    oninput="filtrerJeuxDisponibles()"
                                />
                            </div>

                            <div id="jeuxDisponiblesList" style="max-height: 250px; overflow-y: auto;">
                                ${jeuxDisponibles.map(g => {
                                    // Vérifier si c'est une extension potentielle
                                    const gNomLower = g.nom.toLowerCase();
                                    const estPotentiel = gNomLower.includes(jeuNomLower) ||
                                                        motsCles.some(mot => gNomLower.includes(mot));

                                    const bgColor = estPotentiel ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255, 255, 255, 0.05)';
                                    const borderColor = estPotentiel ? 'rgba(46, 204, 113, 0.4)' : 'rgba(255, 255, 255, 0.1)';
                                    const badge = estPotentiel ? '<span style="background: #2ecc71; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 8px;">SUGGÉRÉ</span>' : '';

                                    return `
                                    <div
                                        class="jeu-disponible-item"
                                        data-nom="${gNomLower}"
                                        style="
                                            background: ${bgColor};
                                            border: 1px solid ${borderColor};
                                            border-radius: 8px;
                                            padding: 12px;
                                            margin-bottom: 10px;
                                            display: flex;
                                            justify-content: space-between;
                                            align-items: center;
                                            transition: all 0.2s;
                                            cursor: pointer;
                                        "
                                        onmouseover="this.style.background='rgba(255, 215, 0, 0.1)'; this.style.borderColor='rgba(255, 215, 0, 0.3)'"
                                        onmouseout="this.style.background='${bgColor}'; this.style.borderColor='${borderColor}'"
                                    >
                                        <div style="flex-grow: 1;">
                                            <div style="font-weight: bold; color: #fff; display: flex; align-items: center; gap: 8px;">
                                                ${badge}
                                                <span>${g.nom}</span>
                                            </div>
                                            <div style="font-size: 12px; color: #a0a0a0; margin-top: 4px;">
                                                👥 ${g.min_joueurs}-${g.max_joueurs} | ⏱️ ${g.duree} min | 🎯 ${g.age_min}+ | Proprio: ${g.proprietaire}
                                            </div>
                                        </div>
                                        <button
                                            class="btn-primary"
                                            onclick="event.stopPropagation(); attacherExtension(${jeuId}, ${g.id})"
                                            style="padding: 8px 15px; font-size: 13px;"
                                        >
                                            🔗 Rattacher
                                        </button>
                                    </div>
                                `;
                                }).join('')}
                            </div>
                        `
                    }
                </div>
            </div>

            <div class="dialog-buttons" style="flex-shrink: 0;">
                <button class="btn-primary" onclick="this.closest('.custom-dialog').remove()">Fermer</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);
}

// Filtrer les jeux disponibles par recherche
function filtrerJeuxDisponibles() {
    const searchTerm = document.getElementById('searchExtension').value.toLowerCase();
    const items = document.querySelectorAll('.jeu-disponible-item');

    items.forEach(item => {
        const nom = item.dataset.nom;
        if (nom.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Rattacher une extension à un jeu de base
async function attacherExtension(jeuBaseId, extensionId) {
    const jeuBase = appData.ludotheque.find(g => g.id === jeuBaseId);
    const extension = appData.ludotheque.find(g => g.id === extensionId);

    if (!jeuBase || !extension) return;

    // Vérifier si ce n'est pas déjà une extension
    if (extension.jeu_de_base) {
        await showAlert('Ce jeu est déjà une extension d\'un autre jeu !');
        return;
    }

    // Confirmer
    const confirme = await showConfirm(
        `Voulez-vous rattacher "${extension.nom}" comme extension de "${jeuBase.nom}" ?`,
        'Rattacher une extension'
    );

    if (!confirme) return;

    // Marquer comme extension
    extension.est_extension = true;
    extension.jeu_de_base = jeuBaseId;

    saveLocalData();
    await syncWithGitHub();

    await showAlert(`✅ "${extension.nom}" est maintenant une extension de "${jeuBase.nom}"`);

    // Fermer la fenêtre et rafraîchir
    document.querySelector('.custom-dialog')?.remove();

    // Rafraîchir l'affichage
    if (typeof loadLudotheque === 'function') {
        loadLudotheque(currentSearchLudo, currentDureeFilter);
    }
    if (typeof loadLudothequeMembre === 'function') {
        loadLudothequeMembre(currentSearchLudoMembre, currentDureeFilterMembre, currentMembreFilterLudo);
    }
}

// Détacher une extension
async function detacherExtension(extensionId) {
    const extension = appData.ludotheque.find(g => g.id === extensionId);
    if (!extension) return;

    const jeuBase = appData.ludotheque.find(g => g.id === extension.jeu_de_base);
    const jeuBaseNom = jeuBase ? jeuBase.nom : 'jeu de base';

    const confirme = await showConfirm(
        `Voulez-vous détacher "${extension.nom}" de "${jeuBaseNom}" ?`,
        'Détacher une extension'
    );

    if (!confirme) return;

    // Retirer le lien
    extension.est_extension = false;
    extension.jeu_de_base = null;

    saveLocalData();
    await syncWithGitHub();

    await showAlert(`✅ "${extension.nom}" n'est plus une extension`);

    // Fermer la fenêtre et rafraîchir
    document.querySelector('.custom-dialog')?.remove();

    // Rafraîchir l'affichage
    if (typeof loadLudotheque === 'function') {
        loadLudotheque(currentSearchLudo, currentDureeFilter);
    }
    if (typeof loadLudothequeMembre === 'function') {
        loadLudothequeMembre(currentSearchLudoMembre, currentDureeFilterMembre, currentMembreFilterLudo);
    }
}

// ANCIENNES FONCTIONS (conservées pour compatibilité)

// Afficher la boîte de dialogue pour marquer un jeu comme extension
function afficherDialogueExtension(jeuId) {
  const jeu = appData.ludotheque.find(j => j.id === jeuId);

  if (!jeu) {
    customAlert('Jeu non trouvé', 'error');
    return;
  }

  // Si c'est déjà une extension, proposer de retirer le statut
  if (jeu.estExtension) {
    const jeuDeBase = extensionsManager.getJeuDeBase(jeuId);
    const jeuDeBaseNom = jeuDeBase ? jeuDeBase.nom : 'Inconnu';

    customConfirm(
      `"${jeu.nom}" est actuellement marqué comme extension de "${jeuDeBaseNom}".\n\nVoulez-vous retirer ce statut ?`,
      () => {
        try {
          extensionsManager.retirerStatutExtension(jeuId);
          customAlert('✅ Le jeu n\'est plus une extension', 'success');

          // Rafraîchir l'affichage
          if (typeof afficherLudotheque === 'function') {
            afficherLudotheque();
          }
        } catch (error) {
          customAlert('❌ Erreur : ' + error.message, 'error');
        }
      }
    );

    return;
  }

  // Sinon, proposer de le marquer comme extension
  const jeuxDeBasePossibles = extensionsManager.getJeuxDeBasePossibles().filter(j => j.id !== jeuId);

  if (jeuxDeBasePossibles.length === 0) {
    customAlert('Aucun jeu de base disponible dans la ludothèque', 'warning');
    return;
  }

  const html = `
    <div style="max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ffd700; margin-bottom: 20px;">📦 Marquer comme extension</h2>

      <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #ffd700;">
        <p style="margin: 0; color: #e0e0e0;">
          <strong>Jeu :</strong> ${jeu.nom}
        </p>
      </div>

      <p style="color: #e0e0e0; margin-bottom: 15px;">
        Sélectionnez le jeu de base auquel cette extension est liée :
      </p>

      <select id="jeuDeBaseSelect" style="
        width: 100%;
        padding: 15px;
        border: 2px solid rgba(255, 215, 0, 0.3);
        background: rgba(0, 0, 0, 0.3);
        color: #ffffff;
        border-radius: 8px;
        font-size: 16px;
        margin-bottom: 20px;
      ">
        <option value="">-- Sélectionner un jeu de base --</option>
        ${jeuxDeBasePossibles.map(j => `
          <option value="${j.id}">${j.nom}${j.proprietaire ? ` (${j.proprietaire})` : ''}</option>
        `).join('')}
      </select>

      <div style="display: flex; gap: 10px;">
        <button
          onclick="validerExtension(${jeuId})"
          style="
            flex: 1;
            background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
          "
        >
          ✅ Valider
        </button>
        <button
          onclick="document.getElementById('extensionDialog').remove()"
          style="
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
          "
        >
          ❌ Annuler
        </button>
      </div>
    </div>
  `;

  // Créer la boîte de dialogue
  const dialog = document.createElement('div');
  dialog.id = 'extensionDialog';
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

// Valider la création d'une extension
function validerExtension(jeuId) {
  const jeuDeBaseId = parseInt(document.getElementById('jeuDeBaseSelect').value);

  if (!jeuDeBaseId) {
    customAlert('Veuillez sélectionner un jeu de base', 'warning');
    return;
  }

  try {
    extensionsManager.marquerCommeExtension(jeuId, jeuDeBaseId);

    const jeu = appData.ludotheque.find(j => j.id === jeuId);
    const jeuDeBase = appData.ludotheque.find(j => j.id === jeuDeBaseId);

    customAlert(`✅ "${jeu.nom}" est maintenant une extension de "${jeuDeBase.nom}"`, 'success');

    // Fermer la boîte de dialogue
    document.getElementById('extensionDialog').remove();

    // Rafraîchir l'affichage
    if (typeof afficherLudotheque === 'function') {
      afficherLudotheque();
    }

  } catch (error) {
    customAlert('❌ Erreur : ' + error.message, 'error');
  }
}

// Afficher la vue des jeux avec leurs extensions
function afficherJeuxAvecExtensions() {
  const jeuxAvecExtensions = extensionsManager.getJeuxAvecExtensions();

  if (jeuxAvecExtensions.length === 0) {
    customAlert('Aucun jeu avec extensions dans la ludothèque', 'info');
    return;
  }

  const html = `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2 style="color: #ffd700; margin-bottom: 20px;">🎲 Jeux et leurs extensions</h2>

      <p style="color: #e0e0e0; margin-bottom: 20px;">
        ${jeuxAvecExtensions.length} jeu(x) avec extensions
      </p>

      <div style="display: grid; gap: 20px;">
        ${jeuxAvecExtensions.map(({ jeu, extensions }) => `
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 215, 0, 0.3);
            border-radius: 10px;
            padding: 20px;
          ">
            <!-- Jeu de base -->
            <div style="margin-bottom: 15px;">
              <h3 style="color: #ffd700; margin: 0 0 10px 0;">
                🎲 ${jeu.nom}
              </h3>
              <div style="color: #999; font-size: 14px;">
                ${jeu.proprietaire || 'Association'} • ${jeu.minJoueurs}-${jeu.maxJoueurs} joueurs • ${jeu.duree} min
              </div>
            </div>

            <!-- Extensions -->
            <div style="
              background: rgba(0, 0, 0, 0.2);
              border-left: 3px solid #3498db;
              padding: 15px;
              border-radius: 5px;
            ">
              <div style="font-weight: bold; color: #3498db; margin-bottom: 10px;">
                📦 Extensions (${extensions.length})
              </div>
              ${extensions.map(ext => `
                <div style="
                  padding: 10px;
                  margin-bottom: 8px;
                  background: rgba(52, 152, 219, 0.1);
                  border-radius: 5px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                ">
                  <div>
                    <div style="color: #e0e0e0; font-weight: 500;">${ext.nom}</div>
                    <div style="color: #999; font-size: 12px;">${ext.proprietaire || 'Association'}</div>
                  </div>
                  <button
                    onclick="afficherDialogueExtension(${ext.id})"
                    style="
                      background: rgba(231, 76, 60, 0.2);
                      border: 1px solid #e74c3c;
                      color: #e74c3c;
                      padding: 6px 12px;
                      border-radius: 5px;
                      cursor: pointer;
                      font-size: 12px;
                    "
                  >
                    🔗 Délier
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <button
          onclick="document.getElementById('extensionsViewDialog').remove()"
          style="
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          "
        >
          Fermer
        </button>
      </div>
    </div>
  `;

  // Créer la boîte de dialogue
  const dialog = document.createElement('div');
  dialog.id = 'extensionsViewDialog';
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
      max-width: 1100px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
    ">
      ${html}
    </div>
  `;

  document.body.appendChild(dialog);
}

// ===== RECHERCHE ET AJOUT D'EXTENSION DEPUIS BGG =====

// Variable globale pour stocker le jeu de base lors de l'ajout d'extension
let jeuDeBaseIdPourExtension = null;

// Ouvrir la recherche BGG pour ajouter une extension
async function ajouterExtensionDepuisBGG(jeuDeBaseId) {
    jeuDeBaseIdPourExtension = jeuDeBaseId;
    const jeuDeBase = appData.ludotheque.find(j => j.id === jeuDeBaseId);

    if (!jeuDeBase) {
        await showAlert('Jeu de base introuvable');
        return;
    }

    const html = `
        <div style="max-width: 900px; margin: 0 auto;">
            <h2 style="color: #ffd700; margin-bottom: 20px;">🧩 Rechercher une extension sur BoardGameGeek</h2>

            <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #ffd700;">
                <p style="margin: 0; color: #e0e0e0;">
                    <strong>Jeu de base :</strong> ${jeuDeBase.nom}
                </p>
                <p style="margin: 10px 0 0 0; color: #a0a0a0; font-size: 14px;">
                    L'extension sera automatiquement rattachée à ce jeu
                </p>
            </div>

            <!-- Barre de recherche -->
            <div style="margin-bottom: 20px;">
                <input
                    type="text"
                    id="bggSearchInputExtension"
                    placeholder="🔍 Rechercher une extension (ex: ${jeuDeBase.nom} extension...)"
                    style="
                        width: 100%;
                        padding: 15px;
                        border: 2px solid rgba(255, 215, 0, 0.3);
                        background: rgba(0, 0, 0, 0.3);
                        color: #ffffff;
                        border-radius: 8px;
                        font-size: 16px;
                    "
                    onkeypress="if(event.key === 'Enter') rechercherExtensionsBGG()"
                >
                <button
                    onclick="rechercherExtensionsBGG()"
                    style="
                        margin-top: 10px;
                        width: 100%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 15px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 16px;
                    "
                >
                    🔍 Rechercher
                </button>
            </div>

            <!-- Zone de chargement -->
            <div id="bggLoadingExtension" style="display: none; text-align: center; padding: 40px;">
                <div style="
                    border: 4px solid rgba(255, 215, 0, 0.3);
                    border-top: 4px solid #ffd700;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p style="color: #ffd700;">Recherche en cours...</p>
            </div>

            <!-- Résultats de la recherche -->
            <div id="bggResultsExtension" style="margin-top: 20px;"></div>
        </div>

        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    // Créer la boîte de dialogue
    const dialog = document.createElement('div');
    dialog.id = 'bggExtensionDialog';
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
        z-index: 10001;
        padding: 20px;
        overflow-y: auto;
    `;

    dialog.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 15px;
            padding: 30px;
            max-width: 1000px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            position: relative;
        ">
            <button
                onclick="document.getElementById('bggExtensionDialog').remove()"
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

    // Focus sur l'input
    setTimeout(() => {
        document.getElementById('bggSearchInputExtension').focus();
    }, 100);
}

// Rechercher des extensions sur BGG
async function rechercherExtensionsBGG() {
    const query = document.getElementById('bggSearchInputExtension').value.trim();

    if (!query) {
        await showAlert('Veuillez entrer un nom d\'extension');
        return;
    }

    const loadingDiv = document.getElementById('bggLoadingExtension');
    const resultsDiv = document.getElementById('bggResultsExtension');

    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';

    try {
        const games = await bggIntegration.searchGames(query);

        loadingDiv.style.display = 'none';

        if (games.length === 0) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <p style="font-size: 48px; margin: 0;">🤷</p>
                    <p style="font-size: 18px; margin-top: 10px;">Aucune extension trouvée</p>
                    <p style="font-size: 14px; color: #666;">Essayez avec un autre nom</p>
                </div>
            `;
            return;
        }

        resultsDiv.innerHTML = `
            <h3 style="color: #ffd700; margin-bottom: 15px;">${games.length} résultat(s) trouvé(s)</h3>
            <div style="display: grid; gap: 10px;">
                ${games.map(game => `
                    <div style="
                        background: rgba(255, 255, 255, 0.05);
                        border: 2px solid rgba(255, 215, 0, 0.3);
                        border-radius: 10px;
                        padding: 15px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: pointer;
                        transition: all 0.3s;
                    "
                    onmouseover="this.style.borderColor='rgba(255, 215, 0, 0.6)'"
                    onmouseout="this.style.borderColor='rgba(255, 215, 0, 0.3)'"
                    >
                        <div>
                            <div style="font-size: 18px; font-weight: bold; color: #ffd700; margin-bottom: 5px;">
                                ${game.name}
                            </div>
                            <div style="font-size: 14px; color: #999;">
                                ${game.yearPublished ? `Publié en ${game.yearPublished}` : 'Année inconnue'} • BGG ID: ${game.id}
                            </div>
                        </div>
                        <button
                            onclick="importerExtensionDepuisBGG('${game.id}')"
                            style="
                                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: bold;
                            "
                        >
                            ➕ Importer comme extension
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        loadingDiv.style.display = 'none';
        await showAlert('Erreur lors de la recherche : ' + error.message);
    }
}

// Importer une extension depuis BGG
async function importerExtensionDepuisBGG(bggId) {
    if (!jeuDeBaseIdPourExtension) {
        await showAlert('Erreur : jeu de base introuvable');
        return;
    }

    try {
        // Fermer la fenêtre de recherche
        const dialog = document.getElementById('bggExtensionDialog');
        if (dialog) {
            dialog.remove();
        }

        // Afficher le loader de traduction
        showTranslationLoader('📥 Récupération des données');
        updateTranslationLoader('📥 Récupération des données', 'Connexion à BoardGameGeek...', 20);

        // Récupérer les détails du jeu
        const bggGame = await bggIntegration.getGameDetails(bggId);

        // Traduire la description en français
        updateTranslationLoader('🌐 Traduction en français', 'Traduction de la description...', 50);
        if (bggGame.description) {
            const cleanDesc = bggIntegration.cleanDescription(bggGame.description);
            bggGame.description = await translateToFrench(cleanDesc);
        }

        updateTranslationLoader('✅ Données récupérées', 'Finalisation...', 90);

        // Petit délai pour que l'utilisateur voie le message
        await new Promise(resolve => setTimeout(resolve, 300));

        // Fermer le loader
        hideTranslationLoader();

        // Demander le propriétaire
        const jeuDeBase = appData.ludotheque.find(j => j.id === jeuDeBaseIdPourExtension);
        const proprietaireDefaut = jeuDeBase ? jeuDeBase.proprietaire : 'Association';
        const proprietaire = await showPrompt('Qui est le propriétaire de cette extension ?', proprietaireDefaut);

        if (!proprietaire) {
            await showAlert('❌ Import annulé');
            return;
        }

        // Convertir au format GDJ
        const extension = bggIntegration.convertToGDJFormat(bggGame, proprietaire);

        // Marquer comme extension et lier au jeu de base
        extension.est_extension = true;
        extension.jeu_de_base = jeuDeBaseIdPourExtension;

        // Ajouter à la ludothèque
        appData.ludotheque.push(extension);
        saveLocalData();
        await syncWithGitHub();

        // Afficher un message de succès
        await showAlert(`✅ Extension "${extension.nom}" importée et rattachée à "${jeuDeBase.nom}" !`);

        // Fermer la fenêtre de gestion des extensions si elle existe
        document.querySelector('.custom-dialog')?.remove();

        // Rafraîchir l'affichage
        if (typeof loadLudotheque === 'function') {
            loadLudotheque(currentSearchLudo, currentDureeFilter);
        }
        if (typeof loadLudothequeMembre === 'function') {
            loadLudothequeMembre(currentSearchLudoMembre, currentDureeFilterMembre, currentMembreFilterLudo);
        }

    } catch (error) {
        hideTranslationLoader();
        console.error('[BGG] Erreur d\'import d\'extension:', error);
        await showAlert('❌ Erreur lors de l\'import : ' + error.message);
    }
}
