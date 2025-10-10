// Système de dialogs personnalisés pour remplacer alert(), confirm() et prompt()

// Sauvegarder les fonctions natives
const nativeAlert = window.alert;
const nativeConfirm = window.confirm;
const nativePrompt = window.prompt;

// Remplacer alert()
function showAlert(message, title = 'Information') {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog active';
        dialog.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-title">${title}</div>
                <div class="dialog-message">${message}</div>
                <div class="dialog-buttons">
                    <button class="btn-primary" onclick="this.closest('.custom-dialog').remove()">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('button').addEventListener('click', () => {
            resolve(true);
        });
    });
}

// Remplacer confirm()
function showConfirm(message, title = 'Confirmation') {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog active';
        dialog.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-title">${title}</div>
                <div class="dialog-message">${message}</div>
                <div class="dialog-buttons">
                    <button class="btn-secondary" data-action="cancel">Annuler</button>
                    <button class="btn-primary" data-action="confirm">Confirmer</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                dialog.remove();
                resolve(action === 'confirm');
            });
        });
    });
}

// Remplacer prompt()
function showPrompt(message, defaultValue = '', title = 'Saisie') {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog active';
        dialog.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-title">${title}</div>
                <div class="dialog-message">${message}</div>
                <input type="text" class="dialog-input" value="${defaultValue}" />
                <div class="dialog-buttons">
                    <button class="btn-secondary" data-action="cancel">Annuler</button>
                    <button class="btn-primary" data-action="confirm">Valider</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const input = dialog.querySelector('.dialog-input');
        input.focus();
        input.select();

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                dialog.remove();
                resolve(input.value);
            } else if (e.key === 'Escape') {
                dialog.remove();
                resolve(null);
            }
        });

        dialog.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                dialog.remove();
                resolve(action === 'confirm' ? input.value : null);
            });
        });
    });
}

// Version pour prompt avec textarea (multi-lignes)
function showPromptTextarea(message, defaultValue = '', title = 'Saisie') {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog active';
        dialog.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-title">${title}</div>
                <div class="dialog-message">${message}</div>
                <textarea class="dialog-input" rows="4" style="resize: vertical;">${defaultValue}</textarea>
                <div class="dialog-buttons">
                    <button class="btn-secondary" data-action="cancel">Annuler</button>
                    <button class="btn-primary" data-action="confirm">Valider</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const input = dialog.querySelector('.dialog-input');
        input.focus();

        dialog.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                dialog.remove();
                resolve(action === 'confirm' ? input.value : null);
            });
        });
    });
}

// Version pour prompt avec select (choix multiple)
function showPromptSelect(message, options, title = 'Sélection') {
    return new Promise((resolve) => {
        const optionsHtml = options.map(opt =>
            `<option value="${opt.value}">${opt.label}</option>`
        ).join('');

        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog active';
        dialog.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-title">${title}</div>
                <div class="dialog-message">${message}</div>
                <select class="dialog-input">
                    ${optionsHtml}
                </select>
                <div class="dialog-buttons">
                    <button class="btn-secondary" data-action="cancel">Annuler</button>
                    <button class="btn-primary" data-action="confirm">Valider</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const select = dialog.querySelector('.dialog-input');
        select.focus();

        dialog.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                dialog.remove();
                resolve(action === 'confirm' ? select.value : null);
            });
        });
    });
}

// Version pour prompt avec date picker
function showPromptDate(message, defaultValue = '', title = 'Sélection de date') {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog active';
        dialog.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-title">${title}</div>
                <div class="dialog-message">${message}</div>
                <input type="date" class="dialog-input" value="${defaultValue}" />
                <div class="dialog-buttons">
                    <button class="btn-secondary" data-action="cancel">Annuler</button>
                    <button class="btn-primary" data-action="confirm">Valider</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const input = dialog.querySelector('.dialog-input');
        input.focus();

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                dialog.remove();
                resolve(input.value);
            } else if (e.key === 'Escape') {
                dialog.remove();
                resolve(null);
            }
        });

        dialog.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                dialog.remove();
                resolve(action === 'confirm' ? input.value : null);
            });
        });
    });
}

// Dialog de suppression avec confirmation forte
function showDeleteConfirm(itemName, details = '') {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog active';
        dialog.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-title">⚠️ Confirmation de suppression</div>
                <div class="dialog-message">
                    Êtes-vous sûr de vouloir supprimer :<br>
                    <strong style="color: #ffd700;">${itemName}</strong>
                    ${details ? '<br><br>' + details : ''}
                </div>
                <div class="dialog-buttons">
                    <button class="btn-secondary" data-action="cancel">Annuler</button>
                    <button class="btn-danger" data-action="confirm">Supprimer</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                dialog.remove();
                resolve(action === 'confirm');
            });
        });
    });
}

// Remplacer les fonctions natives par les versions personnalisées
// IMPORTANT: confirm() et prompt() retournent des Promises, donc il faut utiliser async/await
window.alert = function(message) {
    showAlert(message);
};

