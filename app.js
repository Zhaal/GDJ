// Système de gestion des données locales et GitHub
let currentUser = null;
let cart = [];
let appData = {
    produits: [],
    membres: [],
    transactions: [],
    ludotheque: [],
    adhesions: [],
    evenements: [],
    annonces: [],
    reapprovisionnements: [],
    achatsDivers: [],
    fonds: [],
    membresPreferences: {},
    settings: {
        lastProductId: 0,
        lastMembreId: 0,
        lastTransactionId: 0,
        lastGameId: 0,
        lastAdhesionId: 0,
        lastEvenementId: 0,
        lastAnnonceId: 0,
        lastReapproId: 0,
        lastAchatDiversId: 0,
        lastFondsId: 0
    }
};

// ===== CHIFFREMENT DES DONNÉES SENSIBLES =====

// Clé de chiffrement (en production, devrait être générée et stockée de manière sécurisée)
const ENCRYPTION_KEY = 'GDJ-2025-SECRET-KEY-CHANGE-ME-IN-PRODUCTION';

// Fonction simple de chiffrement XOR (pour une sécurité basique)
function encrypt(text) {
    if (!text) return null;
    const encoded = btoa(unescape(encodeURIComponent(text)));
    let result = '';
    for (let i = 0; i < encoded.length; i++) {
        result += String.fromCharCode(
            encoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
        );
    }
    return btoa(result);
}

// Fonction de déchiffrement
function decrypt(encrypted) {
    if (!encrypted) return null;
    try {
        const decoded = atob(encrypted);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(
                decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
            );
        }
        return decodeURIComponent(escape(atob(result)));
    } catch (e) {
        console.error('Erreur de déchiffrement:', e);
        return null;
    }
}

// Chiffrer les données sensibles d'un membre
function encryptMemberData(membre) {
    return {
        ...membre,
        nom: encrypt(membre.nom),
        prenom: encrypt(membre.prenom),
        email: membre.email ? encrypt(membre.email) : null,
        mot_de_passe: encrypt(membre.mot_de_passe)
    };
}

// Déchiffrer les données sensibles d'un membre
function decryptMemberData(membre) {
    return {
        ...membre,
        nom: decrypt(membre.nom),
        prenom: decrypt(membre.prenom),
        email: membre.email ? decrypt(membre.email) : null,
        mot_de_passe: decrypt(membre.mot_de_passe)
    };
}

// ===== GESTION DES DONNÉES =====

// Charger les données depuis localStorage
function loadLocalData() {
    const saved = localStorage.getItem('gdjData');
    if (saved) {
        appData = JSON.parse(saved);
        // S'assurer que toutes les propriétés existent
        if (!appData.ludotheque) appData.ludotheque = [];
        if (!appData.adhesions) appData.adhesions = [];
        if (!appData.evenements) appData.evenements = [];
        if (!appData.annonces) appData.annonces = [];
        if (!appData.reapprovisionnements) appData.reapprovisionnements = [];
        if (!appData.achatsDivers) appData.achatsDivers = [];
        if (!appData.fonds) appData.fonds = [];
        if (!appData.membresPreferences) appData.membresPreferences = {};
        if (!appData.settings.lastGameId) appData.settings.lastGameId = 0;
        if (!appData.settings.lastAdhesionId) appData.settings.lastAdhesionId = 0;
        if (!appData.settings.lastEvenementId) appData.settings.lastEvenementId = 0;
        if (!appData.settings.lastAnnonceId) appData.settings.lastAnnonceId = 0;
        if (!appData.settings.lastReapproId) appData.settings.lastReapproId = 0;
        if (!appData.settings.lastAchatDiversId) appData.settings.lastAchatDiversId = 0;
        if (!appData.settings.lastFondsId) appData.settings.lastFondsId = 0;

        // Déchiffrer les données sensibles des membres
        if (appData.membres && appData.membres.length > 0) {
            appData.membres = appData.membres.map(m => decryptMemberData(m));
        }
    }
}

