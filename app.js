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
        filteredCards = [...allCards];
        renderCardList();
        // Initialiser les interactions après chargement
        setTimeout(initLeaderSystem, 100); 
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
    if (!container) return;

    if (filteredCards.length === 0) {
        container.innerHTML = '<p>Aucune carte trouvée</p>';
        return;
    }

    container.innerHTML = filteredCards.map((card) => `
        <div class="card-item" data-id="${card.id}" onclick="handleCardClick('${card.id}')">
            <img src="${card.image}" alt="${card.name}" class="card-thumbnail" 
                 onerror="this.src='https://via.placeholder.com/150x200?text=Erreur'">
            <div class="card-info">
                <h4>${card.name}</h4>
                <span class="card-rarity">${card.type}</span>
            </div>
            <button class="btn-add">+</button>
        </div>
    `).join('');
    
    // Réactiver les listeners drag&drop après réaffichage
    initLeaderSystem();
}

// Gestionnaire de clic unique (remplace l'ancien addToDeck direct)
function handleCardClick(cardId) {
    const card = allCards.find(c => c.id === cardId);
    if (!card) return;

    // Si c'est un Leader, on le définit comme tel directement
    if (card.type === 'Leader' || card.type === 'leader') {
        setAsLeader(card);
    } else {
        addToDeck(card);
    }
}

// Ajouter une carte au deck (logique existante adaptée)
function addToDeck(card) {
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

// --- NOUVEAU SYSTÈME LEADER UNIFIÉ ---

// Fonction centrale pour définir le leader
function setAsLeader(card) {
    if (!card) return;

    // Si on clique sur le leader actuel, on le retire (optionnel)
    if (deck.leader && deck.leader.id === card.id) {
        deck.leader = null;
        // On remet la carte dans le deck si elle n'y est pas déjà
        if (!deck.cards.some(c => c.id === card.id)) {
            deck.cards.push(card);
        }
    } else {
        // Si un leader existe déjà, on le remet dans le deck
        if (deck.leader) {
            deck.cards.push(deck.leader);
        }
        // On définit le nouveau leader
        deck.leader = card;
        
        // On retire la carte du deck normal si elle y était
        const index = deck.cards.findIndex(c => c.id === card.id);
        if (index > -1) {
            deck.cards.splice(index, 1);
        }
    }

    renderLeader();
    renderDeck(); // Mettre à jour le deck au cas où une carte a bougé
    updateStats();
    validateDeck();
}

// Initialisation du Drag & Drop et Double Clic
function initLeaderSystem() {
    // 1. Configurer la zone de drop (Leader Slot)
    const leaderZone = document.getElementById('leaderSlot'); // Utilise l'ID de ton HTML
    if (leaderZone) {
        leaderZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            leaderZone.style.borderColor = '#ffd700';
            leaderZone.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
            leaderZone.style.transform = 'scale(1.02)';
        });

        leaderZone.addEventListener('dragleave', () => {
            leaderZone.style.borderColor = '#ccc';
            leaderZone.style.backgroundColor = 'transparent';
            leaderZone.style.transform = 'scale(1)';
        });

        leaderZone.addEventListener('drop', (e) => {
            e.preventDefault();
            leaderZone.style.borderColor = '#ccc';
            leaderZone.style.backgroundColor = 'transparent';
            leaderZone.style.transform = 'scale(1)';

            const cardId = e.dataTransfer.getData('text/plain');
            if (cardId) {
                const card = allCards.find(c => c.id === cardId);
                if (card) setAsLeader(card);
            }
        });
    }

    // 2. Rendre les cartes "dragables" et ajouter le double-clic
    const cardElements = document.querySelectorAll('.card-item');
    cardElements.forEach(el => {
        // Éviter les doublons de listeners
        if (el.dataset.leaderInit === "true") return;
        el.dataset.leaderInit = "true";

        el.setAttribute('draggable', 'true');
        el.style.cursor = 'grab';

        el.addEventListener('dragstart', (e) => {
            const id = el.getAttribute('data-id');
            if (id) {
                e.dataTransfer.setData('text/plain', id);
                e.dataTransfer.effectAllowed = 'move';
                el.style.opacity = '0.5';
            }
        });

        el.addEventListener('dragend', () => {
            el.style.opacity = '1';
        });

        el.addEventListener('dblclick', () => {
            const id = el.getAttribute('data-id');
            if (id) {
                const card = allCards.find(c => c.id === id);
                if (card) setAsLeader(card);
            }
        });
    });
}

// Afficher le leader
function renderLeader() {
    const container = document.getElementById('leaderSlot');
    if (!container) return;

    if (deck.leader) {
        container.innerHTML = `
            <div class="card-in-deck" style="border: 2px solid #ffd700;">
                <img src="${deck.leader.image}" alt="${deck.leader.name}">
                <div style="position:absolute; top:2px; right:2px; background:red; color:white; border-radius:50%; width:20px; height:20px; text-align:center; line-height:20px; cursor:pointer;" onclick="setAsLeader(deck.leader)">×</button>
            </div>
            <div style="text-align:center; font-size:0.8em; margin-top:5px; color:#ffd700;">LEADER</div>
        `;
    } else {
        container.innerHTML = '<div class="empty-slot" style="display:flex; align-items:center; justify-content:center; height:100%;">Glisser ou Double-cliquer<br>pour mettre un Leader</div>';
    }
}

// Afficher le deck
function renderDeck() {
    const container = document.getElementById('deckList');
    if (!container) return;

    if (deck.cards.length === 0) {
        container.innerHTML = '<div class="empty-slot">Votre deck est vide</div>';
        return;
    }

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
            <span class="stat-value" style="color: ${deck.leader ? 'gold' : 'red'}">
                ${deck.leader ? '✓' : '✗'}
            </span>
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