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
        
        // Activer le drag & drop après le chargement
        setupDragAndDrop();
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

    // On ajoute l'attribut draggable et les data-id directement ici
    container.innerHTML = filteredCards.map((card) => `
        <div class="card-item" 
             draggable="true" 
             data-card-id="${card.id}"
             ondblclick="handleLeaderClick('${card.id}')">
            <img src="${card.image}" alt="${card.name}" class="card-thumbnail" 
                 onerror="this.src='https://via.placeholder.com/150x200?text=Erreur'">
            <div class="card-info">
                <h4>${card.name}</h4>
                <span class="card-rarity">${card.type}</span>
            </div>
            <button class="btn-add" onclick="addToDeckById('${card.id}')">+</button>
        </div>
    `).join('');

    // Réactiver les écouteurs d'événements drag sur les nouveaux éléments
    setupCardDragEvents();
}

// Initialiser le Drag & Drop global
function setupDragAndDrop() {
    const leaderZone = document.getElementById('leaderSlot'); // Assure-toi que l'ID correspond à ton HTML
    
    if (!leaderZone) {
        console.warn("⚠️ Zone leader introuvable (ID: leaderSlot). Vérifie ton HTML.");
        return;
    }

    // Autoriser le drop
    leaderZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        leaderZone.style.borderColor = '#ffd700';
        leaderZone.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
        leaderZone.style.transform = 'scale(1.05)';
    });

    leaderZone.addEventListener('dragleave', () => {
        leaderZone.style.borderColor = '#ccc';
        leaderZone.style.backgroundColor = 'transparent';
        leaderZone.style.transform = 'scale(1)';
    });

    // Gérer le dépôt
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
            }
        }
    });
}

// Attacher les événements drag aux cartes individuelles
function setupCardDragEvents() {
    const cards = document.querySelectorAll('.card-item');
    cards.forEach(cardEl => {
        cardEl.addEventListener('dragstart', (e) => {
            const id = cardEl.getAttribute('data-card-id');
            e.dataTransfer.setData('text/plain', id);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => cardEl.style.opacity = '0.5', 0);
        });

        cardEl.addEventListener('dragend', () => {
            cardEl.style.opacity = '1';
        });
    });
}

// Gestion du double-clic pour le leader
function handleLeaderClick(cardId) {
    const card = allCards.find(c => c.id === cardId);
    if (card) {
        setAsLeader(card);
    }
}

// Fonction logique pour définir le leader
function setAsLeader(card) {
    if (!card) return;

    // Si c'est déjà le leader, on le retire (optionnel)
    if (deck.leader && deck.leader.id === card.id) {
        deck.leader = null;
        // Optionnel : remettre dans le deck si besoin
    } else {
        // Si un leader existe, on le remet dans le deck
        if (deck.leader) {
            deck.cards.push(deck.leader);
        }
        // Nouveau leader
        deck.leader = card;
        
        // Retirer du deck s'il y était
        const index = deck.cards.findIndex(c => c.id === card.id);
        if (index > -1) {
            deck.cards.splice(index, 1);
        }
    }

    renderLeader();
    renderDeck();
    updateStats();
    validateDeck();
    saveDeck();
}

// Ajouter une carte au deck (par ID)
function addToDeckById(cardId) {
    const card = allCards.find(c => c.id === cardId);
    if (!card) return;
    
    // Si c'est un leader (type spécial), on le met en leader
    if (card.type === 'Leader' || card.type === 'leader') {
        setAsLeader(card);
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
    saveDeck();
}

// Ancienne fonction gardée pour compatibilité si appelée ailleurs
function addToDeck(index) {
    addToDeckById(filteredCards[index].id);
}

// Retirer une carte du deck
function removeFromDeck(index) {
    deck.cards.splice(index, 1);
    renderDeck();
    updateStats();
    validateDeck();
    saveDeck();
}

// Retirer le leader
function removeLeader() {
    if (deck.leader) {
        // Optionnel : remettre dans le deck
        // deck.cards.push(deck.leader); 
        deck.leader = null;
        renderLeader();
        updateStats();
        validateDeck();
        saveDeck();
    }
}

// Afficher le leader
function renderLeader() {
    const container = document.getElementById('leaderSlot');
    if (!container) return;

    if (deck.leader) {
        container.innerHTML = `
            <div class="card-in-deck" style="border: 2px solid #ffd700;">
                <img src="${deck.leader.image}" alt="${deck.leader.name}">
                <div class="card-name-overlay">${deck.leader.name}</div>
                <button class="btn-remove" onclick="removeLeader()">×</button>
            </div>
        `;
    } else {
        container.innerHTML = '<div class="empty-slot" style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">Glissez ou Double-cliquez ici</div>';
    }
}

// Afficher le deck
function renderDeck() {
    const container = document.getElementById('deckList');
    if (!container) return;

    if (deck.cards.length === 0) {
        container.innerHTML = '<div class="empty-slot">Deck vide</div>';
        return;
    }

    container.innerHTML = deck.cards.map((card, index) => `
        <div class="card-in-deck">
            <img src="${card.image}" alt="${card.name}">
            <div class="card-count">${deck.cards.filter(c => c.id === card.id).length}</div>
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
            <span class="stat-value" style="color: ${deck.leader ? '#4caf50' : '#f44336'}">
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
        container.style.color = '#4caf50';
    } else {
        container.className = 'validation invalid';
        container.innerHTML = errors.join('<br>');
        container.style.color = '#f44336';
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
    // Réactiver drag&drop sur les nouvelles cartes filtrées
    setupCardDragEvents();
}

// Filtrer par type
function filterByType(type) {
    if (type === 'all') {
        filteredCards = [...allCards];
    } else {
        filteredCards = allCards.filter(card => card.type === type);
    }
    renderCardList();
    setupCardDragEvents();
}

// Sauvegarder le deck (Local Storage)
function saveDeck() {
    localStorage.setItem('nikkeDeck', JSON.stringify(deck));
}

// Charger le deck sauvegardé
function loadSavedDeck() {
    const saved = localStorage.getItem('nikkeDeck');
    if (saved) {
        try {
            deck = JSON.parse(saved);
            renderLeader();
            renderDeck();
            updateStats();
            validateDeck();
        } catch (e) {
            console.error("Erreur chargement sauvegarde", e);
        }
    }
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
            saveDeck();
            alert("Deck importé avec succès !");
        } catch (error) {
            alert('Erreur lors de l\'import: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Application démarrée");
    
    // Charger le deck sauvegardé s'il existe
    loadSavedDeck();
    
    // Charger les cartes
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