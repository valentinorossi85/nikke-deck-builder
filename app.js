// Configuration
const CONFIG = {
    MAX_CARDS: 40,
    MAX_COPIES: 3
};

// Couleurs des attributs
const ATTRIBUTE_COLORS = {
    'Flame': '#e74c3c',
    'Earth': '#27ae60',
    'Storm': '#3498db',
    'Wave': '#9b59b6',
    '': '#95a5a6'
};

// État
let allCards = [];
let filteredCards = [];
let isLeaderFilterActive = false;
let deck = {
    leader: null,
    cards: []
};

// --- FONCTION UTILITAIRE : Nettoyer une chaîne ---
function cleanStr(val) {
    if (typeof val !== 'string') return val;
    return val.trim();
}

// --- FONCTION UTILITAIRE : Accéder à une propriété avec ou sans espace ---
function getProp(card, key) {
    // Essaie la clé exacte, puis avec espace, puis trimée
    if (card[key] !== undefined) return card[key];
    if (card[key + ' '] !== undefined) return card[key + ' '];
    // Cherche une clé qui trimée correspond
    for (const k in card) {
        if (k.trim() === key) return card[k];
    }
    return undefined;
}

// --- CHARGEMENT ---
async function loadCards() {
    try {
        const response = await fetch('./cards.json');
        if (!response.ok) throw new Error("Impossible de charger cards.json");
        const rawCards = await response.json();
        
        // ✅ NETTOYAGE ROBUSTE : crée un objet propre pour chaque carte
        allCards = rawCards.map(card => {
            const clean = {};
            for (const rawKey in card) {
                const key = rawKey.trim();
                let val = card[rawKey];
                if (typeof val === 'string') val = val.trim();
                clean[key] = val;
            }
            return clean;
        });
        
        console.log(`${allCards.length} cartes chargées.`);
        console.log('Exemple:', allCards[0]);
        console.log('Attributs uniques:', [...new Set(allCards.map(c => c.attribute).filter(Boolean))]);
        
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
    
    // Récupérer l'attribut du leader actuel
    const leaderAttribute = deck.leader && deck.leader.attribute 
        ? deck.leader.attribute.toLowerCase() 
        : null;
    
    filteredCards = allCards.filter(card => {
        // Filtre texte
        const matchText = card.name.toLowerCase().includes(searchTerm) || 
                          card.id.toLowerCase().includes(searchTerm);
        
        // Filtre type
        let matchType = true;
        if (typeFilter !== 'all') {
            matchType = card.type && card.type.toLowerCase() === typeFilter.toLowerCase();
        }
        
        // Filtre leader
        let matchLeader = true;
        if (isLeaderFilterActive) {
            matchLeader = card.type && card.type.toLowerCase().includes('leader');
        }
        
        // ✅ FILTRE PAR ATTRIBUT (couleur)
        let matchAttribute = true;
        if (leaderAttribute) {
            const cardAttribute = (card.attribute || '').toLowerCase();
            // Autoriser si la carte n'a pas d'attribut (neutre) OU si elle a le même attribut
            matchAttribute = !cardAttribute || cardAttribute === leaderAttribute;
        }
        
        return matchText && matchType && matchLeader && matchAttribute;
    });
    
    renderCardList();
}

// Listeners
document.getElementById('searchInput')?.addEventListener('input', applyFilters);
document.getElementById('ipFilter')?.addEventListener('change', applyFilters);

// --- AFFICHAGE CARTES ---
function getAttributeColor(attribute) {
    return ATTRIBUTE_COLORS[attribute] || '#95a5a6';
}

function getAttributeName(attribute) {
    const names = {
        'Flame': '🔥 Flame',
        'Earth': '🌍 Earth',
        'Storm': ' Storm',
        'Wave': ' Wave',
        '': '⚪ Neutral'
    };
    return names[attribute] || attribute || '⚪ Neutral';
}

function renderCardList() {
    const container = document.getElementById('cardList');
    if (!container) return;
    
    // Mettre à jour le compteur
    const countEl = document.getElementById('cardCount');
    if (countEl) countEl.textContent = filteredCards.length;
    
    if (filteredCards.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">No cards found.</p>';
        return;
    }
    
    const leaderAttribute = deck.leader && deck.leader.attribute ? deck.leader.attribute : null;
    
    container.innerHTML = filteredCards.map((card) => {
        const isLeaderCard = card.type && card.type.toLowerCase().includes('leader');
        const borderStyle = isLeaderCard ? 'border: 2px solid gold;' : '';
        const opacityStyle = isLeaderFilterActive && !isLeaderCard ? 'opacity: 0.3;' : '';
        
        // Indicateur visuel pour les cartes qui ne correspondent pas à l'attribut du leader
        const cardAttribute = card.attribute || '';
        const attributeMismatch = leaderAttribute && cardAttribute && 
            cardAttribute.toLowerCase() !== leaderAttribute.toLowerCase();
        const mismatchStyle = attributeMismatch ? 'opacity: 0.4; filter: grayscale(70%);' : '';
        const mismatchWarning = attributeMismatch ? 
            '<span style="color: #e74c3c; font-size: 0.7em; display:block; margin-top:2px;">⚠ Wrong attribute</span>' : '';
        
        // Badge d'attribut
        const attributeBadge = cardAttribute ? 
            `<span style="background-color: ${getAttributeColor(cardAttribute)}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-left: 5px; display:inline-block; margin-top:3px;">${getAttributeName(cardAttribute)}</span>` : '';
        
        return `
        <div class="card-item" 
             style="${borderStyle} ${opacityStyle} ${mismatchStyle} cursor: grab;"
             draggable="true" 
             ondragstart="handleDragStart(event, '${card.id}')"
             ondblclick="setAsLeader('${card.id}')"
             onclick="showCardDetails('${card.id}')">
            <img src="${card.image}" alt="${card.name}" class="card-thumbnail" 
                 onerror="this.src='https://via.placeholder.com/150x200?text=No+Image'">
            <div class="card-info">
                <h4>${card.name}</h4>
                <span class="card-rarity">${card.type}</span>
                ${attributeBadge}
                ${mismatchWarning}
                ${isLeaderCard && isLeaderFilterActive ? '<span style="color:gold; font-weight:bold; display:block; margin-top:3px;">★ LEADER</span>' : ''}
            </div>
            <button class="btn-add" onclick="event.stopPropagation(); addToDeck('${card.id}')">+</button>
        </div>
    `}).join('');
}

// --- DRAG & DROP ---
window.handleDragStart = function(event, cardId) {
    event.dataTransfer.setData('text/plain', cardId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => event.target.style.opacity = '0.5', 0);
};

document.addEventListener('dragend', (event) => {
    if (event.target.classList.contains('card-item')) {
        event.target.style.opacity = '1';
    }
});

function initLeaderZone() {
    const zone = document.getElementById('leader-slot');
    if (!zone) return;
    
    zone.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');
    });
    
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });
    
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId) {
            const card = allCards.find(c => c.id === cardId);
            if (card) setAsLeader(cardId);
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
    
    if (!card.type.toLowerCase().includes('leader')) { 
        alert("Cette carte n'est pas un Leader !"); 
        return; 
    }
    
    if (deck.leader && deck.leader.id === card.id) {
        deck.leader = null;
    } else {
        if (deck.leader) {
            deck.cards.push(deck.leader);
        }
        deck.leader = card;
        const idx = deck.cards.findIndex(c => c.id === card.id);
        if (idx > -1) deck.cards.splice(idx, 1);
    }
    
    updateUI();
    applyFilters(); // ✅ Re-filtrer après changement de leader
};

