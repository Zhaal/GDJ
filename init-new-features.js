// Initialisation des nouvelles fonctionnalités
// À appeler après le chargement de la page

function initNewFeatures() {
    // ===== LUDOTHÈQUE =====

    const addGameBtn = document.getElementById('addGameBtn');
    if (addGameBtn) {
        addGameBtn.addEventListener('click', () => {
            // Ouvrir la recherche BGG au lieu du formulaire manuel
            afficherRechercheBGG();
        });
    }

    const cancelGameBtn = document.getElementById('cancelGameBtn');
    if (cancelGameBtn) {
        cancelGameBtn.addEventListener('click', () => {
            document.getElementById('gameForm').style.display = 'none';
        });
    }

    const gameForm = document.getElementById('gameFormElement');
    if (gameForm) {
        gameForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const gameId = document.getElementById('gameId').value;
            const game = {
                nom: document.getElementById('gameNom').value,
                proprietaire: document.getElementById('gameProprietaire').value,
                min_joueurs: parseInt(document.getElementById('gameMinJoueurs').value),
                max_joueurs: parseInt(document.getElementById('gameMaxJoueurs').value),
                duree: parseInt(document.getElementById('gameDuree').value),
                age_min: parseInt(document.getElementById('gameAge').value),
                description: document.getElementById('gameDescription').value
            };

            if (gameId) {
                // Modification
                const index = appData.ludotheque.findIndex(g => g.id === parseInt(gameId));
                if (index !== -1) {
                    appData.ludotheque[index] = { ...appData.ludotheque[index], ...game };
                }
            } else {
                // Ajout
                game.id = ++appData.settings.lastGameId;
                game.date_ajout = new Date().toISOString();
                appData.ludotheque.push(game);
            }

            saveLocalData();
            syncWithGitHub();

            document.getElementById('gameForm').style.display = 'none';
            loadLudotheque();
            loadLudothequeMembre();
            loadMembreFilterLudo(); // Recharger la liste des membres
            alert('Jeu enregistré !');
        });
    }

    // ===== ANNONCES =====

    const addAnnonceBtn = document.getElementById('addAnnonceBtn');
    if (addAnnonceBtn) {
        addAnnonceBtn.addEventListener('click', () => {
            document.getElementById('annonceForm').style.display = 'block';
        });
    }

    const cancelAnnonceBtn = document.getElementById('cancelAnnonceBtn');
    if (cancelAnnonceBtn) {
        cancelAnnonceBtn.addEventListener('click', () => {
            document.getElementById('annonceForm').style.display = 'none';
        });
    }

    const annonceForm = document.getElementById('annonceFormElement');
    if (annonceForm) {
        annonceForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const type = document.querySelector('input[name="annonceType"]:checked').value;
            const annonce = {
                id: ++appData.settings.lastAnnonceId,
                titre: document.getElementById('annonceTitre').value,
                contenu: document.getElementById('annonceContenu').value,
                auteur_id: currentUser.id,
                date_creation: new Date().toISOString(),
                type: type, // 'permanente' ou 'temporaire'
                date_expiration: null
            };

            // Si c'est une annonce temporaire, ajouter la date d'expiration
            if (type === 'temporaire') {
                const expirationInput = document.getElementById('annonceExpiration').value;
                if (!expirationInput) {
                    alert('Veuillez sélectionner une date d\'expiration pour l\'annonce temporaire');
                    return;
                }
                annonce.date_expiration = new Date(expirationInput).toISOString();
            }

            appData.annonces.push(annonce);
            saveLocalData();
            syncWithGitHub();

            document.getElementById('annonceForm').style.display = 'none';
            document.getElementById('annonceFormElement').reset();
            // Réinitialiser aussi le type et l'expiration
            document.querySelector('input[name="annonceType"][value="permanente"]').checked = true;
            document.getElementById('annonceExpirationDiv').style.display = 'none';
            document.getElementById('annonceExpiration').value = '';

            loadAnnonces();
            loadAnnoncesMembre();
            alert('Annonce publiée !');
        });
    }
}