window.confirm = function(message) {
    return showConfirm(message);
};

window.prompt = function(message, defaultValue = '') {
    return showPrompt(message, defaultValue);
};

// Dialog de recherche de jeux avec barre de recherche dynamique
function showGameSearchDialog(title = 'Sélectionner un jeu') {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog active';
        dialog.innerHTML = `
            <div class="dialog-box" style="max-width: 600px;">
                <div class="dialog-title">${title}</div>
                <div class="dialog-message">
                    <input type="text" id="gameSearchInput" class="dialog-input" placeholder="🔍 Rechercher un jeu..." style="margin-bottom: 15px;" />
                    <div id="gameSearchResults" style="max-height: 400px; overflow-y: auto; border: 2px solid rgba(255, 215, 0, 0.3); border-radius: 8px; background: rgba(0, 0, 0, 0.3);"></div>
                </div>
                <div class="dialog-buttons">
                    <button class="btn-secondary" data-action="cancel">Annuler</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const searchInput = document.getElementById('gameSearchInput');
        const resultsContainer = document.getElementById('gameSearchResults');

        // Fonction pour afficher les résultats
        function displayResults(searchTerm = '') {
            const lowerSearch = searchTerm.toLowerCase();
            const filteredGames = appData.ludotheque.filter(game =>
                game.nom.toLowerCase().includes(lowerSearch) ||
                game.proprietaire.toLowerCase().includes(lowerSearch)
            ).sort((a, b) => a.nom.localeCompare(b.nom));

            if (filteredGames.length === 0) {
                resultsContainer.innerHTML = '<p style="text-align:center;color:#fff;padding:20px;">Aucun jeu trouvé</p>';
                return;
            }

            resultsContainer.innerHTML = filteredGames.map(game => `
                <div class="game-search-item" data-game-id="${game.id}" style="padding: 12px; border-bottom: 1px solid rgba(255, 215, 0, 0.2); cursor: pointer; transition: background 0.2s;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: bold; color: #ffd700; font-size: 16px;">${game.nom}</div>
                            <div style="color: #d0d0d0; font-size: 12px; margin-top: 4px;">Propriétaire: ${game.proprietaire}</div>
                            <div style="color: #fff; font-size: 13px; margin-top: 4px;">
                                👥 ${game.min_joueurs}-${game.max_joueurs} joueurs | ⏱️ ${game.duree} min | 🎯 ${game.age_min}+
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            // Ajouter les événements de clic et de survol
            resultsContainer.querySelectorAll('.game-search-item').forEach(item => {
                item.addEventListener('mouseenter', () => {
                    item.style.background = 'rgba(255, 215, 0, 0.1)';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = 'transparent';
                });
                item.addEventListener('click', () => {
                    const gameId = parseInt(item.dataset.gameId);
                    dialog.remove();
                    resolve(gameId);
                });
            });
        }

        // Afficher tous les jeux au départ
        displayResults();

        // Mettre à jour les résultats lors de la saisie
        searchInput.addEventListener('input', (e) => {
            displayResults(e.target.value);
        });

        searchInput.focus();

        // Bouton annuler
        dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            dialog.remove();
            resolve(null);
        });
    });
}

