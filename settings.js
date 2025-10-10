// ===== PARAMÈTRES ET CONFIGURATION =====

// Initialiser les paramètres par défaut
function initSettings() {
    if (!appData.settings.soumissions) {
        appData.settings.soumissions = {
            jeux: { active: true },
            evenements: {
                active: true,
                types: {
                    initiation: false,
                    partie: false,
                    tournoi: true,
                    wargame: false,
                    tcg: false,
                    jdr: false
                }
            },
            photos: { active: false }
        };
    }

    // S'assurer que tous les types d'événements existent (pour la compatibilité avec anciennes données)
    if (appData.settings.soumissions.evenements && !appData.settings.soumissions.evenements.types) {
        appData.settings.soumissions.evenements.types = {
            initiation: false,
            partie: false,
            tournoi: true,
            wargame: false,
            tcg: false,
            jdr: false
        };
    } else if (appData.settings.soumissions.evenements && appData.settings.soumissions.evenements.types) {
        // Ajouter JDR si manquant
        if (appData.settings.soumissions.evenements.types.jdr === undefined) {
            appData.settings.soumissions.evenements.types.jdr = false;
        }
    }

    if (!appData.settings.moderateurs) {
        appData.settings.moderateurs = []; // IDs des membres qui peuvent gérer les soumissions
    }

    // Ajouter les préférences d'affichage pour chaque membre
    if (!appData.membresPreferences) {
        appData.membresPreferences = {};
    }
}

// ===== PARAMÈTRES ADMIN =====