window.addToDeck = function(cardId) {
    const card = allCards.find(c => c.id === cardId);
    if (!card) return;
    
    // ✅ Vérification de l'attribut
    if (deck.leader && deck.leader.attribute) {
        const leaderAttr = deck.leader.attribute.toLowerCase();
        const cardAttr = (card.attribute || '').toLowerCase();
        
        if (cardAttr && cardAttr !== leaderAttr) {
            alert(`❌ Incompatible!\n\nLeader: ${getAttributeName(deck.leader.attribute)}\nCarte: ${getAttributeName(card.attribute)}\n\nVous ne pouvez ajouter que des cartes de l'attribut du leader (ou neutres).`);
            return;
        }
    }
    
    if (card.type && card.type.toLowerCase().includes('leader')) {
        if(confirm(`Voulez-vous définir "${card.name}" comme Leader ?`)) {
            setAsLeader(card);
            return;
        }
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
    applyFilters(); // ✅ Re-filtrer
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
        const attributeBadge = deck.leader.attribute ? 
            `<div style="text-align:center; margin-top:8px;"><span style="background-color: ${getAttributeColor(deck.leader.attribute)}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.9em; font-weight:bold;">${getAttributeName(deck.leader.attribute)}</span></div>` : '';
        
        container.innerHTML = `
            <div style="position:relative; width:100%; max-width:200px; margin:0 auto;">
                <div style="position:relative; width:100%; aspect-ratio:2/3; overflow:hidden; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                    <img src="${deck.leader.image}" alt="${deck.leader.name}" style="width:100%; height:100%; object-fit:cover; display:block;">
                    <button onclick="removeLeader()" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; font-size:16px; line-height:1; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.3);">×</button>
                </div>
                <div style="text-align:center; font-weight:bold; margin-top:8px; font-size:0.95em;">${deck.leader.name}</div>
                ${attributeBadge}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="text-align:center; padding:30px 20px; color:#888; font-size:0.9em; border:2px dashed #ccc; border-radius:8px; min-height:200px; display:flex; align-items:center; justify-content:center;">
                <div>
                    <div style="font-size:2em; margin-bottom:10px;">👑</div>
                    <div>Glissez un Leader ici<br>ou double-cliquez sur une carte</div>
                </div>
            </div>`;
    }
}

