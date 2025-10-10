// Interface de gestion des sessions actives

// Afficher les sessions actives de l'utilisateur
function afficherSessionsActives() {
  if (!currentUser || !sessionManager) {
    customAlert('Erreur : utilisateur non connecté', 'error');
    return;
  }

  const sessions = sessionManager.getUserSessions(currentUser.id);

  const html = `
    <div style="max-width: 800px; margin: 0 auto;">
      <h2 style="color: #ffd700; margin-bottom: 20px;">🔐 Sessions actives</h2>

      <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #ffd700;">
        <p style="margin: 0; color: #e0e0e0;">
          <strong>Appareil actuel :</strong> ${sessionManager.currentSession ? sessionManager.currentSession.deviceName : 'Inconnu'}<br>
          <strong>Session ID :</strong> ${sessionManager.currentSession ? sessionManager.currentSession.id : 'N/A'}<br>
          <strong>Expire le :</strong> ${sessionManager.currentSession ? formatDate(new Date(sessionManager.currentSession.expiresAt)) : 'N/A'}
        </p>
      </div>

      <h3 style="color: #ffd700; margin-top: 30px;">Tous les appareils connectés (${sessions.length})</h3>

      ${sessions.length === 0 ? `
        <div style="text-align: center; padding: 40px; color: #888;">
          <p>Aucune session active</p>
        </div>
      ` : `
        <div style="display: grid; gap: 15px; margin-top: 15px;">
          ${sessions.map(session => {
            const isCurrentDevice = session.deviceId === sessionManager.deviceId;
            const timeSinceActivity = Math.floor((Date.now() - session.lastActivity) / 1000 / 60);

            return `
              <div style="
                background: ${isCurrentDevice ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
                border: 2px solid ${isCurrentDevice ? 'rgba(46, 204, 113, 0.5)' : 'rgba(255, 215, 0, 0.3)'};
                border-radius: 10px;
                padding: 20px;
                position: relative;
              ">
                ${isCurrentDevice ? '<div style="position: absolute; top: 10px; right: 10px; background: #2ecc71; color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px;">✓ Cet appareil</div>' : ''}

                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                  <div>
                    <h4 style="margin: 0 0 10px 0; color: #ffd700; font-size: 18px;">
                      ${session.deviceName}
                    </h4>
                    <p style="margin: 5px 0; color: #e0e0e0; font-size: 14px;">
                      <strong>Session ID :</strong> <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">${session.id}</code>
                    </p>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
                  <div>
                    <div style="font-size: 12px; color: #999; margin-bottom: 3px;">Créée le</div>
                    <div style="color: #e0e0e0;">${formatDate(new Date(session.createdAt))}</div>
                  </div>
                  <div>
                    <div style="font-size: 12px; color: #999; margin-bottom: 3px;">Expire le</div>
                    <div style="color: #e0e0e0;">${formatDate(new Date(session.expiresAt))}</div>
                  </div>
                  <div>
                    <div style="font-size: 12px; color: #999; margin-bottom: 3px;">Dernière activité</div>
                    <div style="color: ${timeSinceActivity < 5 ? '#2ecc71' : timeSinceActivity < 60 ? '#f39c12' : '#e74c3c'};">
                      ${timeSinceActivity < 1 ? 'À l\'instant' :
                        timeSinceActivity < 60 ? `Il y a ${timeSinceActivity} min` :
                        timeSinceActivity < 1440 ? `Il y a ${Math.floor(timeSinceActivity / 60)}h` :
                        `Il y a ${Math.floor(timeSinceActivity / 1440)} jour(s)`}
                    </div>
                  </div>
                  <div>
                    <div style="font-size: 12px; color: #999; margin-bottom: 3px;">Durée restante</div>
                    <div style="color: #e0e0e0;">
                      ${Math.floor((session.expiresAt - Date.now()) / 1000 / 60 / 60 / 24)} jour(s)
                    </div>
                  </div>
                </div>

                ${!isCurrentDevice ? `
                  <button
                    onclick="revoquerSession('${session.id}')"
                    style="
                      background: #e74c3c;
                      color: white;
                      border: none;
                      padding: 10px 20px;
                      border-radius: 5px;
                      cursor: pointer;
                      font-weight: bold;
                      width: 100%;
                    "
                  >
                    🚫 Déconnecter cet appareil
                  </button>
                ` : `
                  <button
                    onclick="prolongerSessionActuelle()"
                    style="
                      background: #3498db;
                      color: white;
                      border: none;
                      padding: 10px 20px;
                      border-radius: 5px;
                      cursor: pointer;
                      font-weight: bold;
                      width: 100%;
                    "
                  >
                    ⏰ Prolonger de 24h
                  </button>
                `}
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <button
            onclick="revoquerToutesSessions()"
            style="
              background: linear-gradient(135deg, #e74c3c, #c0392b);
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              font-size: 16px;
            "
          >
            🚨 Déconnecter TOUS les appareils
          </button>
          <p style="color: #888; font-size: 12px; margin-top: 10px;">
            Vous serez déconnecté de tous vos appareils, y compris celui-ci
          </p>
        </div>
      `}
    </div>
  `;

  // Créer une boîte de dialogue personnalisée
  const dialog = document.createElement('div');
  dialog.id = 'sessionsDialog';
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
        onclick="document.getElementById('sessionsDialog').remove()"
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
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        ×
      </button>

      ${html}
    </div>
  `;

  document.body.appendChild(dialog);
}

// Révoquer une session spécifique
function revoquerSession(sessionId) {
  customConfirm(
    'Voulez-vous vraiment déconnecter cet appareil ?',
    () => {
      sessionManager.destroySessionById(sessionId);
      customAlert('✅ Appareil déconnecté avec succès', 'success');

      // Rafraîchir l'affichage
      document.getElementById('sessionsDialog').remove();
      setTimeout(() => afficherSessionsActives(), 300);
    }
  );
}

// Révoquer toutes les sessions
function revoquerToutesSessions() {
  customConfirm(
    '⚠️ ATTENTION : Cette action va déconnecter TOUS vos appareils, y compris celui-ci. Vous devrez vous reconnecter. Continuer ?',
    () => {
      sessionManager.destroyAllUserSessions(currentUser.id);
      customAlert('✅ Toutes les sessions ont été révoquées. Vous allez être déconnecté.', 'success');

      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        currentUser = null;
        showPage('loginPage');
      }, 2000);
    }
  );
}

// Prolonger la session actuelle
function prolongerSessionActuelle() {
  const success = sessionManager.extendSession(24 * 60 * 60 * 1000); // 24h

  if (success) {
    customAlert('✅ Session prolongée de 24 heures', 'success');

    // Rafraîchir l'affichage
    document.getElementById('sessionsDialog').remove();
    setTimeout(() => afficherSessionsActives(), 300);
  } else {
    customAlert('❌ Erreur lors de la prolongation de la session', 'error');
  }
}

// Formater une date
function formatDate(date) {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };

  return date.toLocaleString('fr-FR', options);
}

// Ajouter un bouton "Sessions actives" dans les paramètres admin
function ajouterBoutonSessionsAdmin() {
  // Cette fonction sera appelée dans ouvrirParametresAdmin() dans settings.js
  // Pour l'instant, on la rend disponible globalement
}

// Ajouter un bouton "Sessions actives" dans les paramètres membre
function ajouterBoutonSessionsMembre() {
  // Cette fonction sera appelée dans ouvrirParametresMembre() dans settings.js
  // Pour l'instant, on la rend disponible globalement
}
