const pool = require('../db');
const { toCardDTOArray } = require('../dtos/cardDTO');

/**
 * Get all cards for a specific deck (owned by user or public)
 */
async function getCardsByDeckId(req, res) {
  const { deck_id } = req.params;
  try {
    // Verify deck is owned by user or is public
    const deckCheck = await pool.query(
      'SELECT id, public FROM decks WHERE id = $1 AND (owner_id = $2 OR public = true)',
      [deck_id, req.user?.id]
    );
    if (deckCheck.rows.length === 0) {
      return res.status(403).json({ status: 'fail', message: 'Access denied: deck not found or not accessible' });
    }
    
    const result = await pool.query('SELECT * FROM cards WHERE deck_id = $1', [deck_id]);
    res.json(toCardDTOArray(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  }
}

/**
 * Add a new card to a deck
 */
async function addCard(req, res) {
  const { deck_id } = req.params;
  const { front, back } = req.body;
  
  if (!front) {
    return res.status(400).json({ status: 'fail', message: 'Front is required' });
  }
  
  try {
    // Verify deck ownership
    const deckCheck = await pool.query('SELECT id FROM decks WHERE id = $1 AND owner_id = $2', [deck_id, req.user.id]);
    if (deckCheck.rows.length === 0) {
      return res.status(403).json({ status: 'fail', message: 'Access denied: deck not found or not owned by user' });
    }
    
    const result = await pool.query(
      'INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3) RETURNING *',
      [deck_id, front, back || '']
    );

    // Update the deck's updated_at timestamp
    await pool.query(
        'UPDATE decks SET updated_at = NOW() WHERE id = $1',
        [deck_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to add card');
  }
}

/**
 * Update an existing card
 */
async function updateCard(req, res) {
  const { deck_id, card_id } = req.params;
  const { front, back } = req.body;
  
  if (front === undefined && back === undefined) {
    return res.status(400).json({ status: 'fail', message: 'Front or back is required' });
  }
  
  try {
    // Verify deck ownership
    const deckCheck = await pool.query('SELECT id FROM decks WHERE id = $1 AND owner_id = $2', [deck_id, req.user.id]);
    if (deckCheck.rows.length === 0) {
      return res.status(403).json({ status: 'fail', message: 'Access denied: deck not found or not owned by user' });
    }
    
    // Verify card belongs to deck
    const cardCheck = await pool.query('SELECT id FROM cards WHERE id = $1 AND deck_id = $2', [card_id, deck_id]);
    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Card not found in this deck' });
    }
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (front !== undefined) {
      if (!front) {
        return res.status(400).json({ status: 'fail', message: 'Front cannot be empty' });
      }
      updates.push(`front = $${paramCount++}`);
      values.push(front);
    }
    
    if (back !== undefined) {
      updates.push(`back = $${paramCount++}`);
      values.push(back);
    }
    
    values.push(card_id, deck_id);
    
    const result = await pool.query(
      `UPDATE cards SET ${updates.join(', ')} WHERE id = $${paramCount++} AND deck_id = $${paramCount++} RETURNING *`,
      values
    );

    // Update the deck's updated_at timestamp
    await pool.query(
        'UPDATE decks SET updated_at = NOW() WHERE id = $1',
        [deck_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to update card');
  }
}

/**
 * Delete a card from a deck
 */
async function deleteCard(req, res) {
  const { deck_id, card_id } = req.params;
  
  try {
    // Verify deck ownership
    const deckCheck = await pool.query('SELECT id FROM decks WHERE id = $1 AND owner_id = $2', [deck_id, req.user.id]);
    if (deckCheck.rows.length === 0) {
      return res.status(403).json({ status: 'fail', message: 'Access denied: deck not found or not owned by user' });
    }
    
    // Verify card belongs to deck and delete
    const result = await pool.query(
      'DELETE FROM cards WHERE id = $1 AND deck_id = $2 RETURNING id',
      [card_id, deck_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Card not found in this deck' });
    }
    else {
        // Update the deck's updated_at timestamp
        await pool.query(
            'UPDATE decks SET updated_at = NOW() WHERE id = $1',
            [deck_id]
        );
    }
    
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete card');
  }
}

module.exports = {
  getCardsByDeckId,
  addCard,
  updateCard,
  deleteCard
};
