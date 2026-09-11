import { CONFIG } from './config.js';
import DeckValidator from './deck-validator.js';

class DeckBuilderApp {
    constructor() {
        this.validator = new DeckValidator();
        this.deck = {
            leader: null,
            cards: []
        };
        this.allCards = [];
        this.filteredCards = [];
        
        this.init();
    }

    init() {
        this.loadCards();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadCards() {
        // Charger les cartes depuis le fichier JSON ou API
        try {
            const response = await fetch('cards.json');
            this.allCards = await response.json();
            this.filteredCards = [...this.allCards];
        } catch (error) {
            console.error('Erreur de chargement des cartes:', error);
            this.allCards = [];
        }
    }

    setupEventListeners() {
        // Recherche
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.filterCards(e.target.value);
        });

        // Filtre IP
        document.getElementById('ipFilter')?.addEventListener('change', (e) => {
            this.filterByIP(e.target.value);
        });

        // Validation
        document.getElementById('validateBtn')?.addEventListener('click', () => {
            this.validateDeck();
        });

        // Export
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportDeck();
        });

        // Import
        document.getElementById('importBtn')?.addEventListener('change', (e) => {
            this.importDeck(e.target.files[0]);
        });
    }

    filterCards(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredCards = this.allCards.filter(card => 
            card.name?.fr?.toLowerCase().includes(term) ||
            card.name?.en?.toLowerCase().includes(term) ||
            card.id?.toLowerCase().includes(term)
        );
        this.renderCardList();
    }

    filterByIP(ip) {
        if (ip === 'all') {
            this.filteredCards = [...this.allCards];
        } else {
            this.filteredCards = this.allCards.filter(card => card.ip === ip);
        }
        this.renderCardList();
    }

    addCardToDeck(card) {
        const result = this.validator.canAddCard(this.deck, card);
        
        if (result.canAdd) {
            if (card.type === 'leader') {
                this.deck.leader = card;
                // Filtrer automatiquement par IP
                this.filterByIP(card.ip);
            } else {
                this.deck.cards.push(card);
            }
            this.updateUI();
            this.validateDeck();
        } else {
            this.showError(result.reason);
        }
    }

    removeCardFromDeck(cardIndex) {
        this.deck.cards.splice(cardIndex, 1);
        this.updateUI();
        this.validateDeck();
    }

    updateUI() {
        this.renderDeckList();
        this.renderCardList();
        this.updateStats();
    }

    renderCardList() {
        const container = document.getElementById('cardList');
        if (!container) return;

        container.innerHTML = this.filteredCards.map(card => `
            <div class="card-item" data-card-id="${card.id}">
                <img src="${card.image_url}" alt="${card.name?.fr}" class="card-thumbnail">
                <div class="card-info">
                    <h4>${card.name?.fr || card.name?.en}</h4>
                    <span class="card-rarity ${card.rarity?.toLowerCase()}">${card.rarity}</span>
                    <span class="card-ip">${card.ip}</span>
                </div>
                <button onclick="app.addCardToDeck(${JSON.stringify(card).replace(/"/g, '&quot;')})" 
                        class="btn-add">
                    +
                </button>
            </div>
        `).join('');
    }

    renderDeckList() {
        // Leader
        const leaderContainer = document.getElementById('leaderSlot');
        if (leaderContainer) {
            if (this.deck.leader) {
                leaderContainer.innerHTML = `
                    <div class="card-in-deck">
                        <img src="${this.deck.leader.image_url}" alt="${this.deck.leader.name?.fr}">
                        <button onclick="app.removeLeader()" class="btn-remove">×</button>
                    </div>
                `;
            } else {
                leaderContainer.innerHTML = '<div class="empty-slot">Leader</div>';
            }
        }

        // Cartes
        const deckContainer = document.getElementById('deckList');
        if (deckContainer) {
            deckContainer.innerHTML = this.deck.cards.map((card, index) => `
                <div class="card-in-deck">
                    <img src="${card.image_url}" alt="${card.name?.fr}">
                    <button onclick="app.removeCardFromDeck(${index})" class="btn-remove">×</button>
                </div>
            `).join('');
        }
    }

    updateStats() {
        const stats = this.validator.getDeckStats(this.deck);
        
        const statsContainer = document.getElementById('deckStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat">
                    <span class="stat-label">Cartes:</span>
                    <span class="stat-value ${stats.totalCards < 40 ? 'warning' : ''}">
                        ${stats.totalCards}/40
                    </span>
                </div>
                <div class="stat">
                    <span class="stat-label">Triggers:</span>
                    <span class="stat-value ${stats.triggerCount > 8 ? 'error' : ''}">
                        ${stats.triggerCount}/8
                    </span>
                </div>
            `;
        }
    }

    validateDeck() {
        const result = this.validator.validateDeck(this.deck);
        const validationContainer = document.getElementById('validationResult');
        
        if (!validationContainer) return;

        if (result.valid) {
            validationContainer.className = 'validation valid';
            validationContainer.innerHTML = '<span class="checkmark">✓</span> Deck valide!';
        } else {
            validationContainer.className = 'validation invalid';
            validationContainer.innerHTML = result.errors.map(err => 
                `<div class="error">✗ ${err.message}</div>`
            ).join('');
        }
    }

    exportDeck() {
        const deckData = {
            leader: this.deck.leader,
            cards: this.deck.cards,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(deckData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deck-${this.deck.leader?.name?.fr || 'sans-nom'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importDeck(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const deckData = JSON.parse(e.target.result);
                this.deck = {
                    leader: deckData.leader,
                    cards: deckData.cards || []
                };
                this.updateUI();
                this.validateDeck();
            } catch (error) {
                alert('Erreur lors de l\'import du deck');
            }
        };
        reader.readAsText(file);
    }

    removeLeader() {
        this.deck.leader = null;
        this.updateUI();
    }

    showError(reason) {
        const messages = {
            'wrong_ip': 'Cette carte n\'est pas compatible avec votre leader',
            'too_many_copies': 'Maximum 3 exemplaires autorisés',
            'trigger_limit': 'Limite de 8 cartes Trigger atteinte'
        };
        
        alert(messages[reason] || 'Erreur');
    }
}

// Initialiser l'application
const app = new DeckBuilderApp();
export default app;