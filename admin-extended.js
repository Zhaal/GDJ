// ===== GESTION DE LA LUDOTHÈQUE =====

let currentSearchLudo = '';
let currentDureeFilter = 'all';

function loadLudotheque(searchTerm = '', dureeFilter = 'all') {
    const container = document.getElementById('ludothequeList');
    if (!container) return;

    currentSearchLudo = searchTerm.toLowerCase();
    currentDureeFilter = dureeFilter;

    container.innerHTML = '';

    // Filtrer les jeux (exclure les extensions qui sont rattachées à un jeu de base)
    let filteredGames = appData.ludotheque.filter(game => {
        // Exclure les extensions rattachées
        if (game.est_extension && game.jeu_de_base) {
            return false;
        }

        // Filtre de recherche
        const matchesSearch = game.nom.toLowerCase().includes(currentSearchLudo) ||
                              game.proprietaire.toLowerCase().includes(currentSearchLudo) ||
                              (game.description && game.description.toLowerCase().includes(currentSearchLudo));

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

        return matchesSearch && matchesDuree;
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

        const detailsId = `game-details-${game.id}`;
        const isExpanded = card.dataset.expanded === 'true';

        // Calculer les données incluant les extensions
        const gameData = getGameDataWithExtensions(game);
        const extensionBadge = gameData.extensionsCount > 0 ? ` <span style="color: #ffd700; font-size: 14px;">(${gameData.extensionsCount})</span>` : '';

        card.innerHTML = `
            <div class="game-content" style="flex-grow: 1;">
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

                    <div class="game-actions" style="margin-top: 15px;">
                        <button class="btn-edit" onclick="event.stopPropagation(); editGame(${game.id})">Modifier</button>
                        <button class="btn-danger" onclick="event.stopPropagation(); deleteGame(${game.id})">Supprimer</button>
                        <button class="btn-secondary" onclick="event.stopPropagation(); showGameDetailsDialog(${game.id})">📸 Photos</button>
                        <button class="btn-primary" onclick="event.stopPropagation(); gererExtensions(${game.id})">🧩 Extensions</button>
                    </div>
                </div>
            </div>
        `;

        // Ajouter un événement click pour plier/déplier
        card.addEventListener('click', (e) => {
            // Ne pas toggle si on clique sur un bouton
            if (e.target.closest('.game-actions') || e.target.tagName === 'BUTTON' || e.target.tagName === 'IMG') {
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

function editGame(id) {
    const game = appData.ludotheque.find(g => g.id === id);
    if (!game) return;

    document.getElementById('gameId').value = game.id;
    document.getElementById('gameNom').value = game.nom;
    document.getElementById('gameProprietaire').value = game.proprietaire;
    document.getElementById('gameMinJoueurs').value = game.min_joueurs;
    document.getElementById('gameMaxJoueurs').value = game.max_joueurs;
    document.getElementById('gameDuree').value = game.duree;
    document.getElementById('gameAge').value = game.age_min;
    document.getElementById('gameDescription').value = game.description || '';

    document.getElementById('gameForm').style.display = 'block';
    document.getElementById('gameFormTitle').textContent = 'Modifier un jeu';
}

function deleteGame(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce jeu ?')) return;

    appData.ludotheque = appData.ludotheque.filter(g => g.id !== id);
    saveLocalData();
    syncWithGitHub();
    loadLudotheque();
}

// Charger la liste des membres ayant des jeux
function loadMembreFilterLudo() {
    const select = document.getElementById('membreFilterLudo');
    if (!select) return;

    // Garder la première option
    select.innerHTML = '<option value="">-- Sélectionner un membre --</option>';

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

    // Ajouter une option pour chaque propriétaire ayant au moins 1 jeu
    Object.keys(proprietaires).sort().forEach(proprietaire => {
        const option = document.createElement('option');
        option.value = proprietaire;
        option.textContent = `${proprietaire} (${proprietaires[proprietaire]} jeu${proprietaires[proprietaire] > 1 ? 'x' : ''})`;
        select.appendChild(option);
    });

    // Event listener
    select.onchange = (e) => {
        loadLudothequeByMembre(e.target.value);
    };
}

// Afficher les jeux d'un membre spécifique
function loadLudothequeByMembre(proprietaire) {
    const container = document.getElementById('ludothequeByMembreList');
    if (!container) return;

    container.innerHTML = '';

    if (!proprietaire) {
        container.innerHTML = '<p style="text-align:center;color:#fff;padding:20px;">Sélectionnez un membre pour voir ses jeux</p>';
        return;
    }

    // Filtrer les jeux du membre (exclure les extensions rattachées)
    const games = appData.ludotheque.filter(g =>
        g.proprietaire === proprietaire &&
        !(g.est_extension && g.jeu_de_base)
    );

    if (games.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#fff;padding:20px;">Ce membre n\'a aucun jeu enregistré</p>';
        return;
    }

    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.cursor = 'pointer';

        const detailsId = `game-membre-details-${game.id}`;

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
                ${createTruncatedDescription(game.description, game.id)}
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
                    <button class="btn-primary" onclick="event.stopPropagation(); gererExtensions(${game.id})" style="margin-left: 10px;">🧩 Extensions</button>
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

// ===== GESTION DES ADHÉSIONS =====

function loadAdhesions() {
    const tbody = document.getElementById('adhesionsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Filtrer les admins
    appData.membres
        .filter(membre => membre.role !== 'admin')
        .forEach(membre => {
        const adhesion = appData.adhesions.find(a => a.membre_id === membre.id && a.annee === new Date().getFullYear());
        const status = adhesion && new Date(adhesion.date_fin) > new Date() ? 'active' : 'expired';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${membre.pseudo || membre.email}</td>
            <td>${membre.prenom} ${membre.nom}</td>
            <td>${membre.email || '-'}</td>
            <td>
                <span class="adhesion-status ${status}">
                    ${status === 'active' ? '✓ À jour' : '✗ Expirée'}
                </span>
            </td>
            <td>${adhesion ? new Date(adhesion.date_debut).toLocaleDateString() : '-'}</td>
            <td>${adhesion ? new Date(adhesion.date_fin).toLocaleDateString() : '-'}</td>
            <td>${adhesion ? adhesion.montant.toFixed(2) + ' €' : '-'}</td>
            <td>
                <button class="btn-primary" onclick="ajouterAdhesion(${membre.id})">
                    ${adhesion ? 'Renouveler' : 'Créer'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function ajouterAdhesion(membreId) {
    const membre = appData.membres.find(m => m.id === membreId);
    if (!membre) return;

    const dateDebut = new Date();
    const currentMonth = dateDebut.getMonth(); // 0-11

    // Calcul automatique du montant selon la période
    // Octobre (9) à Décembre (11): 20€
    // Janvier (0) à Septembre (8): 15€
    let montant = (currentMonth >= 0 && currentMonth <= 8) ? 15 : 20;

    // Permettre à l'admin de modifier si besoin
    const montantInput = await prompt(`Montant de la cotisation (€):\n(${montant}€ suggéré pour cette période)`, montant.toString());
    if (!montantInput) return;
    montant = parseFloat(montantInput);

    // Demander le mode de paiement
    const modePaiementOptions = [
        { value: 'especes', label: 'Espèces' },
        { value: 'paypal', label: 'PayPal' },
        { value: 'autre', label: 'Autre' }
    ];
    const modePaiement = await showPromptSelect('Mode de paiement:', modePaiementOptions, 'Sélectionner le mode de paiement');
    if (!modePaiement) return;

    let modePaiementAutre = null;
    if (modePaiement === 'autre') {
        modePaiementAutre = await prompt('Précisez le mode de paiement:');
        if (!modePaiementAutre) return;
    }

    // Calculer la date de fin: prochain 1er octobre
    const dateFin = new Date(dateDebut);
    if (currentMonth >= 9) {
        // Octobre, Novembre, Décembre: fin = 1er octobre année suivante
        dateFin.setFullYear(dateFin.getFullYear() + 1);
        dateFin.setMonth(9); // Octobre
    } else {
        // Janvier à Septembre: fin = 1er octobre même année
        dateFin.setMonth(9); // Octobre
    }
    dateFin.setDate(1);
    dateFin.setHours(0, 0, 0, 0);

    const adhesion = {
        id: ++appData.settings.lastAdhesionId,
        membre_id: membreId,
        annee: dateDebut.getFullYear(),
        montant: montant,
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
        mode_paiement: modePaiement,
        mode_paiement_autre: modePaiementAutre,
        date_creation: new Date().toISOString()
    };

    appData.adhesions.push(adhesion);
    saveLocalData();
    syncWithGitHub();
    loadAdhesions();

    const paiementStr = modePaiement === 'autre' ? modePaiementAutre :
                       modePaiement === 'especes' ? 'Espèces' : 'PayPal';
    alert(`Adhésion créée pour ${membre.prenom} ${membre.nom}\nMontant: ${montant}€\nPaiement: ${paiementStr}\nValide jusqu'au ${dateFin.toLocaleDateString()}`);
}

// ===== CALENDRIER =====

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function loadCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <button class="btn-secondary" onclick="changeMonth(-1)">← Précédent</button>
            <h2>${monthNames[currentMonth]} ${currentYear}</h2>
            <button class="btn-secondary" onclick="changeMonth(1)">Suivant →</button>
        </div>
        <div class="calendar-grid">
            <div style="font-weight:bold;text-align:center;">Lun</div>
            <div style="font-weight:bold;text-align:center;">Mar</div>
            <div style="font-weight:bold;text-align:center;">Mer</div>
            <div style="font-weight:bold;text-align:center;">Jeu</div>
            <div style="font-weight:bold;text-align:center;">Ven</div>
            <div style="font-weight:bold;text-align:center;">Sam</div>
            <div style="font-weight:bold;text-align:center;">Dim</div>
        </div>
        <div id="calendarDays" class="calendar-grid"></div>
    `;

    renderCalendar();
}

function renderCalendar() {
    // Essayer les deux conteneurs (admin et membre)
    let daysContainer = document.getElementById('calendarDays');
    if (!daysContainer) {
        daysContainer = document.getElementById('calendarDaysMembre');
    }
    if (!daysContainer) return;

    daysContainer.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const prevLastDay = new Date(currentYear, currentMonth, 0);

    let dayOfWeek = firstDay.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajuster pour que lundi = 0

    // Jours du mois précédent
    for (let i = dayOfWeek - 1; i >= 0; i--) {
        const day = prevLastDay.getDate() - i;
        const dayDiv = createDayElement(day, true, false);
        daysContainer.appendChild(dayDiv);
    }

    // Jours du mois actuel
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayDiv = createDayElement(day, false, false);
        daysContainer.appendChild(dayDiv);
    }

    // Jours du mois suivant
    const remainingDays = 42 - daysContainer.children.length; // 6 semaines * 7 jours
    for (let day = 1; day <= remainingDays; day++) {
        const dayDiv = createDayElement(day, true, true);
        daysContainer.appendChild(dayDiv);
    }
}

function createDayElement(day, otherMonth, isNext) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day' + (otherMonth ? ' other-month' : '');

    // Calculer la date correcte selon le mois
    let year = currentYear;
    let month = currentMonth;

    if (otherMonth) {
        if (isNext) {
            // Mois suivant
            month = currentMonth + 1;
            if (month > 11) {
                month = 0;
                year++;
            }
        } else {
            // Mois précédent
            month = currentMonth - 1;
            if (month < 0) {
                month = 11;
                year--;
            }
        }
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // S'assurer que evenements existe
    if (!appData.evenements) appData.evenements = [];

    const hasEvent = appData.evenements.some(e => e.date.startsWith(dateStr));

    if (hasEvent && !otherMonth) {
        dayDiv.classList.add('has-event');
    }

    dayDiv.innerHTML = `
        <div class="calendar-day-number">${day}</div>
        ${hasEvent && !otherMonth ? '<div class="event-dot"></div>' : ''}
    `;

    if (!otherMonth) {
        dayDiv.onclick = () => showDayEvents(dateStr);
    }

    return dayDiv;
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    // Mettre à jour le titre et re-render
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    // Chercher le H2 dans les deux calendriers (admin et membre)
    const titleAdmin = document.querySelector('#calendarContainer h2');
    const titleMembre = document.querySelector('#calendarContainerMembre h2');

    if (titleAdmin) {
        titleAdmin.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
    if (titleMembre) {
        titleMembre.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }

    renderCalendar();
}

function showDayEvents(date) {
    // S'assurer que evenements existe
    if (!appData.evenements) appData.evenements = [];

    const events = appData.evenements.filter(e => e.date.startsWith(date));

    if (events.length === 0) {
        if (currentUser.role === 'admin') {
            if (confirm('Aucun événement ce jour. Voulez-vous en créer un ?')) {
                ajouterEvenement(date);
            }
        } else {
            alert('Aucun événement ce jour');
        }
        return;
    }

    // Pour l'admin, afficher avec modal pour gérer les événements
    if (currentUser.role === 'admin') {
        afficherModalEvenements(events);
    } else {
        let message = `Événements du ${new Date(date).toLocaleDateString()} :\n\n`;
        events.forEach(e => {
            message += `• ${e.titre} (${e.heure})\n  ${e.description}\n\n`;
        });
        alert(message);
    }
}

function afficherModalEvenements(events) {
    const modal = document.createElement('div');
    modal.className = 'modal active';

    let html = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Événements du ${new Date(events[0].date).toLocaleDateString()}</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
    `;

    events.forEach(e => {
        const jeu = e.jeu_id ? appData.ludotheque.find(j => j.id === e.jeu_id) : null;
        const participants = e.participants || [];

        // Déterminer le style selon le type d'événement
        const typeEvenement = e.type_evenement || 'partie';
        const eventStyles = {
            initiation: { icon: '🎓', label: 'Initiation', borderColor: '#3498db', bgColor: 'rgba(52, 152, 219, 0.1)' },
            partie: { icon: '🎲', label: 'Partie classique', borderColor: '#2ecc71', bgColor: 'rgba(46, 204, 113, 0.1)' },
            tournoi: { icon: '🏆', label: 'Tournoi', borderColor: '#f39c12', bgColor: 'rgba(243, 156, 18, 0.1)' },
            wargame: { icon: '⚔️', label: 'Wargame', borderColor: '#e74c3c', bgColor: 'rgba(231, 76, 60, 0.1)' },
            tcg: { icon: '🃏', label: 'TCG', borderColor: '#9b59b6', bgColor: 'rgba(155, 89, 182, 0.1)' },
            jdr: { icon: '🎲', label: 'JDR', borderColor: '#1abc9c', bgColor: 'rgba(26, 188, 156, 0.1)' }
        };
        const style = eventStyles[typeEvenement] || eventStyles.partie;

        html += `
            <div class="game-card" style="margin-bottom: 15px; border-left: 4px solid ${style.borderColor}; background: linear-gradient(135deg, ${style.bgColor}, rgba(255, 255, 255, 0.5));">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                            <span style="font-size: 24px;">${style.icon}</span>
                            <div>
                                <strong style="font-size: 16px;">${e.titre}</strong>
                                <div style="color: ${style.borderColor}; font-size: 11px; font-weight: bold;">${style.label}</div>
                            </div>
                        </div>
                        <div style="color: #e0e0e0; font-size: 14px;">${e.heure}</div>
                    </div>
                    <div>
                        <button class="btn-edit" onclick="modifierEvenement(${e.id})">Modifier</button>
                        <button class="btn-danger" onclick="supprimerEvenement(${e.id})">Supprimer</button>
                    </div>
                </div>
                ${e.description ? `<div style="margin: 10px 0; color: #e0e0e0;">${e.description}</div>` : ''}
                ${jeu ? `<div style="background: #f0f4ff; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    <strong>🎲 ${jeu.nom}</strong> (${jeu.min_joueurs}-${jeu.max_joueurs} joueurs)
                </div>` : ''}
                ${participants.length > 0 ? `
                    <div style="margin-top: 10px;">
                        <strong>Participants (${participants.filter(p => p.type === 'joueur').length}):</strong>
                        ${participants.filter(p => p.type === 'joueur').map(p =>
                            `<span class="badge success" style="margin: 2px;">${p.nom}</span>`
                        ).join('')}
                        ${participants.filter(p => p.type === 'reserve').length > 0 ? `
                            <div style="margin-top: 5px;">
                                <strong>Réserve (${participants.filter(p => p.type === 'reserve').length}):</strong>
                                ${participants.filter(p => p.type === 'reserve').map(p =>
                                    `<span class="badge warning" style="margin: 2px;">${p.nom}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    });

    html += `</div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

async function modifierEvenement(eventId) {
    const event = appData.evenements.find(e => e.id === eventId);
    if (!event) return;

    const titre = await prompt('Titre de l\'événement:', event.titre);
    if (!titre) return;

    const date = await showPromptDate('Date de l\'événement:', event.date);
    if (!date) return;

    const heure = await prompt('Heure (HH:MM):', event.heure);
    const description = await prompt('Description:', event.description);

    // Proposer de modifier le jeu lié
    let jeuId = event.jeu_id;
    let maxParticipants = event.max_participants;
    if (appData.ludotheque && appData.ludotheque.length > 0) {
        const modifierJeu = await confirm('Voulez-vous modifier le jeu lié ? (Annuler pour garder le jeu actuel)');
        if (modifierJeu) {
            const jeuxListe = appData.ludotheque.map(j => `${j.id}: ${j.nom} (${j.min_joueurs}-${j.max_joueurs} joueurs)`).join('\n');
            const selectedJeuId = await prompt('Choisissez un jeu (0 pour aucun):\n' + jeuxListe, jeuId || '0');
            jeuId = parseInt(selectedJeuId) || null;
        }
    }

    // Si pas de jeu lié, demander le nombre max de participants
    if (!jeuId) {
        const maxPart = await prompt('Nombre maximum de participants (optionnel):', maxParticipants || '');
        if (maxPart && !isNaN(parseInt(maxPart))) {
            maxParticipants = parseInt(maxPart);
        } else if (!maxPart) {
            maxParticipants = null;
        }
    } else {
        maxParticipants = null;
    }

    event.titre = titre;
    event.date = date;
    event.heure = heure || '19:00';
    event.description = description || '';
    event.jeu_id = jeuId;
    event.max_participants = maxParticipants;

    saveLocalData();
    syncWithGitHub();
    document.querySelector('.modal')?.remove();
    renderCalendar();
    await showAlert('Événement modifié !');
}

function supprimerEvenement(eventId) {
    const event = appData.evenements.find(e => e.id === eventId);
    if (!event) return;

    const participants = event.participants || [];
    let confirmMsg = `Êtes-vous sûr de vouloir supprimer l'événement "${event.titre}" ?`;
    if (participants.length > 0) {
        confirmMsg += `\n\n${participants.length} personne(s) inscrite(s) sera(ont) affectée(s).`;
    }

    if (!confirm(confirmMsg)) return;

    appData.evenements = appData.evenements.filter(e => e.id !== eventId);
    saveLocalData();
    syncWithGitHub();
    document.querySelector('.modal')?.remove();
    renderCalendar();
    alert('Événement supprimé.');
}

async function ajouterEvenement(date = null) {
    // S'assurer que evenements existe
    if (!appData.evenements) appData.evenements = [];
    if (!appData.settings.lastEvenementId) appData.settings.lastEvenementId = 0;

    const titre = await prompt('Titre de l\'événement:');
    if (!titre) return;

    const selectedDate = date || await showPromptDate('Date de l\'événement:', new Date().toISOString().split('T')[0]);
    if (!selectedDate) return;

    const heure = await prompt('Heure (HH:MM):', '19:00');
    const description = await prompt('Description:');

    // Proposer de lier un jeu
    let jeuId = null;
    let maxParticipants = null;
    if (appData.ludotheque && appData.ludotheque.length > 0) {
        const lierJeu = await confirm('Voulez-vous lier un jeu de la ludothèque à cet événement ?');
        if (lierJeu) {
            const jeuxListe = appData.ludotheque.map(j => `${j.id}: ${j.nom} (${j.min_joueurs}-${j.max_joueurs} joueurs)`).join('\n');
            const selectedJeuId = parseInt(await prompt('Choisissez un jeu (ID):\n' + jeuxListe));
            if (selectedJeuId && appData.ludotheque.find(j => j.id === selectedJeuId)) {
                jeuId = selectedJeuId;
            }
        }
    }

    // Si pas de jeu lié, demander le nombre max de participants
    if (!jeuId) {
        const maxPart = await prompt('Nombre maximum de participants (optionnel):');
        if (maxPart && !isNaN(parseInt(maxPart))) {
            maxParticipants = parseInt(maxPart);
        }
    }

    const evenement = {
        id: ++appData.settings.lastEvenementId,
        titre,
        date: selectedDate,
        heure: heure || '19:00',
        description: description || '',
        jeu_id: jeuId,
        max_participants: maxParticipants,
        participants: [], // { membre_id, nom, type: 'joueur' ou 'reserve' }
        createur_id: currentUser.id,
        date_creation: new Date().toISOString()
    };

    appData.evenements.push(evenement);
    saveLocalData();
    syncWithGitHub();
    renderCalendar();
    await showAlert('Événement créé !');
}

// ===== ANNONCES =====

function loadAnnonces() {
    const container = document.getElementById('annoncesList');
    if (!container) return;

    container.innerHTML = '';

    if (appData.annonces.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#e0e0e0;padding:20px;">Aucune annonce</p>';
        return;
    }

    // Trier par date décroissante
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
            ${currentUser.role === 'admin' ? `
                <div style="margin-top:10px;">
                    <button class="btn-danger" onclick="deleteAnnonce(${annonce.id})">Supprimer</button>
                </div>
            ` : ''}
        `;
        container.appendChild(card);
    });
}

function deleteAnnonce(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    appData.annonces = appData.annonces.filter(a => a.id !== id);
    saveLocalData();
    syncWithGitHub();
    loadAnnonces();
}

// ===== DÉTAILS MEMBRES (ADMIN) =====

function showMembreDetails(membreId) {
    const membre = appData.membres.find(m => m.id === membreId);
    if (!membre) return;

    const transactions = appData.transactions.filter(t => t.membre_id === membreId);
    const adhesion = appData.adhesions.find(a => a.membre_id === membreId && a.annee === new Date().getFullYear());

    const totalDepense = transactions.reduce((sum, t) => sum + t.montant_total, 0);

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${membre.prenom} ${membre.nom}</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Ardoise</h3>
                    <p class="stat-value">${membre.ardoise.toFixed(2)} €</p>
                </div>
                <div class="stat-card">
                    <h3>Total dépensé</h3>
                    <p class="stat-value">${totalDepense.toFixed(2)} €</p>
                </div>
                <div class="stat-card">
                    <h3>Transactions</h3>
                    <p class="stat-value">${transactions.length}</p>
                </div>
            </div>

            <div class="info-label">Email</div>
            <div class="info-value">${membre.email}</div>

            <div class="info-label">Rôle</div>
            <div class="info-value">${membre.role}</div>

            <div class="info-label">Adhésion</div>
            <div class="info-value">
                ${adhesion ?
                    `✓ À jour jusqu'au ${new Date(adhesion.date_fin).toLocaleDateString()}` :
                    '✗ Pas d\'adhésion active'}
            </div>

            <div class="info-label">Inscrit depuis</div>
            <div class="info-value">${new Date(membre.date_inscription).toLocaleDateString()}</div>
        </div>
    `;

    document.body.appendChild(modal);
}

// ===== EXPORT EXCEL =====

function exportToExcel(month, year) {
    const transactions = appData.transactions.filter(t => {
        const date = new Date(t.date_transaction);
        return date.getMonth() === month && date.getFullYear() === year;
    });

    if (transactions.length === 0) {
        alert('Aucune transaction pour ce mois');
        return;
    }

    let csv = 'Date,Membre,Produits,Montant,Mode de paiement,Statut\n';

    transactions.forEach(t => {
        const membre = appData.membres.find(m => m.id === t.membre_id);
        const produits = t.produits.map(p => `${p.nom} (x${p.quantite})`).join(' - ');

        csv += `"${new Date(t.date_transaction).toLocaleString()}",`;
        csv += `"${membre ? membre.prenom + ' ' + membre.nom : 'Inconnu'}",`;
        csv += `"${produits}",`;
        csv += `"${t.montant_total.toFixed(2)}",`;
        csv += `"${t.mode_paiement}",`;
        csv += `"${t.statut}"\n`;
    });

    // Télécharger le fichier
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${year}_${String(month + 1).padStart(2, '0')}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showExportDialog() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    if (confirm(`Exporter les transactions de ${getMonthName(month)} ${year} ?`)) {
        exportToExcel(month, year);
    }
}

function getMonthName(month) {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month];
}
