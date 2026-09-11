import { CONFIG } from './config.js';

class DeckValidator {
    constructor() {
        this.rules = CONFIG.DECK_RULES;
    }

    /**
     * Valide un deck complet
     * @param {Object} deck - Le deck à valider
     * @param {Object} deck.leader - La carte leader
     * @param {Array} deck.cards - Tableau des cartes du deck
     * @returns {Object} Résultat de la validation
     */
    validateDeck(deck) {
        const errors = [];
        const warnings = [];

        // Vérifier la présence du leader
        if (this.rules.REQUIRE_LEADER && !deck.leader) {
            errors.push({
                type: 'missing_leader',
                message: 'Un leader est requis'
            });
            return { valid: false, errors, warnings };
        }

        // Vérifier le nombre de cartes
        if (deck.cards.length < this.rules.MIN_CARDS) {
            errors.push({
                type: 'too_few_cards',
                message: `Le deck doit contenir au moins ${this.rules.MIN_CARDS} cartes (actuellement: ${deck.cards.length})`
            });
        }

        if (deck.cards.length > this.rules.MAX_CARDS) {
            errors.push({
                type: 'too_many_cards',
                message: `Le deck doit contenir maximum ${this.rules.MAX_CARDS} cartes (actuellement: ${deck.cards.length})`
            });
        }

        if (deck.leader) {
            // Vérifier la compatibilité IP
            const ipErrors = this.validateIP(deck.leader, deck.cards);
            errors.push(...ipErrors);

            // Vérifier l'alignment
            const attributeErrors = this.validateAttributes(deck.leader, deck.cards);
            errors.push(...attributeErrors);
        }

        // Vérifier les copies
        const copyErrors = this.validateCopies(deck.cards);
        errors.push(...copyErrors);

        // Vérifier les triggers
        const triggerErrors = this.validateTriggers(deck.cards);
        errors.push(...triggerErrors);

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            stats: this.getDeckStats(deck)
        };
    }

    /**
     * Valide que toutes les cartes sont de la même IP
     */
    validateIP(leader, cards) {
        const errors = [];
        const leaderIP = leader.ip;

        cards.forEach((card, index) => {
            if (card.ip !== leaderIP) {
                errors.push({
                    type: 'wrong_ip',
                    cardIndex: index,
                    cardName: card.name,
                    message: `La carte "${card.name}" (${card.ip}) n'est pas compatible avec le leader (${leaderIP})`
                });
            }
        });

        return errors;
    }

    /**
     * Valide les attributs/alignments
     */
    validateAttributes(leader, cards) {
        const errors = [];
        const allowedAttributes = leader.allowed_attributes || [leader.attribute];

        cards.forEach((card, index) => {
            if (!allowedAttributes.includes(card.attribute)) {
                errors.push({
                    type: 'wrong_attribute',
                    cardIndex: index,
                    cardName: card.name,
                    message: `L'attribut "${card.attribute}" de la carte "${card.name}" n'est pas autorisé par le leader`
                });
            }
        });

        return errors;
    }

    /**
     * Valide le nombre de copies (max 3 par carte)
     */
    validateCopies(cards) {
        const errors = [];
        const cardCounts = {};

        cards.forEach((card, index) => {
            const cardId = card.id || card.number;
            cardCounts[cardId] = cardCounts[cardId] || [];
            cardCounts[cardId].push({ index, card });
        });

        Object.entries(cardCounts).forEach(([cardId, copies]) => {
            if (copies.length > this.rules.MAX_COPIES) {
                copies.slice(this.rules.MAX_COPIES).forEach(({ index, card }) => {
                    errors.push({
                        type: 'too_many_copies',
                        cardIndex: index,
                        cardName: card.name,
                        message: `Maximum ${this.rules.MAX_COPIES} exemplaires autorisés pour "${card.name}" (actuellement: ${copies.length})`
                    });
                });
            }
        });

        return errors;
    }

    /**
     * Valide le nombre de cartes Trigger (max 8)
     */
    validateTriggers(cards) {
        const errors = [];
        const triggerCount = cards.filter(card => card.is_trigger || card.keywords?.includes('trigger')).length;

        if (triggerCount > this.rules.MAX_TRIGGER_CARDS) {
            errors.push({
                type: 'too_many_triggers',
                count: triggerCount,
                message: `Maximum ${this.rules.MAX_TRIGGER_CARDS} cartes Trigger autorisées (actuellement: ${triggerCount})`
            });
        }

        return errors;
    }

    /**
     * Génère des statistiques sur le deck
     */
    getDeckStats(deck) {
        const stats = {
            totalCards: deck.cards.length,
            byRarity: {},
            byAttribute: {},
            byCost: {},
            triggerCount: 0
        };

        deck.cards.forEach(card => {
            // Par rareté
            stats.byRarity[card.rarity] = (stats.byRarity[card.rarity] || 0) + 1;
            
            // Par attribut
            stats.byAttribute[card.attribute] = (stats.byAttribute[card.attribute] || 0) + 1;
            
            // Par coût
            stats.byCost[card.cost] = (stats.byCost[card.cost] || 0) + 1;
            
            // Trigger
            if (card.is_trigger || card.keywords?.includes('trigger')) {
                stats.triggerCount++;
            }
        });

        return stats;
    }

    /**
     * Peut-on ajouter cette carte au deck?
     */
    canAddCard(deck, newCard) {
        // Vérifier l'IP
        if (deck.leader && newCard.ip !== deck.leader.ip) {
            return { canAdd: false, reason: 'wrong_ip' };
        }

        // Vérifier les copies
        const existingCopies = deck.cards.filter(card => card.id === newCard.id).length;
        if (existingCopies >= this.rules.MAX_COPIES) {
            return { canAdd: false, reason: 'too_many_copies' };
        }

        // Vérifier les triggers
        const currentTriggers = deck.cards.filter(card => card.is_trigger).length;
        if (newCard.is_trigger && currentTriggers >= this.rules.MAX_TRIGGER_CARDS) {
            return { canAdd: false, reason: 'trigger_limit' };
        }

        return { canAdd: true };
    }
}

export default DeckValidator;