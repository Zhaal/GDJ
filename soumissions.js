// ===== SOUMISSIONS DES MEMBRES =====

// Soumettre un événement (membre)
async function soumettrEvenement() {
    if (!currentUser) {
        await showAlert('Vous devez être connecté pour proposer un événement');
        return;
    }

    // Initialiser les paramètres
    initSettings();
    const filtrageActif = appData.settings.soumissions.evenements.active;

    // Tous les types d'événements disponibles
    const tousLesTypes = [
        { value: 'initiation', label: '🎓 Initiation' },
        { value: 'partie', label: '🎲 Partie classique' },
        { value: 'tournoi', label: '🏆 Tournoi' },
        { value: 'wargame', label: '⚔️ Wargame' },
        { value: 'tcg', label: '🃏 TCG' },
        { value: 'jdr', label: '🎲 JDR' }
    ];

    const typeEvenement = await showPromptSelect('Type d\'événement:', tousLesTypes, 'Sélectionner le type');
    if (!typeEvenement) return;

    const titre = await prompt('Titre de l\'événement:');
    if (!titre) return;

    const date = await showPromptDate('Date de l\'événement:', new Date().toISOString().split('T')[0]);
    if (!date) return;

    const heure = await prompt('Heure (HH:MM):', '19:00');
    const description = await prompt('Description:');

    // Proposer de lier un jeu
    let jeuId = null;
    let maxParticipants = null;
    if (appData.ludotheque && appData.ludotheque.length > 0) {
        const lierJeu = await confirm('Voulez-vous lier un jeu de la ludothèque à cet événement ?');
        if (lierJeu) {
            const selectedJeuId = await showGameSearchDialog('Choisissez un jeu');
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

    // Déterminer si ce type nécessite une validation
    let validationRequise = false;
    if (filtrageActif) {
        // Si le filtrage est actif, vérifier si ce type spécifique nécessite validation
        const typesEvenements = appData.settings.soumissions.evenements.types;
        validationRequise = typesEvenements[typeEvenement] === true;
    }
    // Si filtrage inactif, validationRequise reste false

    if (validationRequise) {
        // Créer une soumission pour validation
        if (!appData.soumissions) appData.soumissions = [];
        if (!appData.settings.lastSoumissionId) appData.settings.lastSoumissionId = 0;

        const soumission = {
            id: ++appData.settings.lastSoumissionId,
            type: 'evenement',
            statut: 'en_attente',
            auteur_id: currentUser.id,
            date_soumission: new Date().toISOString(),
            data: {
                titre,
                date,
                heure: heure || '19:00',
                description: description || '',
                jeu_id: jeuId,
                type_evenement: typeEvenement,
                max_participants: maxParticipants
            }
        };

        appData.soumissions.push(soumission);
        saveLocalData();
        syncWithGitHub();

        if (typeof updateSoumissionsBadge === 'function') {
            updateSoumissionsBadge();
        }

        await showAlert('✓ Événement soumis pour validation ! Il sera visible après validation par un administrateur.');
    } else {
        // Ajouter directement l'événement sans validation
        if (!appData.evenements) appData.evenements = [];
        if (!appData.settings.lastEvenementId) appData.settings.lastEvenementId = 0;

        const evenement = {
            id: ++appData.settings.lastEvenementId,
            titre,
            date,
            heure: heure || '19:00',
            description: description || '',
            jeu_id: jeuId,
            type_evenement: typeEvenement,
            max_participants: maxParticipants,
            participants: [],
            createur_id: currentUser.id,
            date_creation: new Date().toISOString()
        };

        appData.evenements.push(evenement);
        saveLocalData();
        syncWithGitHub();

        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }

        await showAlert('✓ Événement créé avec succès ! Il est immédiatement visible dans le calendrier.');
    }
}

// Soumettre un jeu (membre)
async function soumettreJeu() {
    if (!currentUser) {
        await showAlert('Vous devez être connecté pour proposer un jeu');
        return;
    }

    // Vérifier si les soumissions de jeux nécessitent une validation
    initSettings();
    const validationRequise = appData.settings.soumissions.jeux.active;

    const nom = await prompt('Nom du jeu:');
    if (!nom) return;

    const proprietaire = await prompt('Propriétaire:', `${currentUser.prenom} ${currentUser.nom}`);
    if (!proprietaire) return;

    const minJoueurs = parseInt(await prompt('Nombre minimum de joueurs:'));
    const maxJoueurs = parseInt(await prompt('Nombre maximum de joueurs:'));

    // Utiliser un select pour la durée
    const dureeOptions = [
        { value: '10', label: '≤ 10 minutes' },
        { value: '30', label: '≤ 30 minutes' },
        { value: '60', label: '≤ 60 minutes (1h)' },
        { value: '120', label: '≤ 120 minutes (2h)' },
        { value: '240', label: '≤ 240 minutes (4h)' },
        { value: '360', label: '> 240 minutes (6h+)' }
    ];
    const duree = parseInt(await showPromptSelect('Durée moyenne du jeu:', dureeOptions, 'Sélectionner la durée'));
    if (!duree) return;

    const age = parseInt(await prompt('Âge minimum:'));
    const description = await prompt('Description du jeu:');

    if (!minJoueurs || !maxJoueurs || !age) {
        await showAlert('Tous les champs sont requis');
        return;
    }

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
            data: {
                nom,
                proprietaire,
                min_joueurs: minJoueurs,
                max_joueurs: maxJoueurs,
                duree,
                age_min: age,
                description: description || ''
            }
        };

        appData.soumissions.push(soumission);
        saveLocalData();
        syncWithGitHub();

        if (typeof updateSoumissionsBadge === 'function') {
            updateSoumissionsBadge();
        }

        await showAlert('✓ Jeu soumis pour validation ! Il sera visible dans la ludothèque après validation par un administrateur.');
    } else {
        // Ajouter directement le jeu sans validation
        if (!appData.ludotheque) appData.ludotheque = [];
        if (!appData.settings.lastGameId) appData.settings.lastGameId = 0;

        const jeu = {
            id: ++appData.settings.lastGameId,
            nom,
            proprietaire,
            min_joueurs: minJoueurs,
            max_joueurs: maxJoueurs,
            duree,
            age_min: age,
            description: description || '',
            date_ajout: new Date().toISOString(),
            auteur_id: currentUser.id
        };

        appData.ludotheque.push(jeu);
        saveLocalData();
        syncWithGitHub();

        // Recharger la ludothèque si l'utilisateur est sur cette page
        if (typeof loadLudotheque === 'function') {
            loadLudotheque();
        }
        if (typeof loadLudothequeMembre === 'function') {
            loadLudothequeMembre();
        }

        await showAlert('✓ Jeu ajouté avec succès ! Il est immédiatement visible dans la ludothèque.');
    }
}