function ouvrirParametresAdmin() {
    const modal = document.createElement('div');
    modal.className = 'modal active';

    // S'assurer que les settings existent
    initSettings();

    const moderateurs = appData.settings.moderateurs || [];
    const soumissions = appData.settings.soumissions;

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2>⚙️ Paramètres Administrateur</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>

            <div class="form-container" style="margin-bottom: 20px;">
                <h3>🔒 Sécurité</h3>
                <button class="btn-primary" onclick="changerMotDePasseAdmin()">Changer le mot de passe</button>
            </div>

            <div class="form-container" style="margin-bottom: 20px;">
                <h3>📝 Système de soumissions (validation requise)</h3>
                <p style="color: #ffd700; font-size: 13px; margin-bottom: 15px;">
                    ⚠️ Cocher = Validation obligatoire | Décocher = Ajout direct sans validation
                </p>

                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px; color: #e0e0e0; cursor: pointer;">
                        <input type="checkbox" id="soumJeux" ${soumissions.jeux.active ? 'checked' : ''} onchange="toggleSoumission('jeux', this.checked)">
                        <span>Exiger validation pour les jeux</span>
                    </label>
                    <p style="color: #999; font-size: 12px; margin-left: 30px; margin-top: 3px;">
                        ${soumissions.jeux.active ? '✓ Les membres doivent soumettre leurs jeux pour validation' : '✗ Les membres peuvent ajouter des jeux directement'}
                    </p>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px; color: #e0e0e0; cursor: pointer;">
                        <input type="checkbox" id="soumEvenements" ${soumissions.evenements.active ? 'checked' : ''} onchange="toggleSoumission('evenements', this.checked)">
                        <span>Activer le système de filtrage par type d'événement</span>
                    </label>
                    <p style="color: #999; font-size: 12px; margin-left: 30px; margin-top: 3px;">
                        ${soumissions.evenements.active ? '✓ Filtrage activé : configurez ci-dessous quels types nécessitent une validation' : '✗ Tous les événements peuvent être créés directement sans validation'}
                    </p>

                    <div id="typesEvenements" style="margin-left: 30px; margin-top: 10px; ${soumissions.evenements.active ? '' : 'display: none;'}">
                        <p style="color: #ffd700; font-size: 14px; margin-bottom: 8px;">Types nécessitant une validation :</p>
                        <p style="color: #999; font-size: 11px; margin-bottom: 10px;">Cocher = Validation requise | Décocher = Ajout direct</p>
                        <label style="display: flex; align-items: center; gap: 8px; color: #e0e0e0; cursor: pointer; margin-bottom: 5px;">
                            <input type="checkbox" ${soumissions.evenements.types.initiation ? 'checked' : ''} onchange="toggleTypeEvenement('initiation', this.checked)">
                            <span>🎓 Initiation</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; color: #e0e0e0; cursor: pointer; margin-bottom: 5px;">
                            <input type="checkbox" ${soumissions.evenements.types.partie ? 'checked' : ''} onchange="toggleTypeEvenement('partie', this.checked)">
                            <span>🎲 Partie classique</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; color: #e0e0e0; cursor: pointer; margin-bottom: 5px;">
                            <input type="checkbox" ${soumissions.evenements.types.tournoi ? 'checked' : ''} onchange="toggleTypeEvenement('tournoi', this.checked)">
                            <span>🏆 Tournoi</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; color: #e0e0e0; cursor: pointer; margin-bottom: 5px;">
                            <input type="checkbox" ${soumissions.evenements.types.wargame ? 'checked' : ''} onchange="toggleTypeEvenement('wargame', this.checked)">
                            <span>⚔️ Wargame</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; color: #e0e0e0; cursor: pointer; margin-bottom: 5px;">
                            <input type="checkbox" ${soumissions.evenements.types.tcg ? 'checked' : ''} onchange="toggleTypeEvenement('tcg', this.checked)">
                            <span>🃏 TCG</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; color: #e0e0e0; cursor: pointer; margin-bottom: 5px;">
                            <input type="checkbox" ${soumissions.evenements.types.jdr ? 'checked' : ''} onchange="toggleTypeEvenement('jdr', this.checked)">
                            <span>🎲 JDR</span>
                        </label>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px; color: #e0e0e0; cursor: pointer;">
                        <input type="checkbox" id="soumPhotos" ${soumissions.photos.active ? 'checked' : ''} onchange="toggleSoumission('photos', this.checked)">
                        <span>Exiger validation pour les photos</span>
                    </label>
                    <p style="color: #999; font-size: 12px; margin-left: 30px; margin-top: 3px;">
                        ${soumissions.photos.active ? '✓ Les membres doivent soumettre leurs photos pour validation' : '✗ Les membres peuvent ajouter des photos directement'}
                    </p>
                </div>
            </div>

            <div class="form-container">
                <h3>👥 Modérateurs (gestion des soumissions)</h3>
                <p style="color: #e0e0e0; font-size: 14px; margin-bottom: 15px;">
                    Les modérateurs peuvent traiter les soumissions sans avoir accès aux autres fonctions administratives.
                </p>

                <div id="moderateursList" style="margin-bottom: 15px;">
                    ${moderateurs.length > 0 ? moderateurs.map(modId => {
                        const membre = appData.membres.find(m => m.id === modId);
                        return membre ? `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 215, 0, 0.1); padding: 10px; border-radius: 5px; margin-bottom: 5px;">
                                <span style="color: #e0e0e0;">${membre.prenom} ${membre.nom} (@${membre.pseudo})</span>
                                <button class="btn-danger" onclick="retirerModerateur(${modId})">Retirer</button>
                            </div>
                        ` : '';
                    }).join('') : '<p style="color: #999;">Aucun modérateur désigné</p>'}
                </div>

                <button class="btn-primary" onclick="ajouterModerateur()">➕ Ajouter un modérateur</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function toggleSoumission(type, active) {
    initSettings();
    appData.settings.soumissions[type].active = active;

    // Afficher/masquer les types d'événements
    if (type === 'evenements') {
        const typesDiv = document.getElementById('typesEvenements');
        if (typesDiv) {
            typesDiv.style.display = active ? 'block' : 'none';
        }
    }

    saveLocalData();
    syncWithGitHub();
}

function toggleTypeEvenement(type, active) {
    initSettings();
    appData.settings.soumissions.evenements.types[type] = active;
    saveLocalData();
    syncWithGitHub();
}

async function changerMotDePasseAdmin() {
    const adminMembre = appData.membres.find(m => m.id === currentUser.id);
    if (!adminMembre) return;

    const ancienMdp = await prompt('Mot de passe actuel :');
    if (!ancienMdp) return;

    if (ancienMdp !== adminMembre.mot_de_passe) {
        alert('Mot de passe incorrect');
        return;
    }

    const nouveauMdp = await prompt('Nouveau mot de passe :');
    if (!nouveauMdp || nouveauMdp.length < 4) {
        alert('Le mot de passe doit contenir au moins 4 caractères');
        return;
    }

    const confirmMdp = await prompt('Confirmer le nouveau mot de passe :');
    if (nouveauMdp !== confirmMdp) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }

    adminMembre.mot_de_passe = nouveauMdp;
    saveLocalData();
    syncWithGitHub();
    alert('Mot de passe modifié avec succès !');
}