// Sauvegarder les données dans localStorage
function saveLocalData() {
    // Créer une copie des données avec les membres chiffrés
    const dataToSave = {
        ...appData,
        membres: appData.membres.map(m => encryptMemberData(m))
    };
    localStorage.setItem('gdjData', JSON.stringify(dataToSave));
}

// Synchroniser avec GitHub via Netlify Function
async function syncWithGitHub(silent = false) {
    console.log('🔄 Tentative de synchronisation avec GitHub...');
    try {
        // Créer une copie des données avec les membres chiffrés
        const dataToSync = {
            ...appData,
            membres: appData.membres.map(m => encryptMemberData(m))
        };

        const response = await fetch('/.netlify/functions/github-sync', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSync)
        });

        console.log('📡 Réponse reçue, status:', response.status);

        if (response.ok) {
            // Vérifier si la réponse est du JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                console.log('✅ Données synchronisées avec GitHub', result);
                return true;
            } else {
                const text = await response.text();
                console.log('✅ Synchronisation réussie:', text);
                return true;
            }
        } else {
            // Tenter de parser le JSON d'erreur, sinon récupérer le texte
            const contentType = response.headers.get('content-type');
            let errorMessage = 'Erreur inconnue';
            let errorDetails = '';

            try {
                if (contentType && contentType.includes('application/json')) {
                    const error = await response.json();
                    errorMessage = error.error || error.message || 'Erreur de synchronisation';
                    errorDetails = error.details || '';
                } else {
                    const text = await response.text();
                    errorMessage = text || `Erreur HTTP ${response.status}`;
                }
            } catch (e) {
                errorMessage = `Erreur HTTP ${response.status}`;
                console.error('Erreur de parsing:', e);
            }

            console.error('❌ Erreur de synchronisation:', {
                status: response.status,
                message: errorMessage,
                details: errorDetails
            });

            const fullMessage = errorDetails
                ? `${errorMessage}\n\nDétails:\n${errorDetails}`
                : errorMessage;

            if (!silent) {
                alert('Erreur de synchronisation: ' + fullMessage);
            }
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur réseau lors de la synchronisation:', error);
        if (!silent) {
            alert('Erreur réseau: ' + error.message);
        }
        return false;
    }
}

// Charger les données depuis GitHub via Netlify Function
async function loadFromGitHub() {
    console.log('📥 Chargement des données depuis GitHub...');
    try {
        const response = await fetch('/.netlify/functions/github-sync');

        console.log('📡 Réponse reçue, status:', response.status);

        if (response.ok) {
            // Vérifier si la réponse est du JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                appData = data;
                // S'assurer que toutes les propriétés existent
                if (!appData.ludotheque) appData.ludotheque = [];
                if (!appData.adhesions) appData.adhesions = [];
                if (!appData.evenements) appData.evenements = [];
                if (!appData.annonces) appData.annonces = [];
                if (!appData.reapprovisionnements) appData.reapprovisionnements = [];
                if (!appData.achatsDivers) appData.achatsDivers = [];
                if (!appData.fonds) appData.fonds = [];
                if (!appData.membresPreferences) appData.membresPreferences = {};
                if (!appData.settings.lastGameId) appData.settings.lastGameId = 0;
                if (!appData.settings.lastAdhesionId) appData.settings.lastAdhesionId = 0;
                if (!appData.settings.lastEvenementId) appData.settings.lastEvenementId = 0;
                if (!appData.settings.lastAnnonceId) appData.settings.lastAnnonceId = 0;
                if (!appData.settings.lastReapproId) appData.settings.lastReapproId = 0;
                if (!appData.settings.lastAchatDiversId) appData.settings.lastAchatDiversId = 0;
                if (!appData.settings.lastFondsId) appData.settings.lastFondsId = 0;

                // Déchiffrer les données sensibles des membres
                if (appData.membres && appData.membres.length > 0) {
                    appData.membres = appData.membres.map(m => decryptMemberData(m));
                }

                saveLocalData();
                console.log('✅ Données chargées depuis GitHub:', {
                    produits: data.produits.length,
                    membres: data.membres.length,
                    transactions: data.transactions.length
                });
            } else {
                console.warn('⚠️ Réponse non-JSON reçue de GitHub');
                console.log('📂 Chargement depuis localStorage à la place');
                loadLocalData();
            }
        } else {
            // Tenter de parser le JSON d'erreur
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const error = await response.json();
                    console.warn('⚠️ Impossible de charger depuis GitHub:', error);
                } else {
                    const text = await response.text();
                    console.warn('⚠️ Impossible de charger depuis GitHub (HTTP', response.status + '):', text);
                }
            } catch (e) {
                console.warn('⚠️ Impossible de charger depuis GitHub (HTTP', response.status + ')');
            }
            console.log('📂 Chargement depuis localStorage à la place');
            loadLocalData();
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
        console.log('📂 Chargement depuis localStorage à la place');
        loadLocalData();
    }
}

