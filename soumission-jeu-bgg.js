// Amélioration de la soumission de jeu avec intégration BGG pour les membres

// Nouvelle fonction de soumission avec recherche BGG
async function soumettreJeuAvecBGG() {
    if (!currentUser) {
        await showAlert('Vous devez être connecté pour proposer un jeu', 'Erreur');
        return;
    }

    // Demander si l'utilisateur veut rechercher sur BGG
    const choix = await showConfirm(
        '🔍 Voulez-vous rechercher ce jeu sur BoardGameGeek ?\n\nSi oui, toutes les informations seront remplies automatiquement.\nSinon, vous devrez les saisir manuellement.',
        'Proposer un jeu'
    );

    if (choix) {
        // OUI : Recherche BGG
        await soumettreJeuViaBGG();
    } else {
        // NON : Formulaire manuel
        await soumettreJeuManuel();
    }
}

// Soumission via BGG (automatique)
async function soumettreJeuViaBGG() {
    const html = `
        <div style="max-width: 700px; margin: 0 auto;">
            <h2 style="color: #ffd700; margin-bottom: 20px;">🎲 Proposer un jeu - Recherche BGG</h2>

            <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #2ecc71;">
                <p style="margin: 0; color: #e0e0e0;">
                    ✨ <strong>Astuce :</strong> Recherchez votre jeu sur BoardGameGeek et toutes les informations
                    (joueurs, durée, âge, description, image) seront remplies automatiquement !
                </p>
            </div>

            <!-- Barre de recherche -->
            <div style="margin-bottom: 20px;">
                <input
                    type="text"
                    id="bggSearchInputSoumission"
                    placeholder="🔍 Nom du jeu (ex: Catan, 7 Wonders, Wingspan...)"
                    style="
                        width: 100%;
                        padding: 15px;
                        border: 2px solid rgba(255, 215, 0, 0.3);
                        background: rgba(0, 0, 0, 0.3);
                        color: #ffffff;
                        border-radius: 8px;
                        font-size: 16px;
                    "
                    onkeypress="if(event.key === 'Enter') rechercherJeuxBGGSoumission()"
                >
                <button
                    onclick="rechercherJeuxBGGSoumission()"
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
            <div id="bggLoadingSoumission" style="display: none; text-align: center; padding: 40px;">
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

            <!-- Résultats -->
            <div id="bggResultsSoumission"></div>

            <!-- Bouton retour -->
            <div style="margin-top: 20px; text-align: center;">
                <button
                    onclick="soumettreJeuManuel(); document.getElementById('soumissionBGGDialog').remove();"
                    style="
                        background: rgba(255, 255, 255, 0.1);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                    "
                >
                    ← Saisie manuelle
                </button>
            </div>
        </div>

        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    const dialog = document.createElement('div');
    dialog.id = 'soumissionBGGDialog';
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
                onclick="document.getElementById('soumissionBGGDialog').remove()"
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

    setTimeout(() => {
        document.getElementById('bggSearchInputSoumission').focus();
    }, 100);
}

// Rechercher sur BGG pour soumission
async function rechercherJeuxBGGSoumission() {
    const query = document.getElementById('bggSearchInputSoumission').value.trim();

    if (!query) {
        await showAlert('Veuillez entrer un nom de jeu', 'Attention');
        return;
    }

    const loadingDiv = document.getElementById('bggLoadingSoumission');
    const resultsDiv = document.getElementById('bggResultsSoumission');

    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';

    try {
        const games = await bggIntegration.searchGames(query);

        loadingDiv.style.display = 'none';

        if (games.length === 0) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <p style="font-size: 48px; margin: 0;">🤷</p>
                    <p style="font-size: 18px; margin-top: 10px;">Aucun jeu trouvé</p>
                    <p style="font-size: 14px; color: #666;">Essayez avec un autre nom ou utilisez la saisie manuelle</p>
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
                        transition: all 0.3s;
                    "
                    onmouseover="this.style.borderColor='rgba(255, 215, 0, 0.6)'"
                    onmouseout="this.style.borderColor='rgba(255, 215, 0, 0.3)'"
                    >
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <div style="font-size: 18px; font-weight: bold; color: #ffd700; margin-bottom: 5px;">
                                    ${game.name}
                                </div>
                                <div style="font-size: 14px; color: #999;">
                                    ${game.yearPublished ? `Publié en ${game.yearPublished}` : 'Année inconnue'} • BGG ID: ${game.id}
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button
                                    onclick="afficherApercuJeuBGG('${game.id}', '${game.name.replace(/'/g, "\\'")}', '${game.yearPublished || ''}')"
                                    style="
                                        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                                        color: white;
                                        border: none;
                                        padding: 12px 20px;
                                        border-radius: 8px;
                                        cursor: pointer;
                                        font-weight: bold;
                                    "
                                >
                                    👁️ Aperçu
                                </button>
                                <button
                                    onclick="confirmerSoumissionBGG('${game.id}')"
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
                                    ✓ Choisir
                                </button>
                            </div>
                        </div>
                        <div id="apercu-${game.id}" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 215, 0, 0.2);"></div>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        loadingDiv.style.display = 'none';
        await showAlert('Erreur lors de la recherche : ' + error.message, 'Erreur');
    }
}

// Afficher l'aperçu d'un jeu BGG avec description traduite
async function afficherApercuJeuBGG(bggId, gameName, gameYear) {
    const apercuDiv = document.getElementById(`apercu-${bggId}`);

    // Si déjà ouvert, fermer
    if (apercuDiv.style.display === 'block') {
        apercuDiv.style.display = 'none';
        return;
    }

    // Afficher le chargement local dans la carte
    apercuDiv.style.display = 'block';
    apercuDiv.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="
                border: 3px solid rgba(255, 215, 0, 0.3);
                border-top: 3px solid #ffd700;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            "></div>
            <p style="color: #ffd700; font-size: 14px;">Chargement et traduction...</p>
        </div>
    `;

    try {
        // Récupérer les détails du jeu
        const bggGame = await bggIntegration.getGameDetails(bggId);

        // Traduire la description
        let descriptionFr = '';
        if (bggGame.description) {
            const cleanDesc = bggIntegration.cleanDescription(bggGame.description);
            console.log('[Aperçu BGG] Description originale (EN):', cleanDesc.substring(0, 100) + '...');
            descriptionFr = await translateToFrench(cleanDesc);
            console.log('[Aperçu BGG] Description finale:', descriptionFr.substring(0, 100) + '...');
        }

        // Afficher l'aperçu complet
        apercuDiv.innerHTML = `
            <div style="display: flex; gap: 20px;">
                ${bggGame.image ? `
                    <img src="${bggGame.image}"
                         style="width: 150px; height: 150px; object-fit: cover; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                ` : ''}
                <div style="flex: 1;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
                        <div>
                            <div style="color: #999; font-size: 12px;">👥 Joueurs</div>
                            <div style="color: #fff; font-weight: bold;">${bggGame.minPlayers}-${bggGame.maxPlayers}</div>
                        </div>
                        <div>
                            <div style="color: #999; font-size: 12px;">⏱️ Durée</div>
                            <div style="color: #fff; font-weight: bold;">${bggGame.playingTime || bggGame.maxPlayTime || '?'} min</div>
                        </div>
                        <div>
                            <div style="color: #999; font-size: 12px;">🎂 Âge minimum</div>
                            <div style="color: #fff; font-weight: bold;">${bggGame.minAge}+</div>
                        </div>
                        <div>
                            <div style="color: #999; font-size: 12px;">⭐ Note BGG</div>
                            <div style="color: #fff; font-weight: bold;">${bggGame.rating ? parseFloat(bggGame.rating.average).toFixed(2) : 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>

            ${descriptionFr ? `
                <div style="margin-top: 15px;">
                    <button
                        onclick="toggleDescriptionBGG('${bggId}')"
                        id="toggleBtn-${bggId}"
                        style="
                            background: rgba(255, 215, 0, 0.1);
                            border: 1px solid rgba(255, 215, 0, 0.3);
                            color: #ffd700;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            width: 100%;
                            text-align: left;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        "
                    >
                        <span>📖 Description</span>
                        <span id="toggleIcon-${bggId}">▼</span>
                    </button>
                    <div
                        id="description-${bggId}"
                        style="
                            display: none;
                            margin-top: 10px;
                            padding: 15px;
                            background: rgba(0, 0, 0, 0.3);
                            border-radius: 8px;
                            color: #e0e0e0;
                            font-size: 14px;
                            line-height: 1.6;
                            max-height: 300px;
                            overflow-y: auto;
                        "
                    >
                        ${descriptionFr}
                    </div>
                </div>
            ` : '<p style="color: #999; font-style: italic; margin-top: 15px;">Aucune description disponible</p>'}
        `;

    } catch (error) {
        console.error('Erreur lors du chargement de l\'aperçu:', error);
        apercuDiv.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #e74c3c;">
                ❌ Erreur lors du chargement des détails
            </div>
        `;
    }
}

// Toggle description (replier/déplier)
function toggleDescriptionBGG(bggId) {
    const descDiv = document.getElementById(`description-${bggId}`);
    const icon = document.getElementById(`toggleIcon-${bggId}`);

    if (descDiv.style.display === 'none') {
        descDiv.style.display = 'block';
        icon.textContent = '▲';
    } else {
        descDiv.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Confirmer la soumission avec un jeu BGG
async function confirmerSoumissionBGG(bggId) {
    try {
        // Fermer la fenêtre de recherche AVANT de faire quoi que ce soit
        const dialog = document.getElementById('soumissionBGGDialog');
        if (dialog) {
            dialog.remove();
        }

        // Afficher le loader de traduction
        showTranslationLoader('📥 Récupération des données');
        updateTranslationLoader('📥 Récupération des données', 'Connexion à BoardGameGeek...', 20);

        const bggGame = await bggIntegration.getGameDetails(bggId);

        // Traduire la description en français
        updateTranslationLoader('🌐 Traduction en français', 'Traduction de la description...', 50);
        let descriptionFr = '';
        if (bggGame.description) {
            const cleanDesc = bggIntegration.cleanDescription(bggGame.description);
            console.log('[Soumission BGG] Description originale (EN):', cleanDesc.substring(0, 100) + '...');
            descriptionFr = await translateToFrench(cleanDesc);
            console.log('[Soumission BGG] Description finale:', descriptionFr.substring(0, 100) + '...');
        }

        updateTranslationLoader('✅ Données récupérées', 'Finalisation...', 90);

        // Petit délai pour que l'utilisateur voie le message de finalisation
        await new Promise(resolve => setTimeout(resolve, 300));

        // Fermer le loader
        hideTranslationLoader();

        // Demander le propriétaire
        const proprietaire = await showPrompt('Qui est le propriétaire de ce jeu ?', `${currentUser.prenom} ${currentUser.nom}`);

        if (!proprietaire) return;

        // Vérifier si validation requise
        initSettings();
        const validationRequise = appData.settings.soumissions.jeux.active;

        const jeuData = {
            nom: bggGame.name,
            proprietaire: proprietaire,
            min_joueurs: parseInt(bggGame.minPlayers) || 1,
            max_joueurs: parseInt(bggGame.maxPlayers) || 10,
            duree: parseInt(bggGame.playingTime) || parseInt(bggGame.maxPlayTime) || 60,
            age_min: parseInt(bggGame.minAge) || 0,
            description: descriptionFr || '',
            bggId: bggGame.id,
            image: bggGame.image,
            thumbnail: bggGame.thumbnail,
            annee_publication: bggGame.yearPublished,
            note: bggGame.rating ? parseFloat(bggGame.rating.average).toFixed(2) : null
        };

        if (validationRequise) {
            // Créer une soumission pour validation
            if (!appData.soumissions) appData.soumissions = [];
            if (!appData.settings.lastSoumissionId) appData.settings.lastSoumissionId = 0;

            const soumission = {
                id: ++appData.settings.lastSoumissionId,
                type: 'jeu',
                statut: 'en_attente',
                auteur_id: currentUser.id,
                date_soumission: new Date().toISOString(),
                data: jeuData
            };

            appData.soumissions.push(soumission);
            saveLocalData();
            syncWithGitHub();

            if (typeof updateSoumissionsBadge === 'function') {
                updateSoumissionsBadge();
            }

            await showAlert('✅ Jeu soumis pour validation ! Il sera ajouté à la ludothèque après validation.');
        } else {
            // Ajouter directement
            if (!appData.ludotheque) appData.ludotheque = [];

            const jeu = {
                id: ++appData.settings.lastGameId,
                ...jeuData,
                date_ajout: new Date().toISOString(),
                est_extension: false,
                jeu_de_base: null
            };

            appData.ludotheque.push(jeu);
            saveLocalData();
            syncWithGitHub();

            await showAlert('✅ Jeu ajouté à la ludothèque !');
        }

    } catch (error) {
        console.error('[Soumission BGG] Erreur:', error);
        await showAlert('❌ Erreur : ' + error.message, 'Erreur');
    }
}

// Soumission manuelle (version originale)
async function soumettreJeuManuel() {
    if (!currentUser) {
        await showAlert('Vous devez être connecté pour proposer un jeu', 'Erreur');
        return;
    }

    // Vérifier si les soumissions de jeux nécessitent une validation
    initSettings();
    const validationRequise = appData.settings.soumissions.jeux.active;

    const nom = await showPrompt('Nom du jeu:');
    if (!nom) return;

    const proprietaire = await showPrompt('Propriétaire:', `${currentUser.prenom} ${currentUser.nom}`);
    if (!proprietaire) return;

    const minJoueurs = await showPrompt('Nombre minimum de joueurs:', '1');
    if (!minJoueurs) return;

    const maxJoueurs = await showPrompt('Nombre maximum de joueurs:', '4');
    if (!maxJoueurs) return;

    const duree = await showPrompt('Durée moyenne (en minutes):', '60');
    if (!duree) return;

    const age = await showPrompt('Âge minimum:', '10');
    if (!age) return;

    const description = await showPrompt('Description (optionnelle):');

    const jeuData = {
        nom,
        proprietaire,
        min_joueurs: parseInt(minJoueurs),
        max_joueurs: parseInt(maxJoueurs),
        duree: parseInt(duree),
        age_min: parseInt(age),
        description: description || ''
    };

    if (validationRequise) {
        // Créer soumission
        if (!appData.soumissions) appData.soumissions = [];
        if (!appData.settings.lastSoumissionId) appData.settings.lastSoumissionId = 0;

        const soumission = {
            id: ++appData.settings.lastSoumissionId,
            type: 'jeu',
            statut: 'en_attente',
            auteur_id: currentUser.id,
            date_soumission: new Date().toISOString(),
            data: jeuData
        };

        appData.soumissions.push(soumission);
        saveLocalData();
        syncWithGitHub();

        if (typeof updateSoumissionsBadge === 'function') {
            updateSoumissionsBadge();
        }

        await showAlert('✅ Jeu soumis pour validation !', 'Succès');
    } else {
        // Ajouter directement
        if (!appData.ludotheque) appData.ludotheque = [];

        const jeu = {
            id: ++appData.settings.lastGameId,
            ...jeuData,
            date_ajout: new Date().toISOString(),
            est_extension: false,
            jeu_de_base: null
        };

        appData.ludotheque.push(jeu);
        saveLocalData();
        syncWithGitHub();

        await showAlert('✅ Jeu ajouté à la ludothèque !', 'Succès');
    }
}

// Remplacer la fonction originale
window.soumettreJeu = soumettreJeuAvecBGG;
