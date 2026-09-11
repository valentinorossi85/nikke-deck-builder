// Configuration simple
const CONFIG = {
    MAX_CARDS: 40,
    MAX_COPIES: 3,
    MAX_TRIGGER: 8
};

// État de l'application
let allCards = [];
let filteredCards = [];
let deck = {
    leader: null,
    cards: []
};

// Charger les cartes au démarrage
async function loadCards() {
    console.log("🔄 Chargement des cartes...");
    try {
        const response = await fetch('./cards.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        allCards = await response.json();
        console.log(`✅ ${allCards.length} cartes chargées`);
        console.log("Première carte:", allCards[0]);
        filteredCards = [...allCards];
        renderCardList();
        updateStats();
    } catch (error) {
        console.error("❌ Erreur de chargement:", error);
        document.getElementById('cardList').innerHTML = 
            `<div style="color: red; padding: 20px;">
                Erreur: ${error.message}<br>
                Vérifie que cards.json est dans le même dossier que index.html
            </div>`;
    }
}

// Afficher la liste des cartes
function renderCardList() {
    const container = document.getElementById('cardList');
    if (!container) {
        console.error("Container cardList introuvable !");
        return;
    }

    if (filteredCards.length === 0) {
        container.innerHTML = '<p>Aucune carte trouvée</p>';
        return;
    }

    container.innerHTML = filteredCards.map((card, index) => `
        <div class="card-item" onclick="addToDeck(${index})">
            <img src="${card.image}" alt="${card.name}" class="card-thumbnail" 
                 onerror="this.src='https://via.placeholder.com/150x200?text=Erreur'">
            <div class="card-info">
                <h4>${card.name}</h4>
                <span class="card-rarity">${card.type}</span>
            </div>
            <button class="btn-add">+</button>
        </div>
    `).join('');
}

// Ajouter une carte au deck
function addToDeck(index) {
    const card = filteredCards[index];
    
    // Vérifier si c'est un leader
    if (card.type === 'Leader' || card.type === 'leader') {
        deck.leader = card;
        renderLeader();
        updateStats();
        validateDeck();
        return;
    }

    // Vérifier le nombre de copies
    const copies = deck.cards.filter(c => c.id === card.id).length;
    if (copies >= CONFIG.MAX_COPIES) {
        alert(`Maximum ${CONFIG.MAX_COPIES} exemplaires de "${card.name}"`);
        return;
    }

    // Vérifier la taille du deck
    if (deck.cards.length >= CONFIG.MAX_CARDS) {
        alert(`Deck complet (${CONFIG.MAX_CARDS} cartes)`);
        return;
    }

    deck.cards.push(card);
    renderDeck();
    updateStats();
    validateDeck();
}

// Retirer une carte du deck
function removeFromDeck(index) {
    deck.cards.splice(index, 1);
    renderDeck();
    updateStats();
    validateDeck();
}

// Retirer le leader
function removeLeader() {
    deck.leader = null;
    renderLeader();
    updateStats();
    validateDeck();
}

// Afficher le leader
function renderLeader() {
    const container = document.getElementById('leaderSlot');
    if (!container) return;

    if (deck.leader) {
        container.innerHTML = `
            <div class="card-in-deck">
                <img src="${deck.leader.image}" alt="${deck.leader.name}">
                <button class="btn-remove" onclick="removeLeader()">×</button>
            </div>
        `;
    } else {
        container.innerHTML = '<div class="empty-slot">Cliquez sur une carte Leader</div>';
    }
}

// Afficher le deck
function renderDeck() {
    const container = document.getElementById('deckList');
    if (!container) return;

    container.innerHTML = deck.cards.map((card, index) => `
        <div class="card-in-deck">
            <img src="${card.image}" alt="${card.name}">
            <button class="btn-remove" onclick="removeFromDeck(${index})">×</button>
        </div>
    `).join('');
}

// Mettre à jour les stats
function updateStats() {
    const statsContainer = document.getElementById('deckStats');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
        <div class="stat">
            <span class="stat-label">Cartes:</span>
            <span class="stat-value ${deck.cards.length < 40 ? 'warning' : ''}">
                ${deck.cards.length}/40
            </span>
        </div>
        <div class="stat">
            <span class="stat-label">Leader:</span>
            <span class="stat-value">${deck.leader ? '✓' : '✗'}</span>
        </div>
    `;
}

// Valider le deck
function validateDeck() {
    const container = document.getElementById('validationResult');
    if (!container) return;

    const errors = [];
    
    if (!deck.leader) errors.push("❌ Aucun leader sélectionné");
    if (deck.cards.length < 40) errors.push(`❌ Pas assez de cartes (${deck.cards.length}/40)`);
    if (deck.cards.length > 40) errors.push(`❌ Trop de cartes (${deck.cards.length}/40)`);

    if (errors.length === 0) {
        container.className = 'validation valid';
        container.innerHTML = '<span class="checkmark">✓</span> Deck valide !';
    } else {
        container.className = 'validation invalid';
        container.innerHTML = errors.join('<br>');
    }
}

// Filtrer par recherche
function filterCards(searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredCards = allCards.filter(card => 
        card.name.toLowerCase().includes(term) ||
        card.id.toLowerCase().includes(term)
    );
    renderCardList();
}

// Filtrer par type
function filterByType(type) {
    if (type === 'all') {
        filteredCards = [...allCards];
    } else {
        filteredCards = allCards.filter(card => card.type === type);
    }
    renderCardList();
}

// Exporter le deck
function exportDeck() {
    const deckData = {
        leader: deck.leader,
        cards: deck.cards,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(deckData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deck-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Importer un deck
function importDeck(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const deckData = JSON.parse(e.target.result);
            deck = {
                leader: deckData.leader,
                cards: deckData.cards || []
            };
            renderLeader();
            renderDeck();
            updateStats();
            validateDeck();
        } catch (error) {
            alert('Erreur lors de l\'import: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Application démarrée");
    loadCards();

    // Event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterCards(e.target.value));
    }

    const typeFilter = document.getElementById('ipFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => filterByType(e.target.value));
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDeck);
    }

    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('change', (e) => importDeck(e.target.files[0]));
    }
});