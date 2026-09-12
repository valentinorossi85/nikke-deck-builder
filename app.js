// Configuration
const CONFIG = {
    MAX_CARDS: 40,
    MAX_COPIES: 3
};

// État
let allCards = [];
let filteredCards = [];
let isLeaderFilterActive = false;

let deck = {
    leader: null,
    cards: []
};

// --- CHARGEMENT ---
async function loadCards() {
    try {
        const response = await fetch('./cards_english.json');
        if (!response.ok) throw new Error("Impossible de charger cards_english.json");
        allCards = await response.json();
        console.log(`${allCards.length} cartes chargées.`);
        
        // Filtrage initial
        applyFilters();
    } catch (error) {
        console.error(error);
        document.getElementById('cardList').innerHTML = `<div style="color:red">Erreur: ${error.message}</div>`;
    }
}

// --- FILTRES ---
function toggleLeaderFilter() {
    const checkbox = document.getElementById('leaderOnlyCheck');
    isLeaderFilterActive = checkbox.checked;
    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('ipFilter')?.value || 'all';

    filteredCards = allCards.filter(card => {
        // Text filter
        const matchText = card.name.toLowerCase().includes(searchTerm) || 
                          card.id.toLowerCase().includes(searchTerm);

        // Type filter (Unit, Leader, Skill)
        let matchType = true;
        if (typeFilter !== 'all') {
            matchType = card.type && card.type.toLowerCase() === typeFilter.toLowerCase();
        }

        // Leader filter
        let matchLeader = true;
        if (isLeaderFilterActive) {
            matchLeader = card.type && card.type.toLowerCase().includes('leader');
        }

        return matchText && matchType && matchLeader;
    });

    renderCardList();
}

// Listener pour la recherche
document.getElementById('searchInput')?.addEventListener('input', applyFilters);

// Listener pour le filtre par type
document.getElementById('ipFilter')?.addEventListener('change', applyFilters);

// --- AFFICHAGE CARTES (Avec Drag & Drop intégré) ---
function renderCardList() {
    const container = document.getElementById('cardList');
    if (!container) return;

    if (filteredCards.length === 0) {
        container.innerHTML = '<p>No cards found.</p>';
        return;
    }

    container.innerHTML = filteredCards.map((card, index) => {
        // Déterminer si c'est une carte draggable (toujours oui, mais visuel différent si leader filter)
        const isLeaderCard = card.type && card.type.toLowerCase().includes('leader');
        const borderStyle = isLeaderCard ? 'border: 2px solid gold;' : '';
        const opacityStyle = isLeaderFilterActive && !isLeaderCard ? 'opacity: 0.3;' : '';
        

        return `
        <div class="card-item" 
             style="${borderStyle} ${opacityStyle} cursor: grab;"
             draggable="true" 
             ondragstart="handleDragStart(event, '${card.id}')"
             ondblclick="setAsLeader('${card.id}')"
             onclick="showCardDetails('${card.id}')">
            
            <img src="${card.image}" alt="${card.name}" class="card-thumbnail" 
                 onerror="this.src='https://via.placeholder.com/150x200?text=No+Image'">
            
            <div class="card-info">
                <h4>${card.name}</h4>
                <span class="card-rarity">${card.type}</span>
                ${isLeaderCard && isLeaderFilterActive ? '<span style="color:gold; font-weight:bold;">★ LEADER</span>' : ''}
            </div>
            
            <button class="btn-add" onclick="event.stopPropagation(); addToDeck('${card.id}')">+</button>
        </div>
    `}).join('');
}

// --- GESTION DU DRAG & DROP ---

// 1. Démarrage du glisser
window.handleDragStart = function(event, cardId) {
    event.dataTransfer.setData('text/plain', cardId);
    event.dataTransfer.effectAllowed = 'move';
    // Petit effet visuel
    setTimeout(() => event.target.style.opacity = '0.5', 0);
};

// 2. Fin du glisser (reset opacité)
// On délègue l'événement au document pour capturer la fin peu importe où on lâche
document.addEventListener('dragend', (event) => {
    if (event.target.classList.contains('card-item')) {
        event.target.style.opacity = '1';
    }
});

// 3. Configuration de la zone de drop (Leader Slot)
function initLeaderZone() {
    const zone = document.getElementById('leader-slot');
    if (!zone) return;

    // Empêcher le comportement par défaut (nécessaire pour autoriser le drop)
    zone.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
        zone.style.borderColor = '#ffd700';
        zone.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
        zone.style.transform = 'scale(1.02)';
    });

    zone.addEventListener('dragleave', () => {
        zone.style.borderColor = '#ccc';
        zone.style.backgroundColor = 'transparent';
        zone.style.transform = 'scale(1)';
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.style.borderColor = '#ccc';
        zone.style.backgroundColor = 'transparent';
        zone.style.transform = 'scale(1)';

        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId) {
            const card = allCards.find(c => c.id === cardId);
            if (card) {
                setAsLeader(cardId);
            }
        }
    });
}

// --- LOGIQUE METIER ---

window.setAsLeader = function(cardIdOrObj) {
    let card;
    if (typeof cardIdOrObj === 'string') {
        card = allCards.find(c => c.id === cardIdOrObj);
    } else {
        card = cardIdOrObj;
    }

    if (!card) return;

    // Vérification : est-ce vraiment un leader ?
    if (!card.type.toLowerCase().includes('leader')) { 
        alert("Cette carte n'est pas un Leader !"); 
        return; 
    }

    if (deck.leader && deck.leader.id === card.id) {
        // Si on clique sur le leader actuel, on le retire
        deck.leader = null;
    } else {
        // Si un ancien leader existe, on le remet dans le deck
        if (deck.leader) {
            deck.cards.push(deck.leader);
        }
        // Nouveau leader
        deck.leader = card;
        
        // Retirer du deck normal si présent
        const idx = deck.cards.findIndex(c => c.id === card.id);
        if (idx > -1) deck.cards.splice(idx, 1);
    }

    updateUI();
};

