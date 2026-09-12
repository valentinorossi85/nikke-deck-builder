// Données simulées (à remplacer par ton appel API réel si nécessaire)
// J'inclus quelques exemples avec des attributs différents pour tester le filtre
const cardsData = [
    { id: 1, name: "Monkey D. Luffy", type: "Leader", attribute: "RED", cost: 0, power: 5000, effect: "[Activate: Main] Give up to 1 of your Characters +2000 power.", image: "https://en.onepiece-cardgame.com/images/products/romance_dawn/rd01-001_p1.png" },
    { id: 2, name: "Roronoa Zoro", type: "Character", attribute: "RED", cost: 5, power: 8000, effect: "[Blocker] After this Character blocks, K.O. up to 1 of your opponent's Characters with 4000 power or less.", image: "https://en.onepiece-cardgame.com/images/products/romance_dawn/rd01-002.png" },
    { id: 3, name: "Nami", type: "Character", attribute: "BLUE", cost: 3, power: 4000, effect: "[On Play] Draw 1 card.", image: "https://en.onepiece-cardgame.com/images/products/romance_dawn/rd01-003.png" },
    { id: 4, name: "Sanji", type: "Character", attribute: "GREEN", cost: 4, power: 6000, effect: "[On Play] Rest up to 1 of your opponent's Characters with cost 4 or less.", image: "https://en.onepiece-cardgame.com/images/products/romance_dawn/rd01-004.png" },
    { id: 5, name: "Trafalgar Law", type: "Leader", attribute: "GREEN", cost: 0, power: 5000, effect: "[Your Turn] All your {Straw Hat Pirates} gain +1000 power.", image: "https://en.onepiece-cardgame.com/images/products/romance_dawn/rd01-005_p1.png" },
    { id: 6, name: "Eustass Kid", type: "Leader", attribute: "YELLOW", cost: 0, power: 5000, effect: "[Opponent's Turn] Once per turn, when your opponent plays a Character, give it -2000 power during this turn.", image: "https://en.onepiece-cardgame.com/images/products/romance_dawn/rd01-006_p1.png" },
    { id: 7, name: "Crocodile", type: "Leader", attribute: "SAND", cost: 0, power: 5000, effect: "[Activate: Main] You may trash 1 card from your hand: K.O. up to 1 of your opponent's Characters with 2000 power or less.", image: "https://en.onepiece-cardgame.com/images/products/romance_dawn/rd01-007_p1.png" },
    { id: 8, name: "Magellan", type: "Leader", attribute: "PURPLE", cost: 0, power: 5000, effect: "[Your Turn] All your Characters gain [Poison].", image: "https://en.onepiece-cardgame.com/images/products/romance_dawn/rd01-008_p1.png" },
    { id: 9, name: "Kaido", type: "Leader", attribute: "BLACK", cost: 0, power: 5000, effect: "[Your Turn] All your Characters gain +1000 power.", image: "https://en.onepiece-cardgame.com/images/products/romance_dawn/rd01-009_p1.png" },
    { id: 10, name: "Boa Hancock", type: "Leader", attribute: "PINK", cost: 0, power: 5000, effect: "[Activate: Main] You may rest this Leader: Look at 5 cards from the top of your deck...", image: "https://en.onepiece-cardgame.com/images/products/romance_dawn/rd01-010_p1.png" },
    // Ajoute plus de cartes ici pour tester
];

let currentDeck = [];
let currentLeader = null;
let isLeaderFilterActive = false;

// Initialisation
window.onload = () => {
    renderCardList(cardsData);
    updateDeckUI();
};

// Rendu de la liste des cartes
function renderCardList(cards) {
    const listContainer = document.getElementById('cardList');
    listContainer.innerHTML = '';
    
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card-item';
        if (card.type !== 'Leader') {
            cardEl.classList.add('non-leader');
        }
        
        // Badge Leader
        const badge = document.createElement('div');
        badge.className = 'card-leader-badge';
        badge.innerText = '★ LEADER';
        cardEl.appendChild(badge);

        const img = document.createElement('img');
        img.src = card.image;
        img.alt = card.name;
        img.onclick = () => showCardDetails(card);
        
        // Drag & Drop events
        cardEl.draggable = true;
        cardEl.ondragstart = (e) => drag(e, card.id);
        // Double click pour ajouter rapidement
        cardEl.ondblclick = () => quickAddCard(card);

        cardEl.appendChild(img);
        listContainer.appendChild(cardEl);
    });

    document.getElementById('cardCount').innerText = cards.length;
    applyLeaderFilter();
}

