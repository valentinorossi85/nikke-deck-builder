// Configuration de l'application
const CONFIG = {
    // IPs disponibles dans Nivel Arena
    IPS: {
        NIKKE: 'nikke',
        STELLAR_BLADE: 'stellar_blade',
        EPIC_SEVEN: 'epic_seven',
        ETERNAL_RETURN: 'eternal_return',
        BROWN_DUST_2: 'brown_dust_2'
    },
    
    // Règles de construction
    DECK_RULES: {
        MIN_CARDS: 40,
        MAX_CARDS: 40,
        MAX_COPIES: 3,
        MAX_TRIGGER_CARDS: 8,
        REQUIRE_LEADER: true
    },
    
    // Attributs/Alignments
    ATTRIBUTES: {
        RED: 'red',
        BLUE: 'blue',
        GREEN: 'green',
        YELLOW: 'yellow',
        PURPLE: 'purple',
        WHITE: 'white'
    },
    
    // Raretés
    RARITIES: {
        SSR: 'SSR',
        SR: 'SR',
        R: 'R',
        N: 'N'
    },
    
    // Types de cartes
    CARD_TYPES: {
        LEADER: 'leader',
        UNIT: 'unit',
        SKILL: 'skill',
        ITEM: 'item'
    },
    
    // URLs
    API_BASE_URL: 'http://nivelarena.co.kr',
    CARD_IMAGE_BASE: 'http://nivelarena.co.kr/data/file/cardlists/'
};

// Traductions
const TRANSLATIONS = {
    fr: {
        deck: 'Deck',
        leader: 'Leader',
        cards: 'Cartes',
        validate: 'Valider',
        export: 'Exporter',
        import: 'Importer',
        search: 'Rechercher',
        filter: 'Filtrer',
        invalid_deck: 'Deck invalide',
        valid_deck: 'Deck valide',
        too_many_copies: 'Trop d\'exemplaires',
        wrong_ip: 'IP incorrecte',
        trigger_limit: 'Limite de Trigger dépassée'
    },
    en: {
        deck: 'Deck',
        leader: 'Leader',
        cards: 'Cards',
        validate: 'Validate',
        export: 'Export',
        import: 'Import',
        search: 'Search',
        filter: 'Filter',
        invalid_deck: 'Invalid deck',
        valid_deck: 'Valid deck',
        too_many_copies: 'Too many copies',
        wrong_ip: 'Wrong IP',
        trigger_limit: 'Trigger limit exceeded'
    }
};

export { CONFIG, TRANSLATIONS };