// Intégration avec l'API BoardGameGeek

// Classe pour gérer l'intégration BGG
class BGGIntegration {
  constructor() {
    this.apiUrl = '/.netlify/functions/bgg-api';
  }

  // Rechercher des jeux sur BGG
  async searchGames(query) {
    try {
      const response = await fetch(`${this.apiUrl}?action=search&query=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();
      return data.games || [];
    } catch (error) {
      console.error('[BGG] Erreur de recherche:', error);
      throw error;
    }
  }

  // Obtenir les détails d'un jeu
  async getGameDetails(bggId) {
    try {
      const response = await fetch(`${this.apiUrl}?action=details&id=${bggId}`);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des détails');
      }

      const data = await response.json();
      return data.game;
    } catch (error) {
      console.error('[BGG] Erreur de récupération des détails:', error);
      throw error;
    }
  }

  // Convertir un jeu BGG vers le format GDJ
  convertToGDJFormat(bggGame, proprietaire) {
    return {
      id: ++appData.settings.lastGameId,
      bggId: bggGame.id,
      nom: bggGame.name,
      proprietaire: proprietaire || 'Association',
      min_joueurs: parseInt(bggGame.minPlayers) || 1,
      max_joueurs: parseInt(bggGame.maxPlayers) || 10,
      duree: parseInt(bggGame.playingTime) || parseInt(bggGame.maxPlayTime) || 60,
      age_min: parseInt(bggGame.minAge) || 0,
      description: this.cleanDescription(bggGame.description),
      image: bggGame.image,
      thumbnail: bggGame.thumbnail,
      annee_publication: bggGame.yearPublished,
      categories: bggGame.categories ? bggGame.categories.map(c => c.name) : [],
      mecaniques: bggGame.mechanics ? bggGame.mechanics.map(m => m.name) : [],
      auteurs: bggGame.designers ? bggGame.designers.map(d => d.name) : [],
      editeurs: bggGame.publishers ? bggGame.publishers.map(p => p.name) : [],
      note: bggGame.rating ? parseFloat(bggGame.rating.average).toFixed(2) : null,
      rang: bggGame.rating && bggGame.rating.rank ? bggGame.rating.rank.value : null,
      date_ajout: new Date().toISOString(),
      est_extension: false,
      jeu_de_base: null
    };
  }

  // Nettoyer la description HTML
  cleanDescription(html) {
    if (!html) return '';

    // Supprimer les balises HTML
    const text = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#10;/g, '\n');

    return text.trim();
  }
}

// Instance globale
const bggIntegration = new BGGIntegration();

// ===== LOADER DE TRADUCTION =====

// Afficher le loader de traduction
function showTranslationLoader(message = 'Chargement...') {
  // Vérifier si le loader existe déjà
  let loader = document.getElementById('translationLoader');

  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'translationLoader';
    loader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20000;
      backdrop-filter: blur(4px);
    `;

    loader.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        padding: 40px 60px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 2px solid rgba(255, 215, 0, 0.3);
        min-width: 350px;
      ">
        <!-- Spinner animé -->
        <div style="
          width: 80px;
          height: 80px;
          margin: 0 auto 30px;
          border: 6px solid rgba(255, 215, 0, 0.2);
          border-top: 6px solid #ffd700;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>

        <!-- Message -->
        <div id="loaderMessage" style="
          color: #ffd700;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
        ">${message}</div>

        <!-- Sous-message -->
        <div id="loaderSubMessage" style="
          color: #a0a0a0;
          font-size: 14px;
        ">Veuillez patienter...</div>

        <!-- Barre de progression (optionnelle) -->
        <div style="
          width: 100%;
          height: 4px;
          background: rgba(255, 215, 0, 0.2);
          border-radius: 2px;
          margin-top: 25px;
          overflow: hidden;
        ">
          <div id="loaderProgress" style="
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #ffd700, #ffed4e);
            border-radius: 2px;
            transition: width 0.3s ease;
            animation: shimmer 2s infinite;
          "></div>
        </div>
      </div>

      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      </style>
    `;

    document.body.appendChild(loader);
  } else {
    // Mettre à jour le message
    const msgElement = loader.querySelector('#loaderMessage');
    if (msgElement) msgElement.textContent = message;
  }

  return loader;
}

// Mettre à jour le message du loader
function updateTranslationLoader(message, subMessage = '', progress = null) {
  const loader = document.getElementById('translationLoader');
  if (!loader) return;

  const msgElement = loader.querySelector('#loaderMessage');
  const subMsgElement = loader.querySelector('#loaderSubMessage');
  const progressElement = loader.querySelector('#loaderProgress');

  if (msgElement && message) msgElement.textContent = message;
  if (subMsgElement && subMessage) subMsgElement.textContent = subMessage;
  if (progressElement && progress !== null) {
    progressElement.style.width = `${progress}%`;
  }
}

// Fermer le loader
function hideTranslationLoader() {
  const loader = document.getElementById('translationLoader');
  if (loader) {
    loader.remove();
  }
}

// Fonction de traduction directe (fallback si fonction Netlify indisponible)
async function translateToFrench(text) {
  if (!text) return '';

  // Limiter à 5000 caractères
  const textToTranslate = text.length > 5000 ? text.substring(0, 5000) + '...' : text;

  try {
    console.log('[Traduction] Tentative via fonction Netlify...');

    // Essayer d'abord la fonction Netlify
    const netlifyResponse = await fetch('/.netlify/functions/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textToTranslate })
    });

    if (netlifyResponse.ok) {
      const data = await netlifyResponse.json();
      console.log('[Traduction] ✅ Réussi via Netlify');
      return data.translatedText;
    }

    console.log('[Traduction] ⚠️ Fonction Netlify indisponible (404), utilisation de l\'API directe...');
  } catch (error) {
    console.log('[Traduction] ⚠️ Erreur Netlify, utilisation de l\'API directe...', error);
  }

  // Fallback : appeler directement l'API MyMemory (gratuite et fiable)
  try {
    // MyMemory supporte jusqu'à 500 caractères par requête
    // On va découper si nécessaire et traduire par morceaux
    const maxChunkSize = 450; // On garde une marge
    let translatedText = '';

    if (textToTranslate.length <= maxChunkSize) {
      // Texte court, une seule requête
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|fr`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      translatedText = data.responseData.translatedText;
    } else {
      // Texte long, découper en phrases
      const sentences = textToTranslate.match(/[^.!?]+[.!?]+/g) || [textToTranslate];
      const chunks = [];
      let currentChunk = '';

      for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= maxChunkSize) {
          currentChunk += sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sentence;
        }
      }
      if (currentChunk) chunks.push(currentChunk);

      // Traduire chaque morceau avec un délai pour éviter les rate limits
      for (let i = 0; i < chunks.length && i < 5; i++) { // Limiter à 5 morceaux max
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunks[i])}&langpair=en|fr`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          translatedText += data.responseData.translatedText + ' ';
        }

        // Attendre 200ms entre chaque requête
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    console.log('[Traduction] ✅ Réussi via MyMemory API');
    return translatedText.trim();
  } catch (error) {
    console.error('[Traduction] ❌ Échec de la traduction:', error);
    return text; // Retourner le texte original en anglais
  }
}

// ===== INTERFACE UTILISATEUR =====

// Afficher la boîte de dialogue de recherche BGG
function afficherRechercheBGG() {
  const html = `
    <div style="max-width: 900px; margin: 0 auto;">
      <h2 style="color: #ffd700; margin-bottom: 20px;">🎲 Importer depuis BoardGameGeek</h2>

