// Gestionnaire de sessions multiples
// Permet à un utilisateur de se connecter sur plusieurs appareils simultanément

class SessionManager {
  constructor() {
    this.sessionKey = 'gdj_session';
    this.sessionsKey = 'gdj_all_sessions';
    this.currentSession = null;
    this.deviceId = this.getOrCreateDeviceId();

    this.init();
  }

  // Initialiser le gestionnaire de sessions
  init() {
    // Charger la session actuelle
    this.currentSession = this.loadCurrentSession();

    // Nettoyer les sessions expirées au démarrage
    this.cleanExpiredSessions();

    // Vérifier périodiquement la validité de la session
    setInterval(() => {
      this.validateCurrentSession();
    }, 60 * 1000); // Toutes les minutes

    console.log('[SessionManager] Initialisé avec deviceId:', this.deviceId);
  }

  // Obtenir ou créer un identifiant unique pour cet appareil
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('gdj_device_id');

    if (!deviceId) {
      // Générer un ID unique basé sur plusieurs facteurs
      deviceId = this.generateDeviceId();
      localStorage.setItem('gdj_device_id', deviceId);
    }

    return deviceId;
  }

  // Générer un identifiant d'appareil unique
  generateDeviceId() {
    const navigatorInfo = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width + 'x' + screen.height,
      screen.colorDepth
    ].join('|');

    // Hash simple
    let hash = 0;
    for (let i = 0; i < navigatorInfo.length; i++) {
      const char = navigatorInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return 'device_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
  }

  // Créer une nouvelle session
  createSession(user, rememberMe = false) {
    const now = Date.now();
    const expiresIn = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 jours ou 24h

    const session = {
      id: this.generateSessionId(),
      userId: user.id,
      pseudo: user.pseudo,
      role: user.role,
      deviceId: this.deviceId,
      deviceName: this.getDeviceName(),
      createdAt: now,
      expiresAt: now + expiresIn,
      lastActivity: now,
      token: this.generateToken(user, expiresIn)
    };

    // Sauvegarder la session actuelle
    this.currentSession = session;
    localStorage.setItem(this.sessionKey, JSON.stringify(session));

    // Ajouter aux sessions globales (pour multi-appareils)
    this.addToGlobalSessions(session);

    console.log('[SessionManager] Session créée:', session.id);

    return session;
  }

  // Générer un ID de session unique
  generateSessionId() {
    return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Générer un token de session (simple JWT-like)
  generateToken(user, expiresIn) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload = {
      userId: user.id,
      pseudo: user.pseudo,
      role: user.role,
      deviceId: this.deviceId,
      iat: Date.now(),
      exp: Date.now() + expiresIn
    };

    const headerEncoded = this.base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = this.base64UrlEncode(JSON.stringify(payload));

    const signature = this.sign(headerEncoded + '.' + payloadEncoded);

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  }

  // Signer un token (HMAC simple)
  sign(data) {
    const secret = 'GDJ-SESSION-SECRET-2025'; // En production, utiliser une clé secrète côté serveur
    let hash = 0;
    const combined = data + secret;

    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }

  // Encoder en base64 URL-safe
  base64UrlEncode(str) {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Décoder depuis base64 URL-safe
  base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  // Valider un token
  validateToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerEncoded, payloadEncoded, signature] = parts;

      // Vérifier la signature
      const expectedSignature = this.sign(headerEncoded + '.' + payloadEncoded);
      if (signature !== expectedSignature) {
        console.warn('[SessionManager] Signature invalide');
        return null;
      }

      // Décoder le payload
      const payload = JSON.parse(this.base64UrlDecode(payloadEncoded));

      // Vérifier l'expiration
      if (payload.exp < Date.now()) {
        console.warn('[SessionManager] Token expiré');
        return null;
      }

      return payload;
    } catch (error) {
      console.error('[SessionManager] Erreur de validation du token:', error);
      return null;
    }
  }

  // Charger la session actuelle
  loadCurrentSession() {
    try {
      const sessionData = localStorage.getItem(this.sessionKey);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

      // Vérifier que la session n'est pas expirée
      if (session.expiresAt < Date.now()) {
        console.log('[SessionManager] Session expirée');
        this.destroySession();
        return null;
      }

      // Valider le token
      const tokenPayload = this.validateToken(session.token);
      if (!tokenPayload) {
        console.log('[SessionManager] Token invalide');
        this.destroySession();
        return null;
      }

      // Mettre à jour la dernière activité
      session.lastActivity = Date.now();
      localStorage.setItem(this.sessionKey, JSON.stringify(session));

      return session;
    } catch (error) {
      console.error('[SessionManager] Erreur de chargement de session:', error);
      return null;
    }
  }

  // Ajouter la session aux sessions globales
  addToGlobalSessions(session) {
    try {
      // Charger toutes les sessions depuis appData
      if (!appData.sessions) {
        appData.sessions = [];
      }

      // Retirer l'ancienne session de cet appareil si elle existe
      appData.sessions = appData.sessions.filter(s => s.deviceId !== this.deviceId);

      // Ajouter la nouvelle session
      appData.sessions.push({
        id: session.id,
        userId: session.userId,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        lastActivity: session.lastActivity
      });

      // Sauvegarder
      localStorage.setItem('gdjData', JSON.stringify(appData));

      // Synchroniser avec GitHub si disponible
      if (typeof syncWithGitHub === 'function') {
        syncWithGitHub();
      }
    } catch (error) {
      console.error('[SessionManager] Erreur d\'ajout aux sessions globales:', error);
    }
  }

  // Obtenir toutes les sessions actives pour un utilisateur
  getUserSessions(userId) {
    if (!appData.sessions) return [];

    return appData.sessions
      .filter(s => s.userId === userId && s.expiresAt > Date.now())
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }

  // Nettoyer les sessions expirées
  cleanExpiredSessions() {
    if (!appData.sessions) return;

    const now = Date.now();
    const before = appData.sessions.length;

    appData.sessions = appData.sessions.filter(s => s.expiresAt > now);

    if (appData.sessions.length < before) {
      console.log(`[SessionManager] ${before - appData.sessions.length} session(s) expirée(s) nettoyée(s)`);
      localStorage.setItem('gdjData', JSON.stringify(appData));

      if (typeof syncWithGitHub === 'function') {
        syncWithGitHub();
      }
    }
  }

  // Valider la session actuelle
  validateCurrentSession() {
    if (!this.currentSession) return false;

    // Vérifier l'expiration
    if (this.currentSession.expiresAt < Date.now()) {
      console.log('[SessionManager] Session actuelle expirée');
      this.destroySession();
      return false;
    }

    // Mettre à jour la dernière activité
    this.updateLastActivity();

    return true;
  }

  // Mettre à jour la dernière activité
  updateLastActivity() {
    if (!this.currentSession) return;

    this.currentSession.lastActivity = Date.now();
    localStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));

    // Mettre à jour aussi dans les sessions globales
    if (appData.sessions) {
      const globalSession = appData.sessions.find(s => s.id === this.currentSession.id);
      if (globalSession) {
        globalSession.lastActivity = Date.now();
        localStorage.setItem('gdjData', JSON.stringify(appData));
      }
    }
  }

  // Prolonger la session
  extendSession(additionalTime = 24 * 60 * 60 * 1000) {
    if (!this.currentSession) return false;

    this.currentSession.expiresAt += additionalTime;
    localStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));

    // Mettre à jour dans les sessions globales
    if (appData.sessions) {
      const globalSession = appData.sessions.find(s => s.id === this.currentSession.id);
      if (globalSession) {
        globalSession.expiresAt = this.currentSession.expiresAt;
        localStorage.setItem('gdjData', JSON.stringify(appData));
      }
    }

    console.log('[SessionManager] Session prolongée');
    return true;
  }

  // Détruire la session actuelle
  destroySession() {
    if (!this.currentSession) return;

    const sessionId = this.currentSession.id;

    // Retirer de localStorage
    localStorage.removeItem(this.sessionKey);

    // Retirer des sessions globales
    if (appData.sessions) {
      appData.sessions = appData.sessions.filter(s => s.id !== sessionId);
      localStorage.setItem('gdjData', JSON.stringify(appData));

      if (typeof syncWithGitHub === 'function') {
        syncWithGitHub();
      }
    }

    this.currentSession = null;
    console.log('[SessionManager] Session détruite');
  }

  // Détruire toutes les sessions d'un utilisateur
  destroyAllUserSessions(userId) {
    if (!appData.sessions) return;

    appData.sessions = appData.sessions.filter(s => s.userId !== userId);
    localStorage.setItem('gdjData', JSON.stringify(appData));

    if (typeof syncWithGitHub === 'function') {
      syncWithGitHub();
    }

    console.log('[SessionManager] Toutes les sessions de l\'utilisateur détruites');
  }

  // Détruire une session spécifique
  destroySessionById(sessionId) {
    if (this.currentSession && this.currentSession.id === sessionId) {
      this.destroySession();
    } else if (appData.sessions) {
      appData.sessions = appData.sessions.filter(s => s.id !== sessionId);
      localStorage.setItem('gdjData', JSON.stringify(appData));

      if (typeof syncWithGitHub === 'function') {
        syncWithGitHub();
      }
    }

    console.log('[SessionManager] Session supprimée:', sessionId);
  }

  // Obtenir le nom de l'appareil
  getDeviceName() {
    const ua = navigator.userAgent;

    if (/mobile/i.test(ua)) {
      if (/android/i.test(ua)) return '📱 Android';
      if (/iphone|ipad|ipod/i.test(ua)) return '📱 iOS';
      return '📱 Mobile';
    }

    if (/tablet|ipad/i.test(ua)) {
      return '📱 Tablette';
    }

    if (/mac/i.test(ua)) return '💻 Mac';
    if (/win/i.test(ua)) return '💻 Windows';
    if (/linux/i.test(ua)) return '💻 Linux';

    return '💻 Ordinateur';
  }

  // Obtenir les informations de la session actuelle
  getCurrentSession() {
    return this.currentSession;
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn() {
    return this.currentSession !== null && this.validateCurrentSession();
  }
}

// Initialiser le gestionnaire de sessions
let sessionManager;

window.addEventListener('DOMContentLoaded', () => {
  sessionManager = new SessionManager();
  console.log('[SessionManager] Gestionnaire de sessions initialisé');

  // Exposer globalement
  window.sessionManager = sessionManager;
});