// Gérer l'affichage du champ date d'expiration
function toggleAnnonceExpiration() {
    const type = document.querySelector('input[name="annonceType"]:checked').value;
    const expirationDiv = document.getElementById('annonceExpirationDiv');
    if (type === 'temporaire') {
        expirationDiv.style.display = 'block';
        document.getElementById('annonceExpiration').required = true;
    } else {
        expirationDiv.style.display = 'none';
        document.getElementById('annonceExpiration').required = false;
        document.getElementById('annonceExpiration').value = '';
    }
}

// Nettoyer les annonces expirées
function cleanupExpiredAnnonces() {
    if (!appData.annonces) return;

    const now = new Date();
    const initialCount = appData.annonces.length;

    // Filtrer les annonces non expirées
    appData.annonces = appData.annonces.filter(annonce => {
        // Garder les annonces permanentes
        if (annonce.type === 'permanente' || !annonce.type) {
            return true;
        }

        // Pour les annonces temporaires, vérifier la date d'expiration
        if (annonce.type === 'temporaire' && annonce.date_expiration) {
            const expirationDate = new Date(annonce.date_expiration);
            // Garder si pas encore expirée
            return expirationDate > now;
        }

        // Garder par défaut si pas de date d'expiration définie
        return true;
    });

    // Sauvegarder si des annonces ont été supprimées
    if (appData.annonces.length < initialCount) {
        saveLocalData();
        syncWithGitHub();
        console.log(`${initialCount - appData.annonces.length} annonce(s) expirée(s) supprimée(s)`);
    }
}

// Charger la ludothèque pour les membres
let currentSearchLudoMembre = '';
let currentDureeFilterMembre = 'all';
let currentMembreFilterLudo = '';