// Afficher les soumissions en attente (admin et modérateurs)
async function afficherSoumissionsEnAttente() {
    if (!currentUser) {
        await showAlert('Vous devez être connecté');
        return;
    }

    // Vérifier si l'utilisateur est admin ou modérateur
    const estAdmin = currentUser.role === 'admin';
    const estModo = estModerateur && estModerateur(currentUser.id);

    if (!estAdmin && !estModo) {
        await showAlert('Accès réservé aux administrateurs et modérateurs');
        return;
    }

    // S'assurer que soumissions existe
    if (!appData.soumissions) appData.soumissions = [];

    const soumissionsEnAttente = appData.soumissions.filter(s => s.statut === 'en_attente');

    if (soumissionsEnAttente.length === 0) {
        await showAlert('Aucune soumission en attente');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal active';

    let html = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2>Soumissions en attente (${soumissionsEnAttente.length})</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
    `;

    soumissionsEnAttente.forEach(s => {
        const auteur = appData.membres.find(m => m.id === s.auteur_id);
        const auteurNom = auteur ? `${auteur.prenom} ${auteur.nom}` : 'Inconnu';

        html += `
            <div class="game-card" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <div style="font-weight: bold; font-size: 16px; color: #667eea;">
                            ${s.type === 'jeu' ? '🎲 Jeu' : s.type === 'evenement' ? '📅 Événement' : '📸 Photo'}
                        </div>
                        <div style="color: #d0d0d0; font-size: 12px;">Soumis par ${auteurNom} le ${new Date(s.date_soumission).toLocaleDateString()}</div>
                    </div>
                    <div>
                        <button class="btn-primary" style="margin-right: 5px;" onclick="accepterSoumission(${s.id})">✓ Accepter</button>
                        <button class="btn-danger" onclick="refuserSoumission(${s.id})">✗ Refuser</button>
                    </div>
                </div>
        `;

        if (s.type === 'jeu') {
            html += `
                <div><strong>${s.data.nom}</strong></div>
                <div>Propriétaire: ${s.data.proprietaire}</div>
                <div>👥 ${s.data.min_joueurs}-${s.data.max_joueurs} joueurs | ⏱️ ${s.data.duree} min | 🎯 ${s.data.age_min}+</div>
                ${s.data.description ? `<div style="margin-top: 10px; color: #e0e0e0;">${s.data.description}</div>` : ''}
            `;
        } else if (s.type === 'evenement') {
            html += `
                <div><strong>${s.data.titre}</strong></div>
                <div>📅 ${new Date(s.data.date).toLocaleDateString()} à ${s.data.heure}</div>
                ${s.data.description ? `<div style="margin-top: 10px; color: #e0e0e0;">${s.data.description}</div>` : ''}
            `;
        } else if (s.type === 'photo') {
            html += `
                <div><strong>Photo pour : ${s.data.jeu_nom}</strong></div>
                <div style="margin-top: 10px;">
                    <img src="${s.data.photo_data}" alt="Photo soumise" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid rgba(255, 215, 0, 0.3); cursor: pointer;" onclick="showPhotoEnlarged('${s.data.photo_data}', '${s.data.jeu_nom}')" />
                </div>
            `;
        }

        html += `</div>`;
    });

    html += `</div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

// Accepter une soumission
async function accepterSoumission(soumissionId) {
    const soumission = appData.soumissions.find(s => s.id === soumissionId);
    if (!soumission) return;

    if (!await confirm('Accepter cette soumission ?')) return;

    // Marquer comme acceptée
    soumission.statut = 'accepte';
    soumission.date_validation = new Date().toISOString();
    soumission.validateur_id = currentUser.id;

    // Ajouter à la base de données
    if (soumission.type === 'jeu') {
        const jeu = {
            id: ++appData.settings.lastGameId,
            ...soumission.data,
            date_ajout: new Date().toISOString(),
            soumis_par: soumission.auteur_id
        };
        appData.ludotheque.push(jeu);
    } else if (soumission.type === 'evenement') {
        const evenement = {
            id: ++appData.settings.lastEvenementId,
            titre: soumission.data.titre,
            date: soumission.data.date,
            heure: soumission.data.heure,
            description: soumission.data.description,
            jeu_id: soumission.data.jeu_id || null,
            type_evenement: soumission.data.type_evenement || 'partie',
            max_participants: soumission.data.max_participants || null,
            participants: [],
            createur_id: soumission.auteur_id,
            date_creation: new Date().toISOString(),
            soumis_par: soumission.auteur_id
        };
        appData.evenements.push(evenement);
    } else if (soumission.type === 'photo') {
        // Ajouter la photo au jeu
        const jeu = appData.ludotheque.find(j => j.id === soumission.data.jeu_id);
        if (jeu) {
            if (!jeu.photos) jeu.photos = [];
            jeu.photos.push(soumission.data.photo_data);
        }
    }

    saveLocalData();
    syncWithGitHub();

    // Fermer la modal et recharger
    document.querySelector('.modal')?.remove();
    await showAlert('Soumission acceptée !');

    // Recharger les vues
    if (soumission.type === 'jeu') {
        loadLudotheque();
        loadLudothequeMembre();
    } else if (soumission.type === 'evenement') {
        loadCalendar();
        loadCalendarMembre();
    } else if (soumission.type === 'photo') {
        // Pas besoin de recharger pour les photos
    }

    // Mettre à jour le badge des soumissions
    updateSoumissionsBadge();
}

// Refuser une soumission
async function refuserSoumission(soumissionId) {
    const soumission = appData.soumissions.find(s => s.id === soumissionId);
    if (!soumission) return;

    const raison = await prompt('Raison du refus (optionnel):');

    soumission.statut = 'refuse';
    soumission.date_validation = new Date().toISOString();
    soumission.validateur_id = currentUser.id;
    soumission.raison_refus = raison || '';

    saveLocalData();
    syncWithGitHub();

    // Fermer la modal et recharger
    document.querySelector('.modal')?.remove();
    await showAlert('Soumission refusée.');

    // Mettre à jour le badge des soumissions
    updateSoumissionsBadge();
}

// Voir mes soumissions (membre)
async function voirMesSoumissions() {
    if (!currentUser) {
        await showAlert('Vous devez être connecté');
        return;
    }

    // S'assurer que soumissions existe
    if (!appData.soumissions) appData.soumissions = [];

    const mesSoumissions = appData.soumissions.filter(s => s.auteur_id === currentUser.id);

    if (mesSoumissions.length === 0) {
        await showAlert('Vous n\'avez aucune soumission');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal active';

    let html = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Mes soumissions</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
    `;

    mesSoumissions.forEach(s => {
        const statutBadge =
            s.statut === 'accepte' ? '<span class="badge success">✓ Accepté</span>' :
            s.statut === 'refuse' ? '<span class="badge danger">✗ Refusé</span>' :
            '<span class="badge warning">⏳ En attente</span>';

        const titre = s.type === 'jeu' ? '🎲 ' + s.data.nom :
                      s.type === 'evenement' ? '📅 ' + s.data.titre :
                      '📸 Photo pour ' + s.data.jeu_nom;

        html += `
            <div class="announcement-card" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong>${titre}</strong>
                    ${statutBadge}
                </div>
                <div style="color: #d0d0d0; font-size: 12px;">
                    Soumis le ${new Date(s.date_soumission).toLocaleDateString()}
                </div>
                ${s.type === 'photo' && s.statut === 'en_attente' ? `
                    <div style="margin-top: 10px;">
                        <img src="${s.data.photo_data}" alt="Photo soumise" style="max-width: 150px; max-height: 150px; border-radius: 8px; border: 2px solid rgba(255, 215, 0, 0.3);" />
                    </div>
                ` : ''}
                ${s.statut === 'refuse' && s.raison_refus ?
                    `<div style="margin-top: 10px; color: #e74c3c;">Raison: ${s.raison_refus}</div>` : ''}
            </div>
        `;
    });

    html += `</div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

// Ajouter badge de notification pour l'admin et les modérateurs
function updateSoumissionsBadge() {
    // S'assurer que soumissions existe
    if (!appData.soumissions) appData.soumissions = [];

    const enAttente = appData.soumissions.filter(s => s.statut === 'en_attente').length;

    // Mettre à jour le badge sur le bouton Soumissions (Admin)
    const badgeBtn = document.getElementById('soumissionsBadgeBtn');
    if (badgeBtn) {
        if (enAttente > 0) {
            badgeBtn.textContent = enAttente;
            badgeBtn.style.display = 'block';
        } else {
            badgeBtn.style.display = 'none';
        }
    }

    // Mettre à jour le badge sur le bouton Soumissions (Membre)
    const badgeMembre = document.getElementById('soumissionsBadgeMembreBtn');
    if (badgeMembre) {
        if (enAttente > 0) {
            badgeMembre.textContent = enAttente;
            badgeMembre.style.display = 'block';
        } else {
            badgeMembre.style.display = 'none';
        }
    }

    // Afficher/masquer le bouton Soumissions pour les membres modérateurs
    const soumissionsMembreBtn = document.getElementById('soumissionsMembreBtn');
    if (soumissionsMembreBtn && currentUser && currentUser.role === 'membre') {
        if (estModerateur(currentUser.id)) {
            soumissionsMembreBtn.style.display = '';
        } else {
            soumissionsMembreBtn.style.display = 'none';
        }
    }
}