// Filtrage des leaders
function toggleLeaderFilter() {
    isLeaderFilterActive = document.getElementById('leaderFilter').checked;
    applyLeaderFilter();
}

function applyLeaderFilter() {
    const listContainer = document.getElementById('cardList');
    const cards = listContainer.getElementsByClassName('card-item');
    
    if (isLeaderFilterActive) {
        listContainer.classList.add('show-leaders-only');
        for (let card of cards) {
            if (card.classList.contains('non-leader')) {
                card.classList.add('hidden-card');
            } else {
                card.classList.remove('hidden-card');
            }
        }
    } else {
        listContainer.classList.remove('show-leaders-only');
        for (let card of cards) {
            card.classList.remove('hidden-card');
        }
    }
}

// Recherche
function filterCards() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = cardsData.filter(card => 
        card.name.toLowerCase().includes(query) || 
        card.effect.toLowerCase().includes(query)
    );
    renderCardList(filtered);
}

// Drag & Drop Logic
function allowDrop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('drag-over');
}

// Gestion de la sortie de la zone de drop pour retirer la classe
document.addEventListener('dragleave', (ev) => {
    if (ev.target.classList && ev.target.classList.contains('drop-zone')) {
        ev.target.classList.remove('drag-over');
    }
});

function drag(ev, id) {
    ev.dataTransfer.setData("text", id);
}

function drop(ev, zoneType) {
    ev.preventDefault();
    const zone = ev.currentTarget;
    zone.classList.remove('drag-over');
    
    const cardId = parseInt(ev.dataTransfer.getData("text"));
    const card = cardsData.find(c => c.id === cardId);

    if (!card) return;

    if (zoneType === 'leader') {
        setLeader(card);
    } else if (zoneType === 'deck') {
        addToDeck(card);
    }
}

// Définir le Leader
function setLeader(card) {
    if (card.type !== 'Leader') {
        alert("Seules les cartes de type 'Leader' peuvent être placées dans la zone Leader !");
        return;
    }

    currentLeader = card;
    
    const dropZone = document.getElementById('leaderDropZone');
    dropZone.innerHTML = ''; // Clear placeholder
    
    const cardEl = createCardElement(card, false);
    // On retire le draggable une fois dans la zone leader pour éviter les bugs
    cardEl.draggable = false; 
    
    dropZone.appendChild(cardEl);

    checkAttributeLock();
    updateDeckUI();
}

// Vérifier l'attribut du leader pour verrouiller le deck
function checkAttributeLock() {
    const msgEl = document.getElementById('attributeLockMsg');
    if (currentLeader) {
        msgEl.innerText = `Verrouillé sur l'attribut : ${currentLeader.attribute}. Seules les cartes compatibles peuvent être ajoutées.`;
        msgEl.style.display = 'block';
    } else {
        msgEl.innerText = '';
        msgEl.style.display = 'none';
    }
}

// Ajouter au Deck
function addToDeck(card) {
    if (currentDeck.length >= 50) {
        alert("Le deck est plein (max 50 cartes).");
        return;
    }

    // Règle de l'attribut
    if (currentLeader) {
        // On autorise toujours les cartes de l'attribut du leader
        // Note: Dans One Piece TCG, certaines cartes sont multicolores ou sans couleur, 
        // mais pour simplifier ici on compare strictement sauf si c'est une carte événement/base
        if (card.attribute !== currentLeader.attribute && card.type !== 'Event') {
             // Petite tolérance : si la carte n'a pas d'attribut défini ou est spéciale
             if(card.attribute && card.attribute !== "NONE") {
                 alert(`Impossible d'ajouter ${card.name} ! Votre leader est ${currentLeader.attribute}, vous ne pouvez mettre que des cartes de cet attribut.`);
                 return;
             }
        }
    }

    currentDeck.push(card);
    updateDeckUI();
}

// Ajout rapide (double clic)
function quickAddCard(card) {
    if (card.type === 'Leader') {
        if (!currentLeader) {
            setLeader(card);
        } else {
            const confirmSwitch = confirm("Vous avez déjà un leader. Voulez-vous le remplacer par " + card.name + " ?");
            if (confirmSwitch) setLeader(card);
        }
    } else {
        addToDeck(card);
    }
}