// Fonction pour afficher une photo en grand
function showPhotoEnlarged(photoUrl, gameName) {
    const viewer = document.createElement('div');
    viewer.className = 'custom-dialog active';
    viewer.style.zIndex = '10001';
    viewer.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; padding: 20px;" onclick="this.closest('.custom-dialog').remove()">
            <img src="${photoUrl}" alt="${gameName}" style="max-width: 100%; max-height: 100%; border-radius: 8px; object-fit: contain;" />
            <button class="btn-primary" style="position: absolute; top: 20px; right: 20px; padding: 10px 20px; font-size: 18px;">✕ Fermer</button>
        </div>
    `;
    document.body.appendChild(viewer);
}

// Dialog pour afficher et gérer les photos d'un jeu
function showGameDetailsDialog(gameId) {
    return new Promise((resolve) => {
        const game = appData.ludotheque.find(g => g.id === gameId);
        if (!game) {
            resolve();
            return;
        }

        // S'assurer que le tableau de photos existe
        if (!game.photos) game.photos = [];

        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog active';

        const isAdmin = currentUser && currentUser.role === 'admin';

        function refreshPhotosDisplay() {
            const photosContainer = document.getElementById('photosContainer');
            if (!photosContainer) return;

            if (game.photos.length === 0) {
                photosContainer.innerHTML = '<p style="text-align:center;color:#e0e0e0;padding:20px;font-size:14px;">Aucune photo pour ce jeu</p>';
            } else {
                photosContainer.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 0;">
                        ${game.photos.map((photo, index) => `
                            <div style="position: relative; cursor: pointer;">
                                <img src="${photo}" alt="${game.nom}" onclick="showPhotoEnlarged('${photo}', '${game.nom}')" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; border: 2px solid rgba(255, 215, 0, 0.3); display: block;" />
                                ${isAdmin ? `<button onclick="event.stopPropagation(); deleteGamePhoto(${gameId}, ${index})" class="btn-danger" style="position: absolute; top: 5px; right: 5px; padding: 5px 10px; font-size: 12px; min-width: auto;">×</button>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }

        dialog.innerHTML = `
            <div class="dialog-box" style="max-width: 90vw; width: 600px; max-height: 90vh; display: flex; flex-direction: column;">
                <div class="dialog-title" style="font-size: 18px; flex-shrink: 0;">📸 Photos - ${game.nom}</div>
                <div class="dialog-message" style="flex-grow: 1; overflow-y: auto; padding: 15px 0;">
                    <!-- Galerie de photos -->
                    <div id="photosContainer" style="margin-bottom: 20px; text-align: center;">
                    </div>

                    <!-- Section d'ajout de photo -->
                    <div style="padding: 15px; background: rgba(255, 215, 0, 0.1); border: 2px solid rgba(255, 215, 0, 0.3); border-radius: 8px;">
                        <input type="file" id="gamePhotoInput" accept="image/*" capture="environment" style="display: none;" />
                        <button class="btn-primary" id="uploadPhotoBtn" style="width: 100%; padding: 12px; font-size: 16px;">📸 Soumettre une Photo</button>
                    </div>
                </div>
                <div class="dialog-buttons" style="flex-shrink: 0;">
                    <button class="btn-primary" data-action="close" style="font-size: 16px;">Fermer</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Afficher les photos existantes
        refreshPhotosDisplay();

        // Gestion de l'upload de photo
        const photoInput = document.getElementById('gamePhotoInput');
        const uploadBtn = document.getElementById('uploadPhotoBtn');

        // Fonction pour compresser une image
        function compressImage(file, maxWidth = 800, quality = 0.7) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        // Redimensionner si l'image est trop grande
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }

                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Convertir en base64 avec compression
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(compressedDataUrl);
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        // Auto-upload quand une photo est sélectionnée
        photoInput.addEventListener('change', async () => {
            if (photoInput.files.length === 0) return;

            const file = photoInput.files[0];

            uploadBtn.disabled = true;
            uploadBtn.textContent = '⏳ Compression...';

            try {
                // Compresser l'image
                const compressedImage = await compressImage(file);

                uploadBtn.textContent = '⏳ Envoi...';

                // Créer une soumission de photo
                if (!appData.soumissions) appData.soumissions = [];
                if (!appData.settings.lastSoumissionId) appData.settings.lastSoumissionId = 0;

                const soumission = {
                    id: ++appData.settings.lastSoumissionId,
                    type: 'photo',
                    statut: 'en_attente',
                    auteur_id: currentUser.id,
                    date_soumission: new Date().toISOString(),
                    data: {
                        jeu_id: gameId,
                        jeu_nom: game.nom,
                        photo_data: compressedImage
                    }
                };

                appData.soumissions.push(soumission);
                saveLocalData();
                await syncWithGitHub();

                photoInput.value = ''; // Réinitialiser l'input
                uploadBtn.disabled = false;
                uploadBtn.textContent = '📸 Soumettre une Photo';

                // Mettre à jour le badge des soumissions si admin
                if (typeof updateSoumissionsBadge === 'function') {
                    updateSoumissionsBadge();
                }

                await showAlert('Photo soumise avec succès ! Elle sera visible après validation par un administrateur. ✅');
            } catch (error) {
                console.error('Erreur:', error);
                uploadBtn.disabled = false;
                uploadBtn.textContent = '📸 Soumettre une Photo';
                await showAlert('Erreur lors du traitement de la photo ❌');
            }
        });

        uploadBtn.addEventListener('click', () => {
            photoInput.click();
        });

        // Bouton fermer
        dialog.querySelector('[data-action="close"]').addEventListener('click', () => {
            dialog.remove();
            resolve();
        });
    });
}

// Fonction pour supprimer une photo d'un jeu
async function deleteGamePhoto(gameId, photoIndex) {
    const game = appData.ludotheque.find(g => g.id === gameId);
    if (!game || !game.photos || !game.photos[photoIndex]) return;

    if (await confirm('Supprimer cette photo ?')) {
        game.photos.splice(photoIndex, 1);
        saveLocalData();
        await syncWithGitHub();

        // Réafficher la fenêtre
        document.querySelector('.custom-dialog')?.remove();
        showGameDetailsDialog(gameId);
    }
}

// Garder les fonctions accessibles sous leur nom personnalisé aussi
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showPrompt = showPrompt;
window.showPromptTextarea = showPromptTextarea;
window.showPromptSelect = showPromptSelect;
window.showPromptDate = showPromptDate;
window.showDeleteConfirm = showDeleteConfirm;
window.showGameSearchDialog = showGameSearchDialog;
window.showGameDetailsDialog = showGameDetailsDialog;
window.deleteGamePhoto = deleteGamePhoto;
window.showPhotoEnlarged = showPhotoEnlarged;
