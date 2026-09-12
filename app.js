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
        updateStats();
        // Initialiser les événements après chargement
        initLeaderZone();
    } catch (error) {
        console.error("❌ Erreur de chargement:", error);
        document.getElementById('cardList').innerHTML = 
            `<div style="color: red; padding: 20px;">
                Erreur: ${error.message}<br>
                Vérifie que cards.json est dans le même dossier que index.html
            </div>`;
    }
}

// Afficher la liste des cartes (Avec support Drag & Drop natif)
function renderCardList() {
    const container = document.getElementById('cardList');
    if (!container) return;

    if (filteredCards.length === 0) {
        container.innerHTML = '<p>Aucune carte trouvée</p>';
        return;
    }

    // On génère le HTML en ajoutant draggable="true" et des data-attributes
    container.innerHTML = filteredCards.map((card) => `
        <div class="card-item" 
             draggable="true" 
             data-card-id="${card.id}"
             onclick="handleCardClick('${card.id}')"
             ondblclick="handleLeaderDoubleClick('${card.id}')">
            <img src="${card.image}" alt="${card.name}" class="card-thumbnail" 
                 onerror="this.src='https://via.placeholder.com/150x200?text=Erreur'">
            <div class="card-info">
                <h4>${card.name}</h4>
                <span class="card-rarity">${card.type}</span>
            </div>
            <button class="btn-add">+</button>
        </div>
    `).join('');

    // Attacher les événements dragstart maintenant que les éléments existent
    attachDragEvents();
}

// Attacher les événements de drag aux éléments créés
function attachDragEvents() {
    const cards = document.querySelectorAll('.card-item');
    cards.forEach(cardEl => {
        cardEl.addEventListener('dragstart', (e) => {
            const cardId = cardEl.getAttribute('data-card-id');
            e.dataTransfer.setData('text/plain', cardId);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => cardEl.style.opacity = '0.5', 0);
        });

        cardEl.addEventListener('dragend', () => {
            cardEl.style.opacity = '1';
        });
    });
}

// Gestion du clic simple (Ajout au deck ou Leader si type spécial)
function handleCardClick(cardId) {
    const card = allCards.find(c => c.id === cardId);
    if (!card) return;

    // Si c'est un Leader par type, on le met en leader directement
    if (card.type && card.type.toLowerCase() === 'leader') {
        setAsLeader(card);
        return;
    }

    // Sinon ajout normal au deck
    addToDeck(card);
}

// Gestion du double-clic (Forcer mise en leader)
function handleLeaderDoubleClick(cardId) {
    const card = allCards.find(c => c.id === cardId);
    if (card) {
        setAsLeader(card);
    }
}

// Ajouter une carte au deck (logique normale)
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

// Définir une carte comme Leader (Logique centrale)
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
    renderDeck(); // Mettre à jour au cas où une carte a bougé
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
    if (deck.leader) {
        // Optionnel : remettre le leader dans le deck ou juste le supprimer
        // Ici on le remet dans le deck s'il n'y est pas déjà
        if (!deck.cards.some(c => c.id === deck.leader.id)) {
             deck.cards.push(deck.leader);
        }
        deck.leader = null;
    }
    renderLeader();
    updateStats();
    validateDeck();
}

// Afficher le leader
function renderLeader() {
    const container = document.getElementById('leaderSlot'); // Ou 'leader-zone' selon ton HTML
    if (!container) return;

    if (deck.leader) {
        container.innerHTML = `
            <div class="card-in-deck" style="border: 2px solid gold;">
                <img src="${deck.leader.image}" alt="${deck.leader.name}">
                <div class="card-name-overlay">${deck.leader.name}</div>
                <button class="btn-remove" onclick="removeLeader()">×</button>
            </div>
        `;
    } else {
        container.innerHTML = '<div class="empty-slot">Glissez ou Double-cliquez ici</div>';
    }
}

// Afficher le deck
function renderDeck() {
    const container = document.getElementById('deckList');
    if (!container) return;

    if (deck.cards.length === 0) {
        container.innerHTML = '<p class="empty-slot">Votre deck est vide</p>';
        return;
    }

    container.innerHTML = deck.cards.map((card, index) => `
        <div class="card-in-deck">
            <img src="${card.image}" alt="${card.name}">
            <div class="card-count">${index + 1}</div>
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

// Initialisation de la zone de Drop (Leader)
function initLeaderZone() {
    // On cherche à la fois 'leaderSlot' (pour l'affichage) et 'leader-zone' (si tu as une zone dédiée au drop)
    const leaderZone = document.getElementById('leader-zone') || document.getElementById('leaderSlot');
    
    if (!leaderZone) {
        console.warn("Zone leader introuvable dans le HTML");
        return;
    }

    leaderZone.addEventListener('dragover', (e) => {
        e.preventDefault(); // Obligatoire pour autoriser le drop
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
            if (card) {
                setAsLeader(card);
            } else {
                console.error("Carte non trouvée:", cardId);
            }
        }
    });
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
    a.download = `deck-nikke-${Date.now()}.json`;
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
                leader: deckData.leader || null,
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

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Application NIKKE Deck Builder démarrée");
    loadCards();

    // Event listeners pour les filtres
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