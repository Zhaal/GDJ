// PWA - Gestion de l'installation et du service worker

let deferredPrompt;
let swRegistration;

// Enregistrer le service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker enregistré avec succès:', swRegistration.scope);

      // Vérifier les mises à jour du service worker
      swRegistration.addEventListener('updatefound', () => {
        const newWorker = swRegistration.installing;
        console.log('[PWA] Nouvelle version du Service Worker détectée');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version disponible
            afficherNotificationMiseAJour();
          }
        });
      });

      // Écouter les messages du service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_SUCCESS') {
          console.log('[PWA]', event.data.message);
          // Afficher une notification ou toast (optionnel)
        }
      });

    } catch (error) {
      console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
    }
  });
}

// Intercepter l'événement d'installation de la PWA
window.addEventListener('beforeinstallprompt', (e) => {
  // Empêcher l'affichage automatique du navigateur
  e.preventDefault();

  // Sauvegarder l'événement pour l'utiliser plus tard
  deferredPrompt = e;

  // Afficher le bouton d'installation personnalisé
  afficherBoutonInstallation();

  console.log('[PWA] Événement beforeinstallprompt intercepté');
});

// Fonction pour afficher le bouton d'installation
function afficherBoutonInstallation() {
  // Créer le bouton d'installation s'il n'existe pas déjà
  if (document.getElementById('pwaInstallBtn')) return;

  const installBtn = document.createElement('button');
  installBtn.id = 'pwaInstallBtn';
  installBtn.innerHTML = '📱 Installer l\'app';
  installBtn.className = 'btn-primary';
  installBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.2s;
  `;

  installBtn.addEventListener('click', installerPWA);
  installBtn.addEventListener('mouseenter', () => {
    installBtn.style.transform = 'scale(1.05)';
  });
  installBtn.addEventListener('mouseleave', () => {
    installBtn.style.transform = 'scale(1)';
  });

  document.body.appendChild(installBtn);

  // Cacher le bouton après 10 secondes si pas d'interaction
  setTimeout(() => {
    if (installBtn && installBtn.parentElement) {
      installBtn.style.opacity = '0.5';
      installBtn.style.transition = 'opacity 0.5s';
    }
  }, 10000);
}

// Fonction pour installer la PWA
async function installerPWA() {
  if (!deferredPrompt) {
    console.log('[PWA] Aucune demande d\'installation disponible');
    return;
  }

  // Afficher la boîte de dialogue d'installation
  deferredPrompt.prompt();

  // Attendre la réponse de l'utilisateur
  const { outcome } = await deferredPrompt.userChoice;
  console.log('[PWA] Choix de l\'utilisateur:', outcome);

  if (outcome === 'accepted') {
    console.log('[PWA] L\'utilisateur a accepté l\'installation');
  } else {
    console.log('[PWA] L\'utilisateur a refusé l\'installation');
  }

  // Réinitialiser la variable
  deferredPrompt = null;

  // Masquer le bouton d'installation
  const installBtn = document.getElementById('pwaInstallBtn');
  if (installBtn) {
    installBtn.remove();
  }
}

// Détecter quand l'app est installée
window.addEventListener('appinstalled', () => {
  console.log('[PWA] Application installée avec succès');
  deferredPrompt = null;

  // Masquer le bouton d'installation
  const installBtn = document.getElementById('pwaInstallBtn');
  if (installBtn) {
    installBtn.remove();
  }

  // Afficher un message de succès (optionnel)
  if (typeof customAlert === 'function') {
    customAlert('✅ Application installée avec succès !', 'success');
  }
});

// Afficher une notification pour la mise à jour
function afficherNotificationMiseAJour() {
  if (typeof customConfirm === 'function') {
    customConfirm(
      'Une nouvelle version de l\'application est disponible. Voulez-vous la mettre à jour ?',
      () => {
        // Accepté - recharger la page
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      },
      () => {
        // Refusé - ne rien faire
        console.log('[PWA] Mise à jour refusée par l\'utilisateur');
      }
    );
  } else {
    // Fallback si customConfirm n'est pas disponible
    if (confirm('Une nouvelle version est disponible. Mettre à jour ?')) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
}

// Vérifier si l'app est déjà installée (mode standalone)
function estInstalle() {
  // Mode standalone (app installée)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // iOS Safari
  if (window.navigator.standalone === true) {
    return true;
  }

  return false;
}

// Afficher un message si l'app est en mode installé
if (estInstalle()) {
  console.log('[PWA] Application en mode installé');
}

// Fonction pour synchroniser les données en arrière-plan
async function demanderSyncArrierePlan() {
  if ('serviceWorker' in navigator && 'sync' in swRegistration) {
    try {
      await swRegistration.sync.register('sync-data');
      console.log('[PWA] Synchronisation en arrière-plan enregistrée');
    } catch (error) {
      console.error('[PWA] Erreur lors de l\'enregistrement de la sync:', error);
    }
  }
}

// Exposer les fonctions globalement pour utilisation dans d'autres scripts
window.pwaUtils = {
  installerPWA,
  demanderSyncArrierePlan,
  estInstalle
};

// Gestion de la connexion réseau
window.addEventListener('online', () => {
  console.log('[PWA] Connexion Internet rétablie');
  // Tenter une synchronisation
  if (typeof syncWithGitHub === 'function') {
    syncWithGitHub();
  }
});

window.addEventListener('offline', () => {
  console.log('[PWA] Connexion Internet perdue - Mode hors ligne');
  if (typeof customAlert === 'function') {
    customAlert('⚠️ Mode hors ligne activé. Vos modifications seront synchronisées dès le retour de la connexion.', 'warning');
  }
});