      <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #ffd700;">
        <p style="margin: 0; color: #e0e0e0;">
          Recherchez un jeu sur BoardGameGeek et importez automatiquement toutes ses informations
          (description, nombre de joueurs, durée, image, etc.)
        </p>
      </div>

      <!-- Barre de recherche -->
      <div style="margin-bottom: 20px;">
        <input
          type="text"
          id="bggSearchInput"
          placeholder="🔍 Rechercher un jeu (ex: Catan, 7 Wonders, Wingspan...)"
          style="
            width: 100%;
            padding: 15px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            background: rgba(0, 0, 0, 0.3);
            color: #ffffff;
            border-radius: 8px;
            font-size: 16px;
          "
          onkeypress="if(event.key === 'Enter') rechercherJeuxBGG()"
        >
        <button
          onclick="rechercherJeuxBGG()"
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
      <div id="bggLoading" style="display: none; text-align: center; padding: 40px;">
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
      <div id="bggResults" style="margin-top: 20px;"></div>
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
  dialog.id = 'bggDialog';
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
      max-width: 1000px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
      position: relative;
    ">
      <button
        onclick="document.getElementById('bggDialog').remove()"
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
    document.getElementById('bggSearchInput').focus();
  }, 100);
}

// Rechercher des jeux sur BGG
async function rechercherJeuxBGG() {
  const query = document.getElementById('bggSearchInput').value.trim();

  if (!query) {
    await showAlert('Veuillez entrer un nom de jeu');
    return;
  }

  const loadingDiv = document.getElementById('bggLoading');
  const resultsDiv = document.getElementById('bggResults');

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
              onclick="importerJeuBGG('${game.id}')"
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
              ➕ Importer
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

// Importer un jeu depuis BGG
async function importerJeuBGG(bggId) {
  try {
    // Fermer la fenêtre de recherche
    const dialog = document.getElementById('bggDialog');
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
      console.log('[BGG Import] Description originale (EN):', cleanDesc.substring(0, 100) + '...');
      bggGame.description = await translateToFrench(cleanDesc);
      console.log('[BGG Import] Description finale:', bggGame.description.substring(0, 100) + '...');
    }

    updateTranslationLoader('✅ Données récupérées', 'Finalisation...', 90);

    // Petit délai pour que l'utilisateur voie le message
    await new Promise(resolve => setTimeout(resolve, 300));

    // Fermer le loader
    hideTranslationLoader();

    // Demander le propriétaire
    const proprietaire = await showPrompt('Qui est le propriétaire de ce jeu ?', 'Association');
    if (!proprietaire) {
      await showAlert('❌ Import annulé');
      return;
    }

    // Convertir au format GDJ
    const jeu = bggIntegration.convertToGDJFormat(bggGame, proprietaire);

    // Ajouter à la ludothèque
    appData.ludotheque.push(jeu);
    saveLocalData();
    syncWithGitHub();

    // Afficher un message de succès
    await showAlert(`✅ Jeu "${jeu.nom}" importé avec succès !`);

    // Rafraîchir l'affichage si on est sur l'onglet ludothèque
    if (typeof loadLudotheque === 'function') {
      loadLudotheque();
    }

  } catch (error) {
    console.error('[BGG] Erreur d\'import:', error);
    await showAlert('❌ Erreur lors de l\'import : ' + error.message);
  }
}