function loadLudothequeMembre(searchTerm = '', dureeFilter = 'all', membreFilter = '') {
    const container = document.getElementById('ludothequeListMembre');
    if (!container) return;

    currentSearchLudoMembre = searchTerm.toLowerCase();
    currentDureeFilterMembre = dureeFilter;
    currentMembreFilterLudo = membreFilter;

    container.innerHTML = '';

    // Filtrer les jeux (exclure les extensions qui sont rattachées à un jeu de base)
    let filteredGames = appData.ludotheque.filter(game => {
        // Exclure les extensions rattachées
        if (game.est_extension && game.jeu_de_base) {
            return false;
        }

        // Filtre de recherche
        const matchesSearch = game.nom.toLowerCase().includes(currentSearchLudoMembre) ||
                              game.proprietaire.toLowerCase().includes(currentSearchLudoMembre) ||
                              (game.description && game.description.toLowerCase().includes(currentSearchLudoMembre));

        // Filtre de durée (utiliser la durée totale avec extensions)
        let matchesDuree = true;
        if (dureeFilter !== 'all') {
            const gameData = getGameDataWithExtensions(game);
            if (dureeFilter === '240+') {
                // Pour "240+", on cherche les jeux de plus de 240 min
                matchesDuree = gameData.duree > 240;
            } else {
                const maxDuree = parseInt(dureeFilter);
                matchesDuree = gameData.duree <= maxDuree;
            }
        }

        // Filtre par membre
        let matchesMembre = true;
        if (membreFilter) {
            matchesMembre = game.proprietaire === membreFilter;
        }

        return matchesSearch && matchesDuree && matchesMembre;
    });

    if (filteredGames.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#fff;padding:20px;">Aucun jeu trouvé</p>';
        return;
    }

    // Trier selon le filtre
    if (dureeFilter === 'all') {
        // Filtre "Tous" : tri alphabétique simple
        filteredGames.sort((a, b) => a.nom.localeCompare(b.nom));
    } else {
        // Filtre par durée : tri par durée décroissante puis alphabétique (utiliser la durée totale)
        filteredGames.sort((a, b) => {
            const aData = getGameDataWithExtensions(a);
            const bData = getGameDataWithExtensions(b);
            // D'abord par durée décroissante
            if (bData.duree !== aData.duree) {
                return bData.duree - aData.duree;
            }
            // Puis par ordre alphabétique
            return a.nom.localeCompare(b.nom);
        });
    }

    filteredGames.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.cursor = 'pointer';

        const detailsId = `game-membre-list-details-${game.id}`;

        // Calculer les données incluant les extensions
        const gameData = getGameDataWithExtensions(game);
        const extensionBadge = gameData.extensionsCount > 0 ? ` <span style="color: #ffd700; font-size: 14px;">(${gameData.extensionsCount})</span>` : '';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 10px; flex-grow: 1; min-width: 200px;">
                    <span class="toggle-icon" style="font-size: 20px; cursor: pointer; user-select: none;">▶</span>
                    <div class="game-title">${game.nom}${extensionBadge}</div>
                </div>
                <div style="display: flex; gap: 15px; align-items: center; font-size: 14px; color: #e0e0e0;">
                    <span>👥 ${gameData.min_joueurs}-${gameData.max_joueurs}</span>
                    <span>⏱️ ${gameData.duree} min</span>
                    <span>🎯 ${gameData.age_min}+</span>
                </div>
                <div class="game-owner">${game.proprietaire}</div>
            </div>
            <div id="${detailsId}" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 215, 0, 0.3);">
                <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px;">
                    <div class="game-info">👥 ${game.min_joueurs}-${game.max_joueurs} joueurs</div>
                    <div class="game-info">⏱️ ${game.duree} min</div>
                    <div class="game-info">🎯 ${game.age_min}+</div>
                </div>
                ${game.description ? `<div class="game-info" style="margin-bottom: 15px;">${game.description}</div>` : ''}
                ${game.image ? `<div style="margin-bottom: 15px;"><img src="${game.image}" alt="${game.nom}" style="max-width: 200px; border-radius: 8px; border: 2px solid rgba(255, 215, 0, 0.3);"></div>` : ''}
                ${game.categories && game.categories.length > 0 ? `<div class="game-info" style="margin-bottom: 10px;"><strong>Catégories:</strong> ${game.categories.join(', ')}</div>` : ''}
                ${game.mecaniques && game.mecaniques.length > 0 ? `<div class="game-info" style="margin-bottom: 10px;"><strong>Mécaniques:</strong> ${game.mecaniques.join(', ')}</div>` : ''}
                ${game.auteurs && game.auteurs.length > 0 ? `<div class="game-info" style="margin-bottom: 10px;"><strong>Auteurs:</strong> ${game.auteurs.join(', ')}</div>` : ''}
                ${game.editeurs && game.editeurs.length > 0 ? `<div class="game-info" style="margin-bottom: 10px;"><strong>Éditeurs:</strong> ${game.editeurs.join(', ')}</div>` : ''}
                ${game.note ? `<div class="game-info" style="margin-bottom: 10px;"><strong>Note BGG:</strong> ${game.note}/10</div>` : ''}
                ${game.annee_publication ? `<div class="game-info" style="margin-bottom: 10px;"><strong>Année:</strong> ${game.annee_publication}</div>` : ''}

                ${gameData.extensionsCount > 0 ? `
                    <div style="background: rgba(255, 215, 0, 0.1); border-left: 3px solid #ffd700; padding: 15px; margin: 15px 0; border-radius: 5px;">
                        <div style="font-weight: bold; color: #ffd700; margin-bottom: 10px; font-size: 16px;">🧩 Extensions (${gameData.extensionsCount})</div>
                        ${appData.ludotheque.filter(g => g.jeu_de_base === game.id).map(ext => `
                            <div style="background: rgba(0, 0, 0, 0.2); padding: 10px; margin-bottom: 8px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="color: #fff; font-weight: 500;">${ext.nom}</div>
                                    <div style="color: #999; font-size: 12px; margin-top: 4px;">👥 ${ext.min_joueurs}-${ext.max_joueurs} | ⏱️ ${ext.duree} min | 🎯 ${ext.age_min}+ | Proprio: ${ext.proprietaire}</div>
                                </div>
                                <button class="btn-secondary" onclick="event.stopPropagation(); showGameDetailsDialog(${ext.id})" style="padding: 6px 12px; font-size: 12px;">Voir</button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div style="margin-top: 15px;">
                    <button class="btn-secondary" onclick="event.stopPropagation(); showGameDetailsDialog(${game.id})">📸 Photos</button>
                    ${!game.est_extension ? `<button class="btn-primary" onclick="event.stopPropagation(); gererExtensions(${game.id})" style="margin-left: 10px;">🧩 Extensions</button>` : ''}
                </div>
            </div>
        `;

        // Ajouter un événement click pour plier/déplier
        card.addEventListener('click', (e) => {
            // Ne pas toggle si on clique sur un bouton
            if (e.target.closest('button') || e.target.tagName === 'BUTTON' || e.target.tagName === 'IMG') {
                return;
            }

            const details = document.getElementById(detailsId);
            const toggleIcon = card.querySelector('.toggle-icon');

            if (details.style.display === 'none') {
                details.style.display = 'block';
                toggleIcon.textContent = '▼';
                card.dataset.expanded = 'true';
            } else {
                details.style.display = 'none';
                toggleIcon.textContent = '▶';
                card.dataset.expanded = 'false';
            }
        });

        container.appendChild(card);
    });
}

// Charger le filtre des membres pour la ludothèque membre
function loadMembreFilterLudoMembre() {
    const select = document.getElementById('membreFilterLudoMembre');
    if (!select) return;

    select.innerHTML = '<option value="">Tous les jeux</option>';

    // Grouper les jeux par propriétaire (exclure les extensions rattachées)
    const proprietaires = {};
    appData.ludotheque.forEach(game => {
        // Ne compter que les jeux de base, pas les extensions rattachées
        if (!(game.est_extension && game.jeu_de_base)) {
            if (!proprietaires[game.proprietaire]) {
                proprietaires[game.proprietaire] = 0;
            }
            proprietaires[game.proprietaire]++;
        }
    });

    // Ajouter une option pour chaque propriétaire
    Object.keys(proprietaires).sort().forEach(proprietaire => {
        const option = document.createElement('option');
        option.value = proprietaire;
        option.textContent = `${proprietaire} (${proprietaires[proprietaire]} jeu${proprietaires[proprietaire] > 1 ? 'x' : ''})`;
        select.appendChild(option);
    });

    select.onchange = (e) => {
        loadLudothequeMembre(currentSearchLudoMembre, currentDureeFilterMembre, e.target.value);
    };
}

// Promouvoir automatiquement les réservistes 24h avant l'événement
function promoteReservesAuto() {
    const now = new Date();
    let hasChanges = false;

    appData.evenements.forEach(event => {
        if (!event.participants || event.participants.length === 0) return;

        const eventDateTime = new Date(event.date + ' ' + event.heure);
        const diff = eventDateTime - now;
        const diffHours = diff / (1000 * 60 * 60);

        // Si l'événement est dans moins de 24h et plus de 0h
        if (diffHours > 0 && diffHours <= 24) {
            const jeu = event.jeu_id ? appData.ludotheque.find(j => j.id === event.jeu_id) : null;

            // Déterminer le nombre max de participants
            let maxParticipants = null;
            if (jeu) {
                maxParticipants = jeu.max_joueurs;
            } else if (event.max_participants) {
                maxParticipants = event.max_participants;
            }

            // Si pas de limite, pas de promotion
            if (!maxParticipants) return;

            const joueurs = event.participants.filter(p => p.type === 'joueur');
            const reserves = event.participants.filter(p => p.type === 'reserve').sort((a, b) =>
                new Date(a.date_inscription) - new Date(b.date_inscription)
            );

            // Promouvoir les réservistes si des places sont disponibles
            while (joueurs.length < maxParticipants && reserves.length > 0) {
                const reserve = reserves.shift();
                reserve.type = 'joueur';
                reserve.promotion_auto = true; // Marquer comme promu automatiquement
                joueurs.push(reserve);
                hasChanges = true;
            }
        }
    });

    if (hasChanges) {
        saveLocalData();
        syncWithGitHub(true); // Silent sync
    }
}

// Charger les événements pour les membres (liste au lieu de calendrier)
function loadCalendarMembre() {
    const container = document.getElementById('calendarContainerMembre');
    if (!container) return;

    // S'assurer que evenements existe
    if (!appData.evenements) appData.evenements = [];

    // Promouvoir automatiquement les réservistes
    promoteReservesAuto();

    container.innerHTML = '';

    if (appData.evenements.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#e0e0e0;padding:20px;">Aucun événement prévu</p>';
        return;
    }

    // Trier par date
    const sortedEvents = [...appData.evenements].sort((a, b) =>
        new Date(a.date + ' ' + a.heure) - new Date(b.date + ' ' + b.heure)
    );

    sortedEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const isPast = eventDate < new Date();
        const jeu = event.jeu_id ? appData.ludotheque.find(j => j.id === event.jeu_id) : null;

        // Compter les participants
        const participants = event.participants || [];
        const joueurs = participants.filter(p => p.type === 'joueur');
        const reserves = participants.filter(p => p.type === 'reserve');

        // Vérifier si l'utilisateur est inscrit
        const isParticipant = participants.some(p => p.membre_id === currentUser.id);
        const userParticipation = participants.find(p => p.membre_id === currentUser.id);

        // Déterminer le style selon le type d'événement
        const typeEvenement = event.type_evenement || 'partie';
        const eventStyles = {
            initiation: {
                icon: '🎓',
                label: 'Initiation',
                borderColor: '#3498db',
                bgColor: 'rgba(52, 152, 219, 0.1)'
            },
            partie: {
                icon: '🎲',
                label: 'Partie classique',
                borderColor: '#2ecc71',
                bgColor: 'rgba(46, 204, 113, 0.1)'
            },
            tournoi: {
                icon: '🏆',
                label: 'Tournoi',
                borderColor: '#f39c12',
                bgColor: 'rgba(243, 156, 18, 0.1)'
            },
            wargame: {
                icon: '⚔️',
                label: 'Wargame',
                borderColor: '#e74c3c',
                bgColor: 'rgba(231, 76, 60, 0.1)'
            },
            tcg: {
                icon: '🃏',
                label: 'TCG',
                borderColor: '#9b59b6',
                bgColor: 'rgba(155, 89, 182, 0.1)'
            },
            jdr: {
                icon: '🎲',
                label: 'JDR',
                borderColor: '#1abc9c',
                bgColor: 'rgba(26, 188, 156, 0.1)'
            }
        };

        const style = eventStyles[typeEvenement] || eventStyles.partie;

        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.opacity = isPast ? '0.6' : '1';
        card.style.borderLeft = `4px solid ${style.borderColor}`;
        card.style.background = `linear-gradient(135deg, ${style.bgColor}, rgba(0, 0, 0, 0.2))`;

        card.innerHTML = `
            <div class="game-card-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">${style.icon}</span>
                        <div>
                            <div class="game-title">${event.titre}</div>
                            <div style="color: ${style.borderColor}; font-size: 12px; font-weight: bold;">${style.label}</div>
                        </div>
                    </div>
                    <div style="color: #ffffff; font-size: 14px; margin-top: 5px;">
                        📅 ${eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        à ${event.heure}
                    </div>
                </div>
                ${isPast ? '<span class="badge" style="background: #95a5a6;">Passé</span>' : ''}
            </div>
            ${event.description ? `<div style="margin: 10px 0; color: #ffffff;">${event.description}</div>` : ''}
            ${jeu ? `
                <div style="background: rgba(255, 215, 0, 0.2); padding: 10px; border-radius: 5px; margin: 10px 0; border: 1px solid rgba(255, 215, 0, 0.3);">
                    <strong style="color: #ffd700;">🎲 Jeu : ${jeu.nom}</strong><br>
                    <small style="color: #ffffff;">${jeu.min_joueurs}-${jeu.max_joueurs} joueurs | ${jeu.duree} min | ${jeu.age_min}+</small>
                </div>
            ` : ''}
            <div style="margin: 15px 0;">
                <strong style="color: #ffd700;">Participants (${joueurs.length}${jeu ? '/' + jeu.max_joueurs : (event.max_participants ? '/' + event.max_participants : '')}):</strong>
                <div style="margin-top: 5px;">
                    ${joueurs.length > 0 ? joueurs.map(p =>
                        `<span class="badge success" style="margin: 2px;">${p.nom}</span>`
                    ).join(' ') : '<em style="color: #ffffff;">Aucun participant</em>'}
                </div>
                ${reserves.length > 0 ? `
                    <div style="margin-top: 10px;">
                        <strong style="color: #ffd700;">En réserve (${reserves.length}):</strong>
                        <div style="margin-top: 5px;">
                            ${reserves.map(p =>
                                `<span class="badge warning" style="margin: 2px;">${p.nom}</span>`
                            ).join(' ')}
                        </div>
                    </div>
                ` : ''}
            </div>
            ${!isPast ? `
                <div style="margin-top: 15px;">
                    ${!isParticipant ?
                        `<button class="btn-primary" onclick="sInscrireEvenement(${event.id}, 'joueur')">S'inscrire</button>
                         <button class="btn-secondary" onclick="sInscrireEvenement(${event.id}, 'reserve')" style="margin-left: 10px;">Liste de réserve</button>` :
                        `<div>
                            <span class="badge ${userParticipation.type === 'joueur' ? 'success' : 'warning'}">
                                Vous êtes inscrit ${userParticipation.type === 'reserve' ? '(en réserve)' : ''}
                            </span>
                            <button class="btn-danger" style="margin-left: 10px;" onclick="seDesinscrireEvenement(${event.id})">Se désinscrire</button>
                        </div>`
                    }
                </div>
            ` : ''}
        `;

        container.appendChild(card);
    });
}

// S'inscrire à un événement
async function sInscrireEvenement(eventId, typeChoisi = 'joueur') {
    if (!currentUser) {
        await showAlert('Vous devez être connecté');
        return;
    }

    const event = appData.evenements.find(e => e.id === eventId);
    if (!event) return;

    // S'assurer que participants existe
    if (!event.participants) event.participants = [];

    // Vérifier si déjà inscrit
    if (event.participants.some(p => p.membre_id === currentUser.id)) {
        await showAlert('Vous êtes déjà inscrit à cet événement');
        return;
    }

    const membre = appData.membres.find(m => m.id === currentUser.id);
    const jeu = event.jeu_id ? appData.ludotheque.find(j => j.id === event.jeu_id) : null;

    const participant = {
        membre_id: currentUser.id,
        nom: `${membre.prenom} ${membre.nom}`,
        date_inscription: new Date().toISOString()
    };

    // Déterminer si joueur ou réserve
    if (typeChoisi === 'reserve') {
        // L'utilisateur a choisi explicitement la liste de réserve
        participant.type = 'reserve';
    } else if (jeu) {
        const nbJoueurs = event.participants.filter(p => p.type === 'joueur').length;
        if (nbJoueurs < jeu.max_joueurs) {
            participant.type = 'joueur';
        } else {
            participant.type = 'reserve';
        }
    } else if (event.max_participants) {
        // Événement sans jeu mais avec max_participants défini
        const nbJoueurs = event.participants.filter(p => p.type === 'joueur').length;
        if (nbJoueurs < event.max_participants) {
            participant.type = 'joueur';
        } else {
            participant.type = 'reserve';
        }
    } else {
        participant.type = 'joueur';
    }

    event.participants.push(participant);
    saveLocalData();
    syncWithGitHub();
    loadCalendarMembre();

    if (participant.type === 'reserve') {
        await showAlert(typeChoisi === 'reserve' ?
            'Vous êtes inscrit en liste de réserve' :
            'Vous êtes inscrit en réserve (nombre de joueurs max atteint)');
    } else {
        await showAlert('Inscription confirmée !');
    }
}

// Se désinscrire d'un événement
function seDesinscrireEvenement(eventId) {
    if (!currentUser) {
        alert('Vous devez être connecté');
        return;
    }

    const event = appData.evenements.find(e => e.id === eventId);
    if (!event) return;

    if (!event.participants) event.participants = [];

    const wasReserve = event.participants.find(p => p.membre_id === currentUser.id)?.type === 'reserve';

    // Retirer le participant
    event.participants = event.participants.filter(p => p.membre_id !== currentUser.id);

    // Si c'était un joueur et qu'il y a un jeu, promouvoir le premier en réserve
    if (!wasReserve && event.jeu_id) {
        const firstReserve = event.participants.find(p => p.type === 'reserve');
        if (firstReserve) {
            firstReserve.type = 'joueur';
            alert('Désinscription confirmée. Un joueur en réserve a été promu.');
        }
    }

    saveLocalData();
    syncWithGitHub();
    loadCalendarMembre();

    if (!wasReserve) {
        alert('Désinscription confirmée');
    }
}

// Charger les annonces pour les membres
function loadAnnoncesMembre() {
    const container = document.getElementById('annoncesListMembre');
    if (!container) return;

    container.innerHTML = '';

    if (appData.annonces.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#e0e0e0;padding:20px;">Aucune annonce</p>';
        return;
    }

    const sortedAnnonces = [...appData.annonces].sort((a, b) =>
        new Date(b.date_creation) - new Date(a.date_creation)
    );

    sortedAnnonces.forEach(annonce => {
        const card = document.createElement('div');
        card.className = 'announcement-card';
        card.innerHTML = `
            <div class="announcement-date">${new Date(annonce.date_creation).toLocaleString()}</div>
            <div class="announcement-title">${annonce.titre}</div>
            <div class="announcement-content">${annonce.contenu}</div>
        `;
        container.appendChild(card);
    });
}

// Charger les statistiques pour l'export
function loadStats() {
    const totalMembres = appData.membres.length;
    const now = new Date();
    const thisMonth = appData.transactions.filter(t => {
        const d = new Date(t.date_transaction);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const ca = thisMonth.reduce((sum, t) => sum + t.montant_total, 0);
    const ardoisesTotales = appData.membres.reduce((sum, m) => sum + m.ardoise, 0);

    const statTotalMembres = document.getElementById('statTotalMembres');
    const statTransactionsMois = document.getElementById('statTransactionsMois');
    const statCA = document.getElementById('statCA');
    const statArdoises = document.getElementById('statArdoises');

    if (statTotalMembres) statTotalMembres.textContent = totalMembres;
    if (statTransactionsMois) statTransactionsMois.textContent = thisMonth.length;
    if (statCA) statCA.textContent = ca.toFixed(2) + ' €';
    if (statArdoises) statArdoises.textContent = ardoisesTotales.toFixed(2) + ' €';
}

// Mettre à jour l'onglet membres pour afficher les détails
function updateMembersTable() {
    loadMembers(); // Fonction existante

    // Ajouter un clic sur chaque ligne pour afficher les détails
    const rows = document.querySelectorAll('#membersTableBody tr');
    rows.forEach(row => {
        const membreId = parseInt(row.getAttribute('data-membre-id'));
        if (membreId) {
            row.style.cursor = 'pointer';
            row.onclick = () => showMembreDetails(membreId);
        }
    });
}

// ===== GESTION DES ARCHIVES D'ÉVÉNEMENTS =====

// Changer d'onglet entre "À venir" et "Archives"
function switchEventTab(tab) {
    // Gérer les boutons
    const buttons = document.querySelectorAll('.sub-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Gérer les contenus
    if (tab === 'upcoming') {
        document.getElementById('eventsUpcomingTab').style.display = 'block';
        document.getElementById('eventsArchivesTab').style.display = 'none';
    } else if (tab === 'archives') {
        document.getElementById('eventsUpcomingTab').style.display = 'none';
        document.getElementById('eventsArchivesTab').style.display = 'block';
        loadEventsArchives();
    }
}

// Charger les événements archivés
function loadEventsArchives() {
    const container = document.getElementById('eventsArchivesList');
    if (!container) return;

    container.innerHTML = '';

    if (!appData.evenements) appData.evenements = [];

    // Filtrer les événements passés
    const now = new Date();
    const pastEvents = appData.evenements.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate < now;
    });

    if (pastEvents.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#e0e0e0;padding:20px;">Aucun événement archivé</p>';
        return;
    }

    // Trier du plus ancien au plus récent
    pastEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    pastEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const jeu = event.jeu_id ? appData.ludotheque.find(j => j.id === event.jeu_id) : null;
        const participants = event.participants || [];

        // Déterminer le style selon le type d'événement
        const typeEvenement = event.type_evenement || 'partie';
        const eventStyles = {
            initiation: {
                icon: '🎓',
                label: 'Initiation',
                borderColor: '#3498db',
                bgColor: 'rgba(52, 152, 219, 0.1)'
            },
            partie: {
                icon: '🎲',
                label: 'Partie classique',
                borderColor: '#2ecc71',
                bgColor: 'rgba(46, 204, 113, 0.1)'
            },
            tournoi: {
                icon: '🏆',
                label: 'Tournoi',
                borderColor: '#f39c12',
                bgColor: 'rgba(243, 156, 18, 0.1)'
            },
            wargame: {
                icon: '⚔️',
                label: 'Wargame',
                borderColor: '#e74c3c',
                bgColor: 'rgba(231, 76, 60, 0.1)'
            },
            tcg: {
                icon: '🃏',
                label: 'TCG',
                borderColor: '#9b59b6',
                bgColor: 'rgba(155, 89, 182, 0.1)'
            },
            jdr: {
                icon: '🎲',
                label: 'JDR',
                borderColor: '#1abc9c',
                bgColor: 'rgba(26, 188, 156, 0.1)'
            }
        };

        const style = eventStyles[typeEvenement] || eventStyles.partie;

        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.opacity = '0.8';
        card.style.borderLeft = `4px solid ${style.borderColor}`;
        card.style.background = `linear-gradient(135deg, ${style.bgColor}, rgba(255, 255, 255, 0.05))`;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <span style="font-size: 24px;">${style.icon}</span>
                        <div>
                            <strong style="font-size: 16px; color: #fff;">${event.titre}</strong>
                            <div style="color: ${style.borderColor}; font-size: 11px; font-weight: bold;">${style.label}</div>
                        </div>
                    </div>
                    <div style="color: #999; font-size: 13px;">
                        📅 ${eventDate.toLocaleDateString()} à ${event.heure}
                    </div>
                </div>
            </div>
            ${event.description ? `<div style="margin: 10px 0; color: #e0e0e0; font-size: 14px;">${event.description}</div>` : ''}
            ${jeu ? `<div style="background: rgba(255, 215, 0, 0.1); padding: 10px; border-radius: 5px; margin: 10px 0; border-left: 3px solid #ffd700;">
                <strong style="color: #ffd700;">🎲 ${jeu.nom}</strong>
                <div style="color: #e0e0e0; font-size: 12px; margin-top: 5px;">
                    ${jeu.min_joueurs}-${jeu.max_joueurs} joueurs • ${jeu.duree} min • ${jeu.age_min}+
                </div>
            </div>` : ''}
            ${participants.length > 0 ? `
                <div style="margin-top: 10px;">
                    <strong style="color: #e0e0e0;">Participants (${participants.filter(p => p.type === 'joueur').length}):</strong>
                    <div style="margin-top: 5px;">
                        ${participants.filter(p => p.type === 'joueur').map(p =>
                            `<span class="badge success" style="margin: 2px;">${p.nom}</span>`
                        ).join('')}
                    </div>
                    ${participants.filter(p => p.type === 'reserve').length > 0 ? `
                        <div style="margin-top: 5px;">
                            <strong style="color: #999;">Réserve (${participants.filter(p => p.type === 'reserve').length}):</strong>
                            <div style="margin-top: 5px;">
                                ${participants.filter(p => p.type === 'reserve').map(p =>
                                    `<span class="badge warning" style="margin: 2px;">${p.nom}</span>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : '<div style="color: #999; font-style: italic;">Aucun participant</div>'}
        `;

        container.appendChild(card);
    });
}