function renderDeck() {
    const container = document.getElementById('deckList');
    if (!container) return;
    
    if (deck.cards.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">Votre deck est vide.</p>';
        return;
    }
    
    container.innerHTML = deck.cards.map((card, index) => `
        <div class="card-in-deck" style="position:relative; display:inline-block; margin:5px;">
            <img src="${card.image}" alt="${card.name}">
            <button class="btn-remove" onclick="removeFromDeck(${index})">×</button>
        </div>
    `).join('');
}

function updateStats() {
    const el = document.getElementById('deckStats');
    if (!el) return;
    
    const leaderInfo = deck.leader ? 
        `${deck.leader.attribute ? `<span style="color:${getAttributeColor(deck.leader.attribute)}; font-weight:bold;">${getAttributeName(deck.leader.attribute)}</span>` : 'Neutre'}` : 
        '<span style="color:#e74c3c;">MANQUANT</span>';
    
    el.innerHTML = `<div>Cartes: <strong>${deck.cards.length}/40</strong></div> <div>Leader: <strong>${leaderInfo}</strong></div>`;
}

function validateDeck() {
    const el = document.getElementById('validationResult');
    if (!el) return;
    
    const isValid = deck.leader && deck.cards.length === 40;
    el.className = isValid ? 'validation valid' : 'validation invalid';
    el.innerHTML = isValid ? '✅ Deck Valide !' : '❌ Deck Invalide (Il faut 1 Leader et 40 cartes)';
}

// Export/Import
window.exportDeck = function() {
    const data = {
        leader: deck.leader,
        cards: deck.cards
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deck.json';
    a.click();
    URL.revokeObjectURL(url);
};

window.importDeck = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                deck.leader = data.leader || null;
                deck.cards = data.cards || [];
                updateUI();
                applyFilters();
            } catch (err) {
                alert('Erreur lors de l\'import: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadCards();
    initLeaderZone();
    console.log("Application prête. Drag & Drop activé.");
});

// --- MODALE ---
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
                <span class="modal-info-value" style="color: ${getAttributeColor(card.attribute)}; font-weight: bold;">${getAttributeName(card.attribute)}</span>
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

window.closeModal = function(event) {
    if (event.target.id === 'cardModal') {
        document.getElementById('cardModal').classList.remove('active');
    }
};

window.closeModalDirect = function() {
    document.getElementById('cardModal').classList.remove('active');
};