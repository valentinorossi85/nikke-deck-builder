// Configuration
const CONFIG = {
    MAX_CARDS: 40,
    MAX_COPIES: 3
};

// État global
let allCards = [];
let filteredCards = [];
let deck = {
    leader: null,
    cards: []
};

// 1. Chargement des cartes
async function loadCards() {
    try {
        const response = await fetch('./cards.json');
        if (!response.ok) throw new Error("Impossible de charger cards.json");
        allCards = await response.json();
        filteredCards = [...allCards];
        renderCardList();
        updateStats();
        checkDeckValidity();
    } catch (error) {
        console.error(error);
        document.getElementById('cardList').innerHTML = `<div style="color:red">Erreur: ${error.message}</div>`;
    }
}

// 2. Affichage de la liste des cartes (Avec Drag & Drop activé)
function renderCardList() {
    const container = document.getElementById('cardList');
    if (!container) return;

    if (filteredCards.length === 0) {
        container.innerHTML = '<p>Aucune carte trouvée.</p>';
        return;
    }

    container.innerHTML = filteredCards.map(card => `
        <div class="card-item" 
             draggable="true" 
             ondragstart="handleDragStart(event, '${card.id}')"
             ondblclick="setLeader('${card.id}')">
            <img src="${card.image}" alt="${card.name}" loading="lazy">
            <div class="card-info">
                <h4>${card.name}</h4>
                <span class="rarity">${card.rarity || ''}</span>
            </div>
            <button class="btn-add" onclick="addToDeck('${card.id}')">+</button>
        </div>
    `).join('');
}

// 3. Gestion du Drag Start (Début du glisser)
window.handleDragStart = function(event, cardId) {
    event.dataTransfer.setData('text/plain', cardId);
    event.dataTransfer.effectAllowed = 'move';
    // Petit effet visuel
    setTimeout(() => event.target.style.opacity = '0.5', 0);
};

// Nettoyer l'opacité après le drag (sur le body pour être sûr)
document.addEventListener('dragend', (e) => {
    if(e.target.classList.contains('card-item')) {
        e.target.style.opacity = '1';
    }
});

// 4. Initialisation de la Zone Leader (Drop Zone)
function initLeaderZone() {
    const leaderZone = document.getElementById('leader-slot');
    if (!leaderZone) {
        console.error("ERreur: L'élément avec id='leader-slot' est introuvable dans le HTML !");
        return;
    }

    // Survol
    leaderZone.addEventListener('dragover', (e) => {
        e.preventDefault(); // Obligatoire pour autoriser le drop
        leaderZone.style.borderColor = '#ffd700';
        leaderZone.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
        leaderZone.style.transform = 'scale(1.02)';
    });

    // Sortie de zone
    leaderZone.addEventListener('dragleave', () => {
        leaderZone.style.borderColor = '#ccc';
        leaderZone.style.backgroundColor = 'transparent';
        leaderZone.style.transform = 'scale(1)';
    });

    // Drop (Relâcher la carte)
    leaderZone.addEventListener('drop', (e) => {
        e.preventDefault();
        leaderZone.style.borderColor = '#ccc';
        leaderZone.style.backgroundColor = 'transparent';
        leaderZone.style.transform = 'scale(1)';

        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId) {
            setLeader(cardId);
        }
    });
}

// 5. Fonction Logique : Définir le Leader
window.setLeader = function(cardId) {
    const card = allCards.find(c => c.id === cardId);
    if (!card) return;

    // Si c'est déjà le leader, on l'enlève (optionnel)
    if (deck.leader && deck.leader.id === cardId) {
        deck.leader = null;
    } else {
        // Si on avait un ancien leader, on le remet dans le deck
        if (deck.leader) {
            deck.cards.push(deck.leader);
        }
        // On définit le nouveau leader
        deck.leader = card;
        
        // On retire la carte du deck normal si elle y était
        deck.cards = deck.cards.filter(c => c.id !== cardId);
    }

    renderLeader();
    renderDeck(); // Mettre à jour le deck au cas où une carte a bougé
    updateStats();
    checkDeckValidity();
};

// 6. Ajouter une carte normale au deck (Clic simple sur le +)
window.addToDeck = function(cardId) {
    const card = allCards.find(c => c.id === cardId);
    if (!card) return;

    // Vérif Leader : si on clique sur un leader via le bouton +, on le met en leader directement
    if (card.type === 'Leader' || card.keyword?.includes('Leader')) {
        setLeader(cardId);
        return;
    }

    // Vérif copies max
    const count = deck.cards.filter(c => c.id === cardId).length;
    if (count >= CONFIG.MAX_COPIES) {
        alert(`Maximum ${CONFIG.MAX_COPIES} exemplaires autorisés.`);
        return;
    }

    // Vérif taille deck
    if (deck.cards.length >= CONFIG.MAX_CARDS) {
        alert("Deck plein (40 cartes max).");
        return;
    }

    deck.cards.push(card);
    renderDeck();
    updateStats();
    checkDeckValidity();
};

// 7. Retirer une carte du deck
window.removeFromDeck = function(index) {
    deck.cards.splice(index, 1);
    renderDeck();
    updateStats();
    checkDeckValidity();
};

// 8. Retirer le leader
window.removeLeader = function() {
    deck.leader = null;
    renderLeader();
    updateStats();
    checkDeckValidity();
};

// 9. Rendu du Leader
function renderLeader() {
    const container = document.getElementById('leader-slot');
    if (!container) return;

    if (deck.leader) {
        container.innerHTML = `
            <div class="card-in-deck leader-card">
                <img src="${deck.leader.image}" alt="${deck.leader.name}">
                <div class="card-name-overlay">${deck.leader.name}</div>
                <button class="btn-remove" onclick="removeLeader()">×</button>
            </div>
        `;
    } else {
        container.innerHTML = `<p style="color:#888; padding:20px; text-align:center;">Glissez un leader ici<br>ou double-cliquez sur une carte</p>`;
    }
}

// 10. Rendu du Deck
function renderDeck() {
    const container = document.getElementById('deckList');
    if (!container) return;

    if (deck.cards.length === 0) {
        container.innerHTML = '<p style="color:#888; padding:20px;">Votre deck est vide</p>';
        return;
    }

    container.innerHTML = deck.cards.map((card, index) => `
        <div class="card-in-deck">
            <img src="${card.image}" alt="${card.name}">
            <button class="btn-remove" onclick="removeFromDeck(${index})">×</button>
        </div>
    `).join('');
}

// 11. Stats et Validation
function updateStats() {
    const el = document.getElementById('deckStats');
    if(el) el.innerHTML = `Cartes: ${deck.cards.length}/40 | Leader: ${deck.leader ? 'OK' : 'NON'}`;
}

function checkDeckValidity() {
    const el = document.getElementById('validationResult');
    if(!el) return;
    
    let msg = [];
    if(!deck.leader) msg.push("❌ Pas de leader");
    if(deck.cards.length < 40) msg.push(`⚠️ ${40 - deck.cards.length} cartes manquantes`);
    if(deck.cards.length === 40 && deck.leader) msg.push("✅ Deck Valide !");

    el.innerHTML = msg.join('<br>');
    el.className = (deck.cards.length === 40 && deck.leader) ? 'valid' : 'invalid';
}

// Démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadCards();
    initLeaderZone(); // Active la zone de drop
    
    // Filtres
    const search = document.getElementById('searchInput');
    if(search) search.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        filteredCards = allCards.filter(c => c.name.toLowerCase().includes(term));
        renderCardList();
    });
});