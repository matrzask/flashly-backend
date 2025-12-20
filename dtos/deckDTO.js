/**
 * Data Transfer Object for Deck entity
 * Formats deck data for API responses
 */

/**
 * Converts a database deck row to a DTO
 * @param {Object} deck - Raw deck object from database
 * @returns {Object} Formatted deck object
 */
function toDeckDTO(deck) {
  if (!deck) return null;
  
  return {
    id: deck.id,
    owner_id: deck.owner_id,
    name: deck.name,
    public: deck.public,
    created_at: deck.created_at,
    updated_at: deck.updated_at
  };
}

/**
 * Converts an array of deck rows to DTOs
 * @param {Array} decks - Array of raw deck objects
 * @returns {Array} Array of formatted deck objects
 */
function toDeckDTOArray(decks) {
  if (!Array.isArray(decks)) return [];
  return decks.map(toDeckDTO);
}

module.exports = {
  toDeckDTO,
  toDeckDTOArray
};