async function ajouterModerateur() {
    // Lister les membres non-admin et non-modérateurs
    const membresDisponibles = appData.membres.filter(m =>
        m.role !== 'admin' &&
        !m.supprime &&
        !appData.settings.moderateurs.includes(m.id)
    );

    if (membresDisponibles.length === 0) {
        alert('Aucun membre disponible');
        return;
    }

    const options = membresDisponibles.map(m => ({
        value: m.id,
        label: `${m.prenom} ${m.nom} (@${m.pseudo})`
    }));

    const membreId = await showPromptSelect('Sélectionner un membre :', options, 'Ajouter un modérateur');
    if (!membreId) return;

    if (!appData.settings.moderateurs) appData.settings.moderateurs = [];
    appData.settings.moderateurs.push(parseInt(membreId));

    saveLocalData();
    syncWithGitHub();

    // Recharger les paramètres
    document.querySelector('.modal')?.remove();
    ouvrirParametresAdmin();
}

function retirerModerateur(membreId) {
    if (!confirm('Retirer ce modérateur ?')) return;

    appData.settings.moderateurs = appData.settings.moderateurs.filter(id => id !== membreId);
    saveLocalData();
    syncWithGitHub();

    // Recharger les paramètres
    document.querySelector('.modal')?.remove();
    ouvrirParametresAdmin();
}

// Vérifier si un membre est modérateur
function estModerateur(membreId) {
    return appData.settings.moderateurs && appData.settings.moderateurs.includes(membreId);
}

// ===== PARAMÈTRES MEMBRE =====