window.addToDeck = function(cardId) {
    const card = allCards.find(c => c.id === cardId);
    if (!card) return;

    // Si c'est un leader, on propose de le mettre en leader directement
    if (card.type && card.type.toLowerCase().includes('leader')) {
        if(confirm(`Voulez-vous définir "${card.name}" comme Leader ?`)) {
            setAsLeader(card);
            return;
        }
        // Si l'utilisateur annule, on ne fait rien (on n'ajoute pas au deck)
        return;
    }

    if (deck.cards.length >= CONFIG.MAX_CARDS) {
        alert("Deck complet (40 cartes)");
        return;
    }

    const count = deck.cards.filter(c => c.id === card.id).length;
    if (count >= CONFIG.MAX_COPIES) {
        alert(`Maximum ${CONFIG.MAX_COPIES} exemplaires autorisés`);
        return;
    }

    deck.cards.push(card);
    updateUI();
};

window.removeFromDeck = function(index) {
    deck.cards.splice(index, 1);
    updateUI();
};

window.removeLeader = function() {
    deck.leader = null;
    updateUI();
};

// --- MISE A JOUR INTERFACE ---
function updateUI() {
    renderLeader();
    renderDeck();
    updateStats();
    validateDeck();
}

function renderLeader() {
    const container = document.getElementById('leader-slot');
    if (!container) return;

    if (deck.leader) {
        container.innerHTML = `
            <div class="card-in-deck" style="position:relative;">
                <img src="${deck.leader.image}" alt="${deck.leader.name}" style="width:100%; border-radius:8px;">
                <button class="btn-remove" onclick="removeLeader()" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">×</button>
                <div style="text-align:center; font-weight:bold; margin-top:5px;">${deck.leader.name}</div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <p style="color: #888; font-size: 0.9em; text-align: center; margin-top: 20px; pointer-events:none;">
                Glissez un Leader ici<br>ou double-cliquez sur une carte
            </p>`;
    }
}

function renderDeck() {
    const container = document.getElementById('deckList');
    if (!container) return;

    if (deck.cards.length === 0) {
        container.innerHTML = '<p>Votre deck est vide.</p>';
        return;
    }

    container.innerHTML = deck.cards.map((card, index) => `
        <div class="card-in-deck">
            <img src="${card.image}" alt="${card.name}">
            <button class="btn-remove" onclick="removeFromDeck(${index})">×</button>
        </div>
    `).join('');
}

function updateStats() {
    const el = document.getElementById('deckStats');
    if (!el) return;
    el.innerHTML = `
        <div>Cartes: <strong>${deck.cards.length}/40</strong></div>
        <div>Leader: <strong>${deck.leader ? 'OK' : 'MANQUANT'}</strong></div>
    `;
}

function validateDeck() {
    const el = document.getElementById('validationResult');
    if (!el) return;
    
    const isValid = deck.leader && deck.cards.length === 40;
    el.className = isValid ? 'validation valid' : 'validation invalid';
    el.innerHTML = isValid ? '✅ Deck Valide !' : '❌ Deck Invalide (Il faut 1 Leader et 40 cartes)';
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadCards();
    initLeaderZone();
    console.log("Application prête. Drag & Drop activé.");
});

// --- GESTION DE LA MODALE (Popup détails carte) ---

// Afficher la modale avec les détails de la carte
window.showCardDetails = function(cardId) {
    const card = allCards.find(c => c.id === cardId);
    if (!card) return;

    const modal = document.getElementById('cardModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="modal-body">
            <h2>${card.name}</h2>
            <img src="${card.image}" alt="${card.name}" class="card-image" onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'">
            
            <div class="modal-info-row">
                <span class="modal-info-label">ID:</span>
                <span class="modal-info-value">${card.id}</span>
            </div>
            <div class="modal-info-row">
                <span class="modal-info-label">Type:</span>
                <span class="modal-info-value">${card.type || '-'}</span>
            </div>
            <div class="modal-info-row">
                <span class="modal-info-label">Attribute:</span>
                <span class="modal-info-value">${card.attribute || '-'}</span>
            </div>
            <div class="modal-info-row">
                <span class="modal-info-label">Cost:</span>
                <span class="modal-info-value">${card.cost || '-'}</span>
            </div>
            <div class="modal-info-row">
                <span class="modal-info-label">Power:</span>
                <span class="modal-info-value">${card.power || '-'}</span>
            </div>
            <div class="modal-info-row">
                <span class="modal-info-label">Hit:</span>
                <span class="modal-info-value">${card.hit || '-'}</span>
            </div>
            <div class="modal-info-row">
                <span class="modal-info-label">Affiliation:</span>
                <span class="modal-info-value">${card.affiliation || '-'}</span>
            </div>
            <div class="modal-info-row">
                <span class="modal-info-label">Keywords:</span>
                <span class="modal-info-value">${card.keyword || '-'}</span>
            </div>
            
            ${card.effect ? `<div class="modal-effect"><strong>Effect:</strong><br>${card.effect}</div>` : ''}
        </div>
    `;
    
    modal.classList.add('active');
};

// Fermer la modale
window.closeModal = function(event) {
    if (event.target.id === 'cardModal') {
        document.getElementById('cardModal').classList.remove('active');
    }
};

window.closeModalDirect = function() {
    document.getElementById('cardModal').classList.remove('active');
};