// ===== NAVIGATION =====

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showTab(tabName, event) {
    const parentPage = event.target.closest('.page');
    parentPage.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    parentPage.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    event.target.classList.add('active');
    parentPage.querySelector(`#${tabName}Tab`).classList.add('active');

    // Charger les données selon l'onglet
    if (tabName === 'membres' && currentUser?.role === 'admin') {
        updateMembersTable();
    } else if (tabName === 'ludotheque') {
        loadLudotheque();
    } else if (tabName === 'ludotheque-membres') {
        loadMembreFilterLudo();
        loadLudothequeByMembre(''); // Affichage vide au début
    } else if (tabName === 'ludotheque-view') {
        loadMembreFilterLudoMembre();
        loadLudothequeMembre();
    } else if (tabName === 'adhesions') {
        loadAdhesions();
    } else if (tabName === 'calendrier') {
        loadCalendar();
    } else if (tabName === 'calendrier-view') {
        loadCalendarMembre();
    } else if (tabName === 'annonces-admin') {
        loadAnnonces();
    } else if (tabName === 'annonces-view') {
        loadAnnoncesMembre();
    } else if (tabName === 'export') {
        loadStats();
    } else if (tabName === 'history') {
        loadUserHistory();
    }
}

// ===== AUTHENTIFICATION =====

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const pseudo = document.getElementById('loginPseudo').value;
    const mot_de_passe = document.getElementById('loginPassword').value;

    const membre = appData.membres.find(m => m.pseudo === pseudo);

    if (!membre || membre.mot_de_passe !== mot_de_passe) {
        alert('Pseudo ou mot de passe incorrect');
        return;
    }

    // Vérifier si le compte est validé (sauf pour les admins)
    if (membre.role !== 'admin' && membre.statut === 'en_attente') {
        alert('Votre compte est en attente de validation par un administrateur.');
        return;
    }

    currentUser = {
        id: membre.id,
        nom: membre.nom,
        prenom: membre.prenom,
        email: membre.email,
        role: membre.role
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    if (currentUser.role === 'admin') {
        document.getElementById('adminUserInfo').textContent =
            `${currentUser.prenom} ${currentUser.nom} (Admin)`;
        showPage('adminPage');
        loadProducts();
        updateSoumissionsBadge();
    } else {
        document.getElementById('memberUserInfo').textContent =
            `${currentUser.prenom} ${currentUser.nom}`;
        showPage('memberPage');
        loadProductsForShopping();
    }
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const pseudo = document.getElementById('registerPseudo').value;
    const nom = document.getElementById('registerNom').value;
    const prenom = document.getElementById('registerPrenom').value;
    const email = document.getElementById('registerEmail').value || null; // Email optionnel
    const mot_de_passe = document.getElementById('registerPassword').value;
    const mot_de_passe_confirm = document.getElementById('registerPasswordConfirm').value;

    // Vérifier que les mots de passe correspondent
    if (mot_de_passe !== mot_de_passe_confirm) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }

    // Vérifier si le pseudo existe déjà
    if (appData.membres.find(m => m.pseudo === pseudo)) {
        alert('Ce pseudo est déjà utilisé');
        return;
    }

    // Vérifier si l'email existe déjà (si fourni)
    if (email && appData.membres.find(m => m.email === email)) {
        alert('Cet email est déjà utilisé');
        return;
    }

    const isPremierMembre = appData.membres.length === 0;

    const nouveauMembre = {
        id: ++appData.settings.lastMembreId,
        pseudo,
        nom,
        prenom,
        email,
        mot_de_passe,
        role: isPremierMembre ? 'admin' : 'membre', // Premier utilisateur = admin
        statut: isPremierMembre ? 'valide' : 'en_attente', // Premier membre validé automatiquement
        ardoise: 0,
        date_inscription: new Date().toISOString()
    };

    appData.membres.push(nouveauMembre);
    saveLocalData();
    syncWithGitHub();

    if (isPremierMembre) {
        alert('Inscription réussie ! Vous êtes le premier utilisateur et avez été désigné comme administrateur. Vous pouvez maintenant vous connecter avec votre pseudo.');
    } else {
        alert('Inscription réussie ! Votre compte est en attente de validation par un administrateur. Vous recevrez une confirmation une fois validé.');
    }
    showPage('loginPage');
    document.getElementById('registerForm').reset();
});