function ouvrirParametresMembre() {
    const membre = appData.membres.find(m => m.id === currentUser.id);
    if (!membre) return;

    // Initialiser les préférences si nécessaire
    if (!appData.membresPreferences) appData.membresPreferences = {};
    if (!appData.membresPreferences[currentUser.id]) {
        appData.membresPreferences[currentUser.id] = {
            afficherPseudo: false
        };
    }

    const prefs = appData.membresPreferences[currentUser.id];

    const modal = document.createElement('div');
    modal.className = 'modal active';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>⚙️ Mes Paramètres</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>

            <div class="form-container" style="margin-bottom: 20px;">
                <h3>👤 Informations personnelles</h3>
                <div style="margin-bottom: 15px;">
                    <div class="info-label">Pseudo</div>
                    <div class="info-value">${membre.pseudo}</div>
                </div>
                <div style="margin-bottom: 15px;">
                    <div class="info-label">Nom complet</div>
                    <div class="info-value">${membre.prenom} ${membre.nom}</div>
                </div>
                <div style="margin-bottom: 15px;">
                    <div class="info-label">Email</div>
                    <div class="info-value">${membre.email || 'Non renseigné'}</div>
                </div>
                <button class="btn-primary" onclick="modifierEmailMembre()">Modifier l'email</button>
            </div>

            <div class="form-container" style="margin-bottom: 20px;">
                <h3>🎨 Préférences d'affichage</h3>
                <label style="display: flex; align-items: center; gap: 10px; color: #e0e0e0; cursor: pointer;">
                    <input type="checkbox" id="afficherPseudo" ${prefs.afficherPseudo ? 'checked' : ''} onchange="toggleAffichagePseudo(this.checked)">
                    <span>Afficher mon pseudo au lieu de mon nom/prénom</span>
                </label>
                <p style="color: #999; font-size: 12px; margin-top: 5px;">
                    Cette option affecte l'affichage de votre nom dans l'interface
                </p>
            </div>

            <div class="form-container" style="margin-bottom: 20px;">
                <h3>🔒 Sécurité</h3>
                <button class="btn-primary" onclick="changerMotDePasseMembre()">Changer le mot de passe</button>
            </div>

            <div class="form-container" style="border: 2px solid #e74c3c;">
                <h3 style="color: #e74c3c;">⚠️ Zone dangereuse</h3>
                <p style="color: #e0e0e0; font-size: 14px; margin-bottom: 10px;">
                    La suppression de votre compte est définitive.
                </p>
                <button class="btn-danger" onclick="supprimerCompteMembre()">Supprimer mon compte</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function modifierEmailMembre() {
    const membre = appData.membres.find(m => m.id === currentUser.id);
    if (!membre) return;

    const nouvelEmail = await prompt('Nouvel email :', membre.email || '');
    if (nouvelEmail === null) return;

    // Vérifier si l'email existe déjà
    if (nouvelEmail && appData.membres.find(m => m.id !== currentUser.id && m.email === nouvelEmail)) {
        alert('Cet email est déjà utilisé par un autre membre');
        return;
    }

    membre.email = nouvelEmail || null;
    currentUser.email = membre.email;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    saveLocalData();
    syncWithGitHub();
    alert('Email modifié avec succès !');

    // Recharger les paramètres
    document.querySelector('.modal')?.remove();
    ouvrirParametresMembre();
}

function toggleAffichagePseudo(afficher) {
    if (!appData.membresPreferences) appData.membresPreferences = {};
    if (!appData.membresPreferences[currentUser.id]) {
        appData.membresPreferences[currentUser.id] = {};
    }

    appData.membresPreferences[currentUser.id].afficherPseudo = afficher;
    saveLocalData();
    syncWithGitHub();

    // Mettre à jour l'affichage du nom dans la navbar
    updateUserDisplay();
}

function updateUserDisplay() {
    const membre = appData.membres.find(m => m.id === currentUser.id);
    if (!membre) return;

    const prefs = appData.membresPreferences && appData.membresPreferences[currentUser.id];
    const afficherPseudo = prefs && prefs.afficherPseudo;

    const displayName = afficherPseudo ? membre.pseudo : `${membre.prenom} ${membre.nom}`;

    const memberUserInfo = document.getElementById('memberUserInfo');
    if (memberUserInfo) {
        memberUserInfo.textContent = displayName;
    }
}

async function changerMotDePasseMembre() {
    const membre = appData.membres.find(m => m.id === currentUser.id);
    if (!membre) return;

    const ancienMdp = await prompt('Mot de passe actuel :');
    if (!ancienMdp) return;

    if (ancienMdp !== membre.mot_de_passe) {
        alert('Mot de passe incorrect');
        return;
    }

    const nouveauMdp = await prompt('Nouveau mot de passe :');
    if (!nouveauMdp || nouveauMdp.length < 4) {
        alert('Le mot de passe doit contenir au moins 4 caractères');
        return;
    }

    const confirmMdp = await prompt('Confirmer le nouveau mot de passe :');
    if (nouveauMdp !== confirmMdp) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }

    membre.mot_de_passe = nouveauMdp;
    saveLocalData();
    syncWithGitHub();
    alert('Mot de passe modifié avec succès !');
}

async function supprimerCompteMembre() {
    const membre = appData.membres.find(m => m.id === currentUser.id);
    if (!membre) return;

    const confirmation1 = await confirm('Êtes-vous sûr de vouloir supprimer votre compte ?\n\nCette action est irréversible.');
    if (!confirmation1) return;

    const motDePasse = await prompt('Entrez votre mot de passe pour confirmer la suppression :');
    if (motDePasse !== membre.mot_de_passe) {
        alert('Mot de passe incorrect');
        return;
    }

    const confirmation2 = await confirm('DERNIÈRE CONFIRMATION\n\nVotre compte sera définitivement supprimé. Vos transactions et historique seront conservés mais vous ne pourrez plus vous connecter.\n\nContinuer ?');
    if (!confirmation2) return;

    // Marquer le membre comme supprimé
    membre.supprime = true;
    membre.date_suppression = new Date().toISOString();
    membre.statut = 'supprime';

    saveLocalData();
    syncWithGitHub();

    alert('Votre compte a été supprimé. Vous allez être déconnecté.');
    logout();
}
