const pool = require('../db');
const { toCardDTOArray } = require('../dtos/cardDTO');

/**
 * Get all cards for a specific deck owned by the authenticated user
 */
async function getCardsByDeckId(req, res) {
  const { deck_id } = req.params;
  try {
    // Verify deck ownership
    const deckCheck = await pool.query('SELECT id FROM decks WHERE id = $1 AND owner_id = $2', [deck_id, req.user.id]);
    if (deckCheck.rows.length === 0) {
      return res.status(403).send('Access denied: deck not found or not owned by user');
    }
    
    const result = await pool.query('SELECT * FROM cards WHERE deck_id = $1', [deck_id]);
    res.json(toCardDTOArray(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  }
}

/**
 * Update cards for a deck (sync operation: delete removed, update existing, insert new)
 */
async function updateCards(req, res) {
  const { deckId, cards } = req.body;
  if (!deckId || !Array.isArray(cards)) {
    return res.status(400).send('deck_id and cards array required');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify deck ownership
    const deckCheck = await client.query('SELECT id FROM decks WHERE id = $1 AND owner_id = $2', [deckId, req.user.id]);
    if (deckCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(403).send('Access denied: deck not found or not owned by user');
    }

    // Get current card ids for the deck
    const { rows: existingCards } = await client.query(
      'SELECT id FROM cards WHERE deck_id = $1',
      [deckId]
    );
    const existingIds = existingCards.map(c => c.id);

    // Split incoming cards into new and existing
    const incomingIds = cards.filter(c => c.id).map(c => c.id);
    const toDelete = existingIds.filter(id => !incomingIds.includes(id));

    // Delete cards not present in the new list
    if (toDelete.length > 0) {
      await client.query(
        'DELETE FROM cards WHERE deck_id = $1 AND id = ANY($2::uuid[])',
        [deckId, toDelete]
      );
    }

    // Update existing cards
    for (const card of cards) {
      if (card.id && existingIds.includes(card.id)) {
        await client.query(
          'UPDATE cards SET front = $1, back = $2, updated_at = NOW() WHERE id = $3 AND deck_id = $4',
          [card.front, card.back, card.id, deckId]
        );
      }
    }

    // Insert new cards (no id)
    for (const card of cards) {
      if (!card.id) {
        await client.query(
          'INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3)',
          [deckId, card.front, card.back]
        );
      }
    }

    await client.query('COMMIT');

    // Return updated list
    const { rows: updatedCards } = await client.query(
      'SELECT * FROM cards WHERE deck_id = $1',
      [deckId]
    );
    res.json(toCardDTOArray(updatedCards));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Failed to sync cards');
  } finally {
    client.release();
  }
}

module.exports = {
  getCardsByDeckId,
  updateCards
};
