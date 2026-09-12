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

    /* =======================================================
   AJOUT FONCTIONNALITÉ LEADER (Drag & Drop + Double Clic)
   Copie ce bloc à la fin de ton fichier app.js
   ======================================================= */

// 1. Fonction logique pour définir le leader
function setAsLeader(card) {
    if (!card) return;

    // Si on clique sur le leader actuel, on le retire (optionnel)
    if (currentDeck.leader && currentDeck.leader.id === card.id) {
        currentDeck.leader = null;
        // On remet la carte dans le deck si elle n'y est pas déjà
        if (!currentDeck.cards.some(c => c.id === card.id)) {
            currentDeck.cards.push(card);
        }
    } else {
        // Si un leader existe déjà, on le remet dans le deck
        if (currentDeck.leader) {
            currentDeck.cards.push(currentDeck.leader);
        }
        // On définit le nouveau leader
        currentDeck.leader = card;
        
        // On retire la carte du deck normal si elle y était
        const index = currentDeck.cards.findIndex(c => c.id === card.id);
        if (index > -1) {
            currentDeck.cards.splice(index, 1);
        }
    }

    updateDeckDisplay(); // Met à jour l'affichage du deck
    saveDeck();          // Sauvegarde automatique
}

// 2. Initialisation du Drag & Drop sur la zone Leader
function initLeaderZone() {
    const leaderZone = document.getElementById('leader-zone');
    if (!leaderZone) {
        console.warn("Zone leader non trouvée, vérifie l'ID dans ton HTML.");
        return;
    }

    // Effet visuel au survol
    leaderZone.addEventListener('dragover', (e) => {
        e.preventDefault(); // Nécessaire pour autoriser le drop
        leaderZone.style.borderColor = '#ffd700'; // Doré
        leaderZone.style.backgroundColor = 'rgba(255, 215, 0, 0.15)';
        leaderZone.style.transform = 'scale(1.02)';
        leaderZone.style.cursor = 'copy';
    });

    // Reset visuel quand on sort
    leaderZone.addEventListener('dragleave', () => {
        leaderZone.style.borderColor = '#ccc';
        leaderZone.style.backgroundColor = 'transparent';
        leaderZone.style.transform = 'scale(1)';
        leaderZone.style.cursor = 'default';
    });

    // Action quand on lâche la carte
    leaderZone.addEventListener('drop', (e) => {
        e.preventDefault();
        leaderZone.style.borderColor = '#ccc';
        leaderZone.style.backgroundColor = 'transparent';
        leaderZone.style.transform = 'scale(1)';
        leaderZone.style.cursor = 'default';

        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId) {
            const card = allCards.find(c => c.id === cardId);
            if (card) {
                setAsLeader(card);
            } else {
                console.error("Carte non trouvée pour l'ID:", cardId);
            }
        }
    });
}

// 3. Rendre les cartes interactives (à exécuter après l'affichage des cartes)
// On surcharge la fonction d'affichage existante ou on ajoute un listener global
function enableCardInteractivity() {
    // On cible toutes les cartes affichées (ajuste le sélecteur si nécessaire)
    // Cherche les classes utilisées dans ton HTML pour les cartes (ex: .card, .card-item, etc.)
    const cardElements = document.querySelectorAll('.card, .card-item, [data-card-id]');

    cardElements.forEach(el => {
        // Évite de dupliquer les listeners si la fonction est appelée plusieurs fois
        if (el.dataset.leaderEnabled === "true") return;
        
        el.dataset.leaderEnabled = "true";
        el.setAttribute('draggable', 'true');
        el.style.cursor = 'grab';

        // Début du glisser
        el.addEventListener('dragstart', (e) => {
            // Récupère l'ID de la carte (ajuste selon comment tu stockes l'ID dans ton HTML)
            const id = el.getAttribute('data-card-id') || el.querySelector('[data-card-id]')?.getAttribute('data-card-id');
            if (id) {
                e.dataTransfer.setData('text/plain', id);
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => el.style.opacity = '0.5', 0);
            }
        });

        // Fin du glisser
        el.addEventListener('dragend', () => {
            el.style.opacity = '1';
        });

        // Double-clic pour définir le leader directement
        el.addEventListener('dblclick', () => {
            const id = el.getAttribute('data-card-id') || el.querySelector('[data-card-id]')?.getAttribute('data-card-id');
            if (id) {
                const card = allCards.find(c => c.id === id);
                if (card) setAsLeader(card);
            }
        });
    });
}

// 4. Hook pour lancer l'interactivité après chaque mise à jour de l'affichage
// On cherche ta fonction updateDisplay ou renderCards et on l'enveloppe
// Si tu ne trouves pas le nom exact, on utilise un MutationObserver pour détecter les nouvelles cartes automatiquement

const observer = new MutationObserver((mutations) => {
    let cardsAdded = false;
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && (node.classList?.contains('card') || node.classList?.contains('card-item') || node.querySelector('.card'))) {
                    cardsAdded = true;
                }
            });
        }
    });
    if (cardsAdded) {
        enableCardInteractivity();
    }
});

// Démarrer l'observateur sur le conteneur principal des cartes (ajuste l'ID si besoin)
// Cherche l'ID de ton conteneur de cartes dans index.html (souvent 'card-list', 'results', 'gallery'...)
const mainContainer = document.getElementById('card-list') || document.getElementById('results') || document.body;
observer.observe(mainContainer, { childList: true, subtree: true });

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initLeaderZone();
    // Petit délai pour s'assurer que les premières cartes sont chargées
    setTimeout(enableCardInteractivity, 1000);
});

console.log("✅ Système Leader activé : Glisser-déposer et Double-clic prêts !");
});