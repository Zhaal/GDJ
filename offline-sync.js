// Système de synchronisation hors-ligne amélioré
// Utilise IndexedDB pour un stockage robuste + file d'attente intelligente

class OfflineSyncManager {
  constructor() {
    this.dbName = 'GDJ_OfflineDB';
    this.dbVersion = 1;
    this.db = null;
    this.syncQueue = [];
    this.isSyncing = false;
    this.isOnline = navigator.onLine;
    this.lastSyncTime = null;

    this.init();
  }

  // Initialiser IndexedDB
  async init() {
    try {
      this.db = await this.openDatabase();
      console.log('[OfflineSync] IndexedDB initialisé');

      // Charger la file d'attente existante
      await this.loadSyncQueue();

      // Écouter les changements de connexion
      this.setupNetworkListeners();

      // Synchroniser au démarrage si en ligne
      if (this.isOnline) {
        this.processSyncQueue();
      }

      // Synchronisation périodique toutes les 5 minutes si en ligne
      setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.processSyncQueue();
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('[OfflineSync] Erreur d\'initialisation:', error);
    }
  }

  // Ouvrir la base de données IndexedDB
  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store pour la file d'attente de synchronisation
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }

        // Store pour le cache des données
        if (!db.objectStoreNames.contains('dataCache')) {
          const cacheStore = db.createObjectStore('dataCache', { keyPath: 'key' });
          cacheStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // Store pour les métadonnées
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Configurer les listeners réseau
  setupNetworkListeners() {
    window.addEventListener('online', async () => {
      console.log('[OfflineSync] Connexion rétablie');
      this.isOnline = true;

      // Afficher notification
      this.showNotification('✅ Connexion rétablie', 'Synchronisation en cours...', 'success');

      // Synchroniser immédiatement
      await this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineSync] Connexion perdue');
      this.isOnline = false;

      // Afficher notification
      this.showNotification('⚠️ Mode hors ligne', 'Vos modifications seront sauvegardées localement', 'warning');
    });
  }

  // Ajouter une opération à la file d'attente
  async addToQueue(operation) {
    const queueItem = {
      type: operation.type, // 'create', 'update', 'delete'
      entity: operation.entity, // 'produit', 'membre', 'transaction', etc.
      data: operation.data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    try {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      await this.promisifyRequest(store.add(queueItem));

      this.syncQueue.push(queueItem);
      console.log('[OfflineSync] Opération ajoutée à la file:', queueItem);

      // Si en ligne, tenter de synchroniser immédiatement
      if (this.isOnline && !this.isSyncing) {
        setTimeout(() => this.processSyncQueue(), 1000);
      }

      return true;
    } catch (error) {
      console.error('[OfflineSync] Erreur d\'ajout à la file:', error);
      return false;
    }
  }

  // Charger la file d'attente depuis IndexedDB
  async loadSyncQueue() {
    try {
      const transaction = this.db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      this.syncQueue = await this.promisifyRequest(request);
      console.log(`[OfflineSync] ${this.syncQueue.length} opération(s) en attente`);

      return this.syncQueue;
    } catch (error) {
      console.error('[OfflineSync] Erreur de chargement de la file:', error);
      return [];
    }
  }

  // Traiter la file d'attente de synchronisation
  async processSyncQueue() {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log(`[OfflineSync] Traitement de ${this.syncQueue.length} opération(s)`);

    const successfulItems = [];
    const failedItems = [];

    for (const item of this.syncQueue) {
      try {
        const success = await this.syncItem(item);

        if (success) {
          successfulItems.push(item);
        } else {
          item.retryCount++;
          if (item.retryCount >= 3) {
            console.error('[OfflineSync] Échec après 3 tentatives:', item);
            item.status = 'failed';
            failedItems.push(item);
          }
        }
      } catch (error) {
        console.error('[OfflineSync] Erreur lors de la sync:', error);
        item.retryCount++;
        if (item.retryCount >= 3) {
          item.status = 'failed';
          failedItems.push(item);
        }
      }
    }

    // Retirer les éléments synchronisés avec succès
    if (successfulItems.length > 0) {
      await this.removeFromQueue(successfulItems);
      this.showNotification('✅ Synchronisation réussie', `${successfulItems.length} opération(s) synchronisée(s)`, 'success');
    }

    // Mettre à jour les éléments échoués
    if (failedItems.length > 0) {
      await this.updateQueueItems(failedItems);
      this.showNotification('⚠️ Certaines opérations ont échoué', `${failedItems.length} opération(s) à réessayer`, 'error');
    }

    this.lastSyncTime = Date.now();
    this.isSyncing = false;

    console.log(`[OfflineSync] Synchronisation terminée. ${this.syncQueue.length} opération(s) restante(s)`);
  }

  // Synchroniser un élément individuel
  async syncItem(item) {
    try {
      // Utiliser la fonction de synchronisation GitHub existante
      if (typeof syncWithGitHub === 'function') {
        // Appliquer les modifications localement d'abord
        this.applyLocalChange(item);

        // Puis synchroniser avec GitHub
        await syncWithGitHub();

        return true;
      } else {
        console.warn('[OfflineSync] Fonction syncWithGitHub non disponible');
        return false;
      }
    } catch (error) {
      console.error('[OfflineSync] Erreur de synchronisation de l\'item:', error);
      return false;
    }
  }

  // Appliquer un changement localement
  applyLocalChange(item) {
    if (!appData) return;

    const { type, entity, data } = item;

    switch (entity) {
      case 'produit':
        if (type === 'create') {
          appData.produits.push(data);
        } else if (type === 'update') {
          const idx = appData.produits.findIndex(p => p.id === data.id);
          if (idx !== -1) appData.produits[idx] = data;
        } else if (type === 'delete') {
          appData.produits = appData.produits.filter(p => p.id !== data.id);
        }
        break;

      case 'membre':
        if (type === 'create') {
          appData.membres.push(data);
        } else if (type === 'update') {
          const idx = appData.membres.findIndex(m => m.id === data.id);
          if (idx !== -1) appData.membres[idx] = data;
        }
        break;

      case 'transaction':
        if (type === 'create') {
          appData.transactions.push(data);
        } else if (type === 'update') {
          const idx = appData.transactions.findIndex(t => t.id === data.id);
          if (idx !== -1) appData.transactions[idx] = data;
        }
        break;

      case 'jeu':
        if (type === 'create') {
          appData.ludotheque.push(data);
        } else if (type === 'update') {
          const idx = appData.ludotheque.findIndex(j => j.id === data.id);
          if (idx !== -1) appData.ludotheque[idx] = data;
        } else if (type === 'delete') {
          appData.ludotheque = appData.ludotheque.filter(j => j.id !== data.id);
        }
        break;

      case 'evenement':
        if (type === 'create') {
          appData.evenements.push(data);
        } else if (type === 'update') {
          const idx = appData.evenements.findIndex(e => e.id === data.id);
          if (idx !== -1) appData.evenements[idx] = data;
        } else if (type === 'delete') {
          appData.evenements = appData.evenements.filter(e => e.id !== data.id);
        }
        break;

      default:
        console.warn('[OfflineSync] Type d\'entité inconnu:', entity);
    }

    // Sauvegarder dans localStorage
    localStorage.setItem('gdjData', JSON.stringify(appData));
  }

  // Retirer des éléments de la file d'attente
  async removeFromQueue(items) {
    try {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      for (const item of items) {
        if (item.id) {
          await this.promisifyRequest(store.delete(item.id));
        }
      }

      // Mettre à jour la file locale
      this.syncQueue = this.syncQueue.filter(q => !items.find(i => i.id === q.id));

      return true;
    } catch (error) {
      console.error('[OfflineSync] Erreur de suppression de la file:', error);
      return false;
    }
  }

  // Mettre à jour des éléments de la file
  async updateQueueItems(items) {
    try {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      for (const item of items) {
        await this.promisifyRequest(store.put(item));
      }

      return true;
    } catch (error) {
      console.error('[OfflineSync] Erreur de mise à jour de la file:', error);
      return false;
    }
  }

  // Mettre en cache des données
  async cacheData(key, data) {
    try {
      const transaction = this.db.transaction(['dataCache'], 'readwrite');
      const store = transaction.objectStore('dataCache');

      await this.promisifyRequest(store.put({
        key,
        data,
        lastModified: Date.now()
      }));

      return true;
    } catch (error) {
      console.error('[OfflineSync] Erreur de mise en cache:', error);
      return false;
    }
  }

  // Récupérer des données du cache
  async getCachedData(key) {
    try {
      const transaction = this.db.transaction(['dataCache'], 'readonly');
      const store = transaction.objectStore('dataCache');
      const result = await this.promisifyRequest(store.get(key));

      return result ? result.data : null;
    } catch (error) {
      console.error('[OfflineSync] Erreur de récupération du cache:', error);
      return null;
    }
  }

  // Vider le cache
  async clearCache() {
    try {
      const transaction = this.db.transaction(['dataCache'], 'readwrite');
      const store = transaction.objectStore('dataCache');
      await this.promisifyRequest(store.clear());

      console.log('[OfflineSync] Cache vidé');
      return true;
    } catch (error) {
      console.error('[OfflineSync] Erreur de vidage du cache:', error);
      return false;
    }
  }

  // Obtenir les statistiques de synchronisation
  async getStats() {
    return {
      queueLength: this.syncQueue.length,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingOperations: this.syncQueue.filter(q => q.status === 'pending').length,
      failedOperations: this.syncQueue.filter(q => q.status === 'failed').length
    };
  }

  // Afficher une notification
  showNotification(title, message, type = 'info') {
    if (typeof customAlert === 'function') {
      customAlert(`${title}\n${message}`, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
  }

  // Convertir une requête IndexedDB en Promise
  promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Initialiser le gestionnaire de synchronisation hors-ligne
let offlineSyncManager;

window.addEventListener('load', () => {
  if ('indexedDB' in window) {
    offlineSyncManager = new OfflineSyncManager();
    console.log('[OfflineSync] Gestionnaire de synchronisation initialisé');

    // Exposer globalement pour utilisation dans d'autres scripts
    window.offlineSync = offlineSyncManager;
  } else {
    console.warn('[OfflineSync] IndexedDB non supporté par ce navigateur');
  }
});