document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('registerPage');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('loginPage');
});

document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('logoutMemberBtn').addEventListener('click', logout);

function logout() {
    currentUser = null;
    cart = [];
    localStorage.removeItem('currentUser');
    showPage('loginPage');
}

// ===== GESTION DES ONGLETS =====

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tabName = btn.getAttribute('data-tab');
        if (tabName) { // Ignorer les boutons sans data-tab (comme les filtres de durée)
            showTab(tabName, e);
        }
    });
});

// ===== GESTION DES PRODUITS (ADMIN) =====

function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';

    appData.produits.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.nom}</td>
            <td>${product.categorie}</td>
            <td>${product.prix.toFixed(2)} €</td>
            <td>${product.stock}</td>
            <td>${new Date(product.date_ajout).toLocaleDateString()}</td>
            <td>
                <button class="btn-edit" onclick="editProduct(${product.id})">Modifier</button>
                <button class="btn-danger" onclick="deleteProduct(${product.id})">Supprimer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('productForm').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Ajouter un produit';
    document.getElementById('productFormElement').reset();
    document.getElementById('productId').value = '';
});

document.getElementById('cancelProductBtn').addEventListener('click', () => {
    document.getElementById('productForm').style.display = 'none';
    document.getElementById('productFormElement').reset();
});

document.getElementById('productFormElement').addEventListener('submit', (e) => {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const product = {
        nom: document.getElementById('productNom').value,
        prix: parseFloat(document.getElementById('productPrix').value),
        stock: parseInt(document.getElementById('productStock').value),
        categorie: document.getElementById('productCategorie').value
    };

    if (productId) {
        // Modification
        const index = appData.produits.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
            appData.produits[index] = { ...appData.produits[index], ...product };
        }
    } else {
        // Ajout
        product.id = ++appData.settings.lastProductId;
        product.date_ajout = new Date().toISOString();
        appData.produits.push(product);
    }

    saveLocalData();
    syncWithGitHub();

    document.getElementById('productForm').style.display = 'none';
    document.getElementById('productFormElement').reset();
    loadProducts();
    alert('Produit enregistré avec succès');
});

function editProduct(id) {
    const product = appData.produits.find(p => p.id === id);
    if (product) {
        document.getElementById('productForm').style.display = 'block';
        document.getElementById('formTitle').textContent = 'Modifier le produit';
        document.getElementById('productId').value = product.id;
        document.getElementById('productNom').value = product.nom;
        document.getElementById('productPrix').value = product.prix;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productCategorie').value = product.categorie;
    }
}

async function deleteProduct(id) {
    const confirmed = await confirm('Êtes-vous sûr de vouloir supprimer ce produit ?');
    if (!confirmed) return;

    appData.produits = appData.produits.filter(p => p.id !== id);
    saveLocalData();
    syncWithGitHub();
    loadProducts();
    alert('Produit supprimé');
}

// ===== GESTION DES MEMBRES (ADMIN) =====