// Création d'un élément carte HTML
function createCardElement(card, isRemovable = true) {
    const div = document.createElement('div');
    div.className = 'card-item';
    
    const img = document.createElement('img');
    img.src = card.image;
    img.alt = card.name;
    img.onclick = (e) => {
        e.stopPropagation(); // Empêcher le removal si on clique juste pour voir
        showCardDetails(card);
    };

    div.appendChild(img);

    if (isRemovable) {
        const removeBtn = document.createElement('div');
        removeBtn.className = 'remove-btn';
        removeBtn.innerText = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeFromDeck(card.id);
        };
        div.appendChild(removeBtn);
        
        // Permettre de re-dragger depuis le deck
        div.draggable = true;
        div.ondragstart = (e) => drag(e, card.id);
    }

    return div;
}

// Mise à jour de l'interface du Deck
function updateDeckUI() {
    const deckList = document.getElementById('deckList');
    const deckCount = document.getElementById('deckCount');
    
    deckList.innerHTML = '';
    deckCount.innerText = currentDeck.length;

    currentDeck.forEach((card, index) => {
        const cardEl = createCardElement(card, true);
        deckList.appendChild(cardEl);
    });
}

// Retirer du Deck
function removeFromDeck(id) {
    const index = currentDeck.findIndex(c => c.id === id);
    if (index > -1) {
        currentDeck.splice(index, 1);
        updateDeckUI();
    }
}

// Vider le Deck
function clearDeck() {
    if(confirm("Voulez-vous vraiment vider tout le deck ?")) {
        currentDeck = [];
        currentLeader = null;
        document.getElementById('leaderDropZone').innerHTML = '<p>Glissez un Leader ici</p>';
        checkAttributeLock();
        updateDeckUI();
    }
}

// Sauvegarder (Simulation)
function saveDeck() {
    if (!currentLeader) {
        alert("Choisissez d'abord un Leader !");
        return;
    }
    if (currentDeck.length < 40) {
        alert("Un deck doit contenir au moins 40 cartes.");
        return;
    }
    
    const deckSummary = {
        leader: currentLeader.name,
        attribute: currentLeader.attribute,
        count: currentDeck.length,
        cards: currentDeck.map(c => c.name)
    };
    
    console.log("Deck Sauvegardé:", deckSummary);
    alert(`Deck sauvegardé !\nLeader: ${currentLeader.name}\nCartes: ${currentDeck.length}`);
}

// --- Système de Popup et Traduction ---

async function showCardDetails(card) {
    const modal = document.getElementById('cardModal');
    const img = document.getElementById('modalImg');
    const nameEl = document.getElementById('modalName');
    const typeEl = document.getElementById('modalType');
    const attrEl = document.getElementById('modalAttribute');
    const costEl = document.getElementById('modalCost');
    const powerEl = document.getElementById('modalPower');
    const effectEl = document.getElementById('modalEffect');

    img.src = card.image;
    nameEl.innerText = card.name;
    typeEl.innerText = card.type;
    attrEl.innerText = card.attribute;
    costEl.innerText = card.cost;
    powerEl.innerText = card.power;
    
    // Indicateur de chargement
    effectEl.innerHTML = '<span class="loading-trans">Traduction en cours...</span>';
    
    modal.style.display = "block";

    // Appel API de traduction (MyMemory Translation API - Gratuit sans clé pour usage limité)
    try {
        // On traduit le nom et l'effet du Japonais/Coréen vers l'Anglais
        // Si tes données sont déjà en anglais, cette étape peut être sautée ou adaptée.
        // Ici je simule une traduction depuis le texte fourni.
        
        const textToTranslate = card.effect;
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=ja|en`);
        const data = await response.json();
        
        if (data.responseStatus === 200) {
            effectEl.innerText = data.responseData.translatedText;
        } else {
            // Fallback si l'API échoue ou si c'est déjà en anglais
            effectEl.innerText = card.effect; 
        }
    } catch (error) {
        console.error("Erreur traduction:", error);
        effectEl.innerText = card.effect; // Affiche l'original en cas d'erreur
    }
}

function closeModal(event) {
    if (event.target == document.getElementById('cardModal')) {
        document.getElementById('cardModal').style.display = "none";
    }
}

function closeModalDirect() {
    document.getElementById('cardModal').style.display = "none";
}

// Fermer avec Echap
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        document.getElementById('cardModal').style.display = "none";
    }
});