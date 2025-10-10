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
    settings: {
        lastProductId: 0,
        lastMembreId: 0,
        lastTransactionId: 0,
        lastGameId: 0,
        lastAdhesionId: 0,
        lastEvenementId: 0,
        lastAnnonceId: 0
    }
};

// ===== GESTION DES DONNÉES =====

// Charger les données depuis localStorage
function loadLocalData() {
    const saved = localStorage.getItem('gdjData');
    if (saved) {
        appData = JSON.parse(saved);
    }
}

// Sauvegarder les données dans localStorage
function saveLocalData() {
    localStorage.setItem('gdjData', JSON.stringify(appData));
}

// Synchroniser avec GitHub via Netlify Function
async function syncWithGitHub() {
    console.log('🔄 Tentative de synchronisation avec GitHub...');
    try {
        const response = await fetch('/.netlify/functions/github-sync', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appData)
        });

        console.log('📡 Réponse reçue, status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Données synchronisées avec GitHub', result);
            return true;
        } else {
            const error = await response.json();
            console.error('❌ Erreur de synchronisation:', response.status, error);
            alert('Erreur de synchronisation: ' + (error.error || 'Erreur inconnue'));
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur réseau lors de la synchronisation:', error);
        alert('Erreur réseau: ' + error.message);
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
            const data = await response.json();
            appData = data;
            saveLocalData();
            console.log('✅ Données chargées depuis GitHub:', {
                produits: data.produits.length,
                membres: data.membres.length,
                transactions: data.transactions.length
            });
        } else {
            const error = await response.json();
            console.warn('⚠️ Impossible de charger depuis GitHub:', error);
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
        loadMembers();
    } else if (tabName === 'history') {
        loadUserHistory();
    }
}

// ===== AUTHENTIFICATION =====

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const mot_de_passe = document.getElementById('loginPassword').value;

    const membre = appData.membres.find(m => m.email === email);

    if (!membre || membre.mot_de_passe !== mot_de_passe) {
        alert('Email ou mot de passe incorrect');
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
    } else {
        document.getElementById('memberUserInfo').textContent =
            `${currentUser.prenom} ${currentUser.nom}`;
        showPage('memberPage');
        loadProductsForShopping();
    }
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = document.getElementById('registerNom').value;
    const prenom = document.getElementById('registerPrenom').value;
    const email = document.getElementById('registerEmail').value;
    const mot_de_passe = document.getElementById('registerPassword').value;

    // Vérifier si l'email existe déjà
    if (appData.membres.find(m => m.email === email)) {
        alert('Cet email est déjà utilisé');
        return;
    }

    const nouveauMembre = {
        id: ++appData.settings.lastMembreId,
        nom,
        prenom,
        email,
        mot_de_passe,
        role: appData.membres.length === 0 ? 'admin' : 'membre', // Premier utilisateur = admin
        ardoise: 0,
        date_inscription: new Date().toISOString()
    };

    appData.membres.push(nouveauMembre);
    saveLocalData();
    syncWithGitHub();

    alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
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
        showTab(tabName, e);
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

function deleteProduct(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

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

    appData.membres.forEach(member => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${member.nom}</td>
            <td>${member.prenom}</td>
            <td>${member.email}</td>
            <td>${member.ardoise.toFixed(2)} €</td>
            <td>${new Date(member.date_inscription).toLocaleDateString()}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ===== SHOPPING (MEMBRE) =====

function loadProductsForShopping() {
    const container = document.getElementById('productsList');
    container.innerHTML = '';

    appData.produits.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <h3>${product.nom}</h3>
            <p class="price">${product.prix.toFixed(2)} €</p>
            <p class="stock ${product.stock < 5 ? 'low' : ''}">
                Stock: ${product.stock}
            </p>
            <div class="product-quantity">
                <button onclick="decreaseQuantity(${product.id})">-</button>
                <input type="number" id="qty-${product.id}" value="0" min="0" max="${product.stock}" readonly>
                <button onclick="increaseQuantity(${product.id}, ${product.stock})">+</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function increaseQuantity(productId, maxStock) {
    const input = document.getElementById(`qty-${productId}`);
    const currentValue = parseInt(input.value);
    if (currentValue < maxStock) {
        input.value = currentValue + 1;
        updateCart();
    }
}

function decreaseQuantity(productId) {
    const input = document.getElementById(`qty-${productId}`);
    const currentValue = parseInt(input.value);
    if (currentValue > 0) {
        input.value = currentValue - 1;
        updateCart();
    }
}

function updateCart() {
    cart = [];
    let total = 0;

    appData.produits.forEach(product => {
        const input = document.getElementById(`qty-${product.id}`);
        if (input) {
            const quantity = parseInt(input.value);
            if (quantity > 0) {
                cart.push({
                    produit_id: product.id,
                    quantite: quantity,
                    nom: product.nom,
                    prix: product.prix
                });
                total += product.prix * quantity;
            }
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
    loadProductsForShopping();
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
}

function payTransaction(transactionId) {
    const mode_paiement = prompt('Mode de paiement (especes/paypal):');
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

// ===== INITIALISATION =====

window.onload = async () => {
    // Charger les données depuis GitHub ou localStorage
    await loadFromGitHub();

    const savedUser = localStorage.getItem('currentUser');

    if (savedUser) {
        currentUser = JSON.parse(savedUser);

        if (currentUser.role === 'admin') {
            document.getElementById('adminUserInfo').textContent =
                `${currentUser.prenom} ${currentUser.nom} (Admin)`;
            showPage('adminPage');
            loadProducts();
        } else {
            document.getElementById('memberUserInfo').textContent =
                `${currentUser.prenom} ${currentUser.nom}`;
            showPage('memberPage');
            loadProductsForShopping();
        }
    } else {
        showPage('loginPage');
    }
};