// Mettre à jour un jeu existant avec les données BGG
async function mettreAJourDepuisBGG(jeuId) {
  const jeu = appData.ludotheque.find(j => j.id === jeuId);

  if (!jeu || !jeu.bggId) {
    await showAlert('Ce jeu n\'a pas d\'ID BoardGameGeek associé');
    return;
  }

  try {
    await showAlert('⏳ Mise à jour en cours...');

    const bggGame = await bggIntegration.getGameDetails(jeu.bggId);
    const updatedGame = bggIntegration.convertToGDJFormat(bggGame, jeu.proprietaire);

    // Conserver les informations locales importantes
    updatedGame.id = jeu.id;
    updatedGame.est_extension = jeu.est_extension;
    updatedGame.jeu_de_base = jeu.jeu_de_base;

    // Remplacer le jeu
    const index = appData.ludotheque.findIndex(j => j.id === jeuId);
    appData.ludotheque[index] = updatedGame;

    saveLocalData();
    syncWithGitHub();

    await showAlert('✅ Jeu mis à jour avec succès !');

    if (typeof loadLudotheque === 'function') {
      loadLudotheque();
    }

  } catch (error) {
    console.error('[BGG] Erreur de mise à jour:', error);
    await showAlert('❌ Erreur lors de la mise à jour : ' + error.message);
  }
}