function loadMembers() {
    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = '';

    // Filtrer les membres supprimés et les admins
    appData.membres
        .filter(member => !member.supprime && member.role !== 'admin')
        .forEach(member => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-membre-id', member.id); // Ajouter l'ID du membre
            const statut = member.statut || 'valide'; // Pour compatibilité avec anciens membres
            tr.innerHTML = `
                <td>${member.pseudo || member.email}</td>
                <td>${member.nom}</td>
                <td>${member.prenom}</td>
                <td>${member.email || '-'}</td>
                <td>
                    <span class="badge ${statut === 'valide' ? 'success' : 'warning'}">
                        ${statut === 'valide' ? '✓ Validé' : '⏳ En attente'}
                    </span>
                </td>
                <td>${member.ardoise.toFixed(2)} €</td>
                <td>${new Date(member.date_inscription).toLocaleDateString()}</td>
                <td>
                    ${statut === 'en_attente' ?
                        `<button class="btn-primary" onclick="validerMembre(${member.id})">Valider</button>
                         <button class="btn-danger" onclick="refuserMembre(${member.id})">Refuser</button>` :
                        `<button class="btn-danger" onclick="supprimerMembre(${member.id})">Supprimer</button>`}
                </td>
            `;
            tbody.appendChild(tr);
        });
}

async function validerMembre(membreId) {
    const membre = appData.membres.find(m => m.id === membreId);
    if (!membre) return;

    const confirmed = await confirm(`Valider le compte de ${membre.prenom} ${membre.nom} ?`);
    if (confirmed) {
        membre.statut = 'valide';
        saveLocalData();
        syncWithGitHub();
        loadMembers();
        alert('Compte validé !');
    }
}

async function refuserMembre(membreId) {
    const membre = appData.membres.find(m => m.id === membreId);
    if (!membre) return;

    const confirmed = await confirm(`Refuser et supprimer le compte de ${membre.prenom} ${membre.nom} ?`);
    if (confirmed) {
        appData.membres = appData.membres.filter(m => m.id !== membreId);
        saveLocalData();
        syncWithGitHub();
        loadMembers();
        alert('Compte refusé et supprimé.');
    }
}

async function supprimerMembre(membreId) {
    const membre = appData.membres.find(m => m.id === membreId);
    if (!membre) return;

    // Vérifier si c'est le compte admin
    if (membre.role === 'admin') {
        alert('Impossible de supprimer un compte administrateur.');
        return;
    }

    // Compter les données liées
    const transactions = appData.transactions.filter(t => t.membre_id === membreId).length;
    const adhesions = appData.adhesions ? appData.adhesions.filter(a => a.membre_id === membreId).length : 0;
    const soumissions = appData.soumissions ? appData.soumissions.filter(s => s.auteur_id === membreId).length : 0;

    // Compter les inscriptions aux événements
    let nbInscriptions = 0;
    if (appData.evenements) {
        appData.evenements.forEach(e => {
            if (e.participants && e.participants.some(p => p.membre_id === membreId)) {
                nbInscriptions++;
            }
        });
    }

    let details = `Données liées qui seront conservées :\n`;
    details += `- ${transactions} transaction(s)\n`;
    details += `- ${adhesions} adhésion(s)\n`;
    details += `- ${soumissions} soumission(s)\n`;
    details += `- ${nbInscriptions} inscription(s) à des événements\n\n`;
    details += `Le membre sera marqué comme "supprimé" mais l'historique sera préservé.`;

    if (membre.ardoise !== 0) {
        details += `\n\nATTENTION: Ce membre a une ardoise de ${membre.ardoise.toFixed(2)} €`;
    }

    const confirmed = await showDeleteConfirm(`${membre.prenom} ${membre.nom}`, details);
    if (!confirmed) return;

    // Marquer le membre comme supprimé au lieu de le supprimer complètement
    membre.supprime = true;
    membre.date_suppression = new Date().toISOString();
    membre.statut = 'supprime';

    // Anonymiser les données personnelles sensibles (optionnel)
    // membre.email = `[SUPPRIME-${membre.id}]`;
    // membre.pseudo = `[SUPPRIME-${membre.id}]`;

    // Ne rien supprimer - toutes les données sont conservées

    saveLocalData();
    syncWithGitHub();
    loadMembers();
    alert('Membre supprimé avec toutes ses données associées.');
}

