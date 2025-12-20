/**
 * Data Transfer Object for Card entity
 * Formats card data for API responses
 */

/**
 * Converts a database card row to a DTO
 * @param {Object} card - Raw card object from database
 * @returns {Object} Formatted card object
 */
function toCardDTO(card) {
  if (!card) return null;
  
  return {
    id: card.id,
    deck_id: card.deck_id,
    front: card.front,
    back: card.back,
    created_at: card.created_at,
    updated_at: card.updated_at
  };
}

/**
 * Converts an array of card rows to DTOs
 * @param {Array} cards - Array of raw card objects
 * @returns {Array} Array of formatted card objects
 */
function toCardDTOArray(cards) {
  if (!Array.isArray(cards)) return [];
  return cards.map(toCardDTO);
}

module.exports = {
  toCardDTO,
  toCardDTOArray
};
