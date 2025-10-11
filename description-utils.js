// Utilitaires pour la gestion des descriptions de jeux

/**
 * Crée un HTML avec une description tronquée et un bouton pour déplier
 * @param {string} description - La description complète du jeu
 * @param {string|number} gameId - L'ID du jeu pour générer des IDs uniques
 * @returns {string} - Le HTML formaté avec le système de dépliage
 */
function createTruncatedDescription(description, gameId) {
    if (!description || description.trim() === '') {
        return '';
    }

    // Seuil de caractères pour considérer qu'une description est longue
    const CHAR_THRESHOLD = 200;

    // Si la description est courte, l'afficher directement
    if (description.length <= CHAR_THRESHOLD) {
        return `<div class="game-info" style="margin-bottom: 15px;">${description}</div>`;
    }

    // Extraire les 2 premières phrases
    // Regex pour détecter les phrases (finissant par . ! ou ?)
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = description.match(sentenceRegex);

    let shortText = '';
    if (sentences && sentences.length >= 2) {
        // Prendre les 2 premières phrases
        shortText = sentences.slice(0, 2).join(' ');
    } else if (sentences && sentences.length === 1) {
        // Une seule phrase trouvée
        shortText = sentences[0];
    } else {
        // Pas de phrases détectées, tronquer à 200 caractères
        shortText = description.substring(0, CHAR_THRESHOLD) + '...';
    }

    // Générer des IDs uniques
    const shortId = `desc-short-${gameId}`;
    const fullId = `desc-full-${gameId}`;
    const btnId = `desc-btn-${gameId}`;

    // Retourner le HTML avec le système de dépliage
    return `
        <div class="game-info" style="margin-bottom: 15px;">
            <div id="${shortId}">
                ${shortText}
            </div>
            <div id="${fullId}" style="display: none;">
                ${description}
            </div>
            <button
                id="${btnId}"
                onclick="toggleDescription('${gameId}')"
                style="
                    margin-top: 8px;
                    background: rgba(255, 215, 0, 0.15);
                    border: 1px solid rgba(255, 215, 0, 0.4);
                    color: #ffd700;
                    padding: 4px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s;
                "
                onmouseover="this.style.background='rgba(255, 215, 0, 0.25)'"
                onmouseout="this.style.background='rgba(255, 215, 0, 0.15)'"
            >
                <span id="desc-icon-${gameId}">▼</span> Lire plus
            </button>
        </div>
    `;
}

/**
 * Toggle (déplier/replier) une description
 * @param {string|number} gameId - L'ID du jeu
 */
function toggleDescription(gameId) {
    const shortDiv = document.getElementById(`desc-short-${gameId}`);
    const fullDiv = document.getElementById(`desc-full-${gameId}`);
    const btn = document.getElementById(`desc-btn-${gameId}`);
    const icon = document.getElementById(`desc-icon-${gameId}`);

    if (fullDiv.style.display === 'none') {
        // Déplier : afficher le texte complet
        shortDiv.style.display = 'none';
        fullDiv.style.display = 'block';
        icon.textContent = '▲';
        btn.innerHTML = `<span id="desc-icon-${gameId}">▲</span> Lire moins`;
    } else {
        // Replier : afficher le texte court
        shortDiv.style.display = 'block';
        fullDiv.style.display = 'none';
        icon.textContent = '▼';
        btn.innerHTML = `<span id="desc-icon-${gameId}">▼</span> Lire plus`;
    }
}