// ===== SHOPPING (MEMBRE) =====

let currentCategorieFilter = 'all';
let productQuantities = {}; // Stockage global des quantités

function loadProductsForShopping(categorieFilter = 'all') {
    const container = document.getElementById('productsList');

    // Sauvegarder les quantités actuelles avant de recharger
    appData.produits.forEach(product => {
        const input = document.getElementById(`qty-${product.id}`);
        if (input) {
            productQuantities[product.id] = parseInt(input.value) || 0;
        }
    });

    container.innerHTML = '';

    // Filtrer les produits par catégorie
    const produitsFiltres = categorieFilter === 'all'
        ? appData.produits
        : appData.produits.filter(p => p.categorie === categorieFilter);

    produitsFiltres.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const savedQuantity = productQuantities[product.id] || 0;
        card.innerHTML = `
            <h3>${product.nom}</h3>
            <p class="price">${product.prix.toFixed(2)} €</p>
            <p class="stock ${product.stock < 5 ? 'low' : ''}">
                Stock: ${product.stock}
            </p>
            <div class="product-quantity">
                <button onclick="decreaseQuantity(${product.id})">-</button>
                <input type="number" id="qty-${product.id}" value="${savedQuantity}" min="0" max="${product.stock}" readonly>
                <button onclick="increaseQuantity(${product.id}, ${product.stock})">+</button>
            </div>
        `;
        container.appendChild(card);
    });

    // Mettre à jour le panier après rechargement
    updateCart();
}

function increaseQuantity(productId, maxStock) {
    const input = document.getElementById(`qty-${productId}`);
    const currentValue = parseInt(input.value);
    if (currentValue < maxStock) {
        input.value = currentValue + 1;
        productQuantities[productId] = currentValue + 1;
        updateCart();
    }
}

function decreaseQuantity(productId) {
    const input = document.getElementById(`qty-${productId}`);
    const currentValue = parseInt(input.value);
    if (currentValue > 0) {
        input.value = currentValue - 1;
        productQuantities[productId] = currentValue - 1;
        updateCart();
    }
}

function updateCart() {
    cart = [];
    let total = 0;

    // Parcourir tous les produits en utilisant productQuantities
    appData.produits.forEach(product => {
        const quantity = productQuantities[product.id] || 0;
        if (quantity > 0) {
            cart.push({
                produit_id: product.id,
                quantite: quantity,
                nom: product.nom,
                prix: product.prix
            });
            total += product.prix * quantity;
        }
    });

    // Mettre à jour l'affichage du panier
    const cartItemsDiv = document.getElementById('cartItems');
    cartItemsDiv.innerHTML = '';

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <span>${item.nom} x${item.quantite}</span>
            <span>${(item.prix * item.quantite).toFixed(2)} €</span>
        `;
        cartItemsDiv.appendChild(div);
    });

    document.getElementById('cartTotal').textContent = total.toFixed(2);
}

document.getElementById('validateOrderBtn').addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Votre panier est vide');
        return;
    }

    const mode_paiement = document.getElementById('paymentMethod').value;
    let montant_total = 0;

    // Créer la transaction
    const transaction = {
        id: ++appData.settings.lastTransactionId,
        membre_id: currentUser.id,
        produits: [],
        montant_total: 0,
        mode_paiement,
        statut: mode_paiement === 'ardoise' ? 'en_attente' : 'payee',
        date_transaction: new Date().toISOString()
    };

    // Traiter chaque produit
    cart.forEach(item => {
        const produit = appData.produits.find(p => p.id === item.produit_id);
        if (produit) {
            // Vérifier le stock
            if (produit.stock < item.quantite) {
                alert(`Stock insuffisant pour ${produit.nom}`);
                return;
            }

            // Réduire le stock
            produit.stock -= item.quantite;

            // Ajouter au détail de transaction
            transaction.produits.push({
                nom: item.nom,
                quantite: item.quantite,
                prix_unitaire: item.prix
            });

            montant_total += item.prix * item.quantite;
        }
    });

    transaction.montant_total = montant_total;

    // Mettre à jour l'ardoise si nécessaire
    if (mode_paiement === 'ardoise') {
        const membre = appData.membres.find(m => m.id === currentUser.id);
        if (membre) {
            membre.ardoise += montant_total;
        }
    }

    appData.transactions.push(transaction);
    saveLocalData();
    syncWithGitHub();

    alert(`Commande validée ! Montant total: ${montant_total.toFixed(2)} €`);
    cart = [];
    productQuantities = {}; // Réinitialiser les quantités
    loadProductsForShopping(currentCategorieFilter); // Recharger avec le filtre actuel
    updateCart();
});

// ===== HISTORIQUE (MEMBRE) =====

function loadUserHistory() {
    const userTransactions = appData.transactions.filter(t => t.membre_id === currentUser.id);

    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    userTransactions.forEach(transaction => {
        const produitsStr = transaction.produits
            .map(p => `${p.nom} (x${p.quantite})`)
            .join(', ');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(transaction.date_transaction).toLocaleString()}</td>
            <td>${produitsStr}</td>
            <td>${transaction.montant_total.toFixed(2)} €</td>
            <td>${transaction.mode_paiement}</td>
            <td>
                <span class="badge ${transaction.statut === 'payee' ? 'success' : 'warning'}">
                    ${transaction.statut === 'payee' ? 'Payé' : 'En attente'}
                </span>
            </td>
            <td>
                ${transaction.statut === 'en_attente' ?
                    `<button class="btn-primary" onclick="payTransaction(${transaction.id})">Payer</button>` :
                    '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Charger l'ardoise
    const membre = appData.membres.find(m => m.id === currentUser.id);
    if (membre) {
        document.getElementById('userArdoise').textContent = `${membre.ardoise.toFixed(2)} €`;
    }

    // Charger le statut de l'adhésion
    const adhesion = appData.adhesions.find(a => a.membre_id === currentUser.id && a.annee === new Date().getFullYear());
    const adhesionStatusEl = document.getElementById('adhesionStatus');
    const adhesionDetailsEl = document.getElementById('adhesionDetails');

    if (adhesion && new Date(adhesion.date_fin) > new Date()) {
        adhesionStatusEl.textContent = '✓ À jour';
        adhesionStatusEl.style.color = '#2ecc71';

        const modePaiement = adhesion.mode_paiement === 'especes' ? 'Espèces' :
                            adhesion.mode_paiement === 'paypal' ? 'PayPal' :
                            adhesion.mode_paiement_autre || 'Autre';

        adhesionDetailsEl.innerHTML = `
            Valide jusqu'au ${new Date(adhesion.date_fin).toLocaleDateString()}<br>
            Montant: ${adhesion.montant.toFixed(2)} €<br>
            Paiement: ${modePaiement}
        `;
    } else {
        adhesionStatusEl.textContent = '✗ Expirée';
        adhesionStatusEl.style.color = '#e74c3c';
        adhesionDetailsEl.textContent = 'Veuillez renouveler votre adhésion';
    }
}

async function payTransaction(transactionId) {
    const options = [
        {value: 'especes', label: 'Espèces'},
        {value: 'paypal', label: 'PayPal'}
    ];
    const mode_paiement = await showPromptSelect('Choisissez le mode de paiement:', options, 'Mode de paiement');
    if (!mode_paiement) return;

    const transaction = appData.transactions.find(t => t.id === transactionId);
    if (transaction) {
        transaction.statut = 'payee';
        transaction.mode_paiement = mode_paiement;

        // Réduire l'ardoise
        const membre = appData.membres.find(m => m.id === currentUser.id);
        if (membre) {
            membre.ardoise -= transaction.montant_total;
        }

        saveLocalData();
        syncWithGitHub();
        alert('Transaction payée !');
        loadUserHistory();
    }
}

// Payer toute l'ardoise en une fois
async function payerArdoise() {
    const membre = appData.membres.find(m => m.id === currentUser.id);
    if (!membre) return;

    if (membre.ardoise <= 0) {
        alert('Votre ardoise est déjà à 0 €');
        return;
    }

    const confirmed = await confirm(`Voulez-vous payer toute votre ardoise ?\n\nMontant total : ${membre.ardoise.toFixed(2)} €`);
    if (!confirmed) return;

    const options = [
        {value: 'especes', label: 'Espèces'},
        {value: 'paypal', label: 'PayPal'}
    ];
    const mode_paiement = await showPromptSelect('Choisissez le mode de paiement:', options, 'Mode de paiement');
    if (!mode_paiement) return;

    // Mettre à jour toutes les transactions en attente
    const transactionsEnAttente = appData.transactions.filter(
        t => t.membre_id === currentUser.id && t.statut === 'en_attente'
    );

    transactionsEnAttente.forEach(transaction => {
        transaction.statut = 'payee';
        transaction.mode_paiement = mode_paiement;
    });

    // Réinitialiser l'ardoise
    membre.ardoise = 0;

    saveLocalData();
    syncWithGitHub();
    alert('Ardoise payée avec succès !');
    loadUserHistory();
}

// ===== RECHERCHE ET FILTRES LUDOTHÈQUE =====

// Event listeners pour la recherche admin
document.addEventListener('DOMContentLoaded', () => {
    const searchLudo = document.getElementById('searchLudo');
    if (searchLudo) {
        searchLudo.addEventListener('input', (e) => {
            loadLudotheque(e.target.value, currentDureeFilter);
        });
    }

    // Event listeners pour les filtres de durée admin
    const ludothequeTab = document.getElementById('ludothequeTab');
    if (ludothequeTab) {
        const dureeButtons = ludothequeTab.querySelectorAll('[data-duree]');
        dureeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Retirer l'état actif des autres boutons
                dureeButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const duree = e.target.getAttribute('data-duree');
                loadLudotheque(currentSearchLudo, duree);
            });
        });
    }

    // Event listeners pour la recherche membre
    const searchLudoMembre = document.getElementById('searchLudoMembre');
    if (searchLudoMembre) {
        searchLudoMembre.addEventListener('input', (e) => {
            loadLudothequeMembre(e.target.value, currentDureeFilterMembre, currentMembreFilterLudo);
        });
    }

    // Event listeners pour les filtres de durée membre
    const ludothequeViewTab = document.getElementById('ludotheque-viewTab');
    if (ludothequeViewTab) {
        const dureeButtons = ludothequeViewTab.querySelectorAll('[data-duree]');
        dureeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Retirer l'état actif des autres boutons
                dureeButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const duree = e.target.getAttribute('data-duree');
                loadLudothequeMembre(currentSearchLudoMembre, duree, currentMembreFilterLudo);
            });
        });
    }

    // Event listeners pour les filtres de catégorie (shopping)
    const shoppingTab = document.getElementById('shoppingTab');
    if (shoppingTab) {
        const categorieButtons = shoppingTab.querySelectorAll('[data-categorie]');
        categorieButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Retirer l'état actif des autres boutons
                categorieButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const categorie = e.target.getAttribute('data-categorie');
                currentCategorieFilter = categorie;
                loadProductsForShopping(categorie);
            });
        });
    }
});

// ===== INITIALISATION =====

window.onload = async () => {
    // Charger les données depuis GitHub ou localStorage
    await loadFromGitHub();

    // Initialiser les paramètres
    initSettings();

    // Nettoyer les annonces expirées
    cleanupExpiredAnnonces();

    const savedUser = localStorage.getItem('currentUser');

    if (savedUser) {
        currentUser = JSON.parse(savedUser);

        if (currentUser.role === 'admin') {
            document.getElementById('adminUserInfo').textContent =
                `${currentUser.prenom} ${currentUser.nom} (Admin)`;
            showPage('adminPage');
            loadProducts();
            initNewFeatures();
            updateSoumissionsBadge();
        } else {
            // Mettre à jour l'affichage du nom selon les préférences
            updateUserDisplay();
            showPage('memberPage');
            loadProductsForShopping();
            initNewFeatures();
            updateSoumissionsBadge(); // Pour les modérateurs
        }
    } else {
        showPage('loginPage');
    }
};
