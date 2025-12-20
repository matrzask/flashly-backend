const pool = require('../db');
const { toDeckDTO, toDeckDTOArray } = require('../dtos/deckDTO');

/**
 * Get all decks for the authenticated user
 */
async function getAllDecks(req, res) {
  try {
    const result = await pool.query('SELECT * FROM decks WHERE owner_id = $1', [req.user.id]);
    res.json(toDeckDTOArray(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  }
}

/**
 * Create a new deck for the authenticated user
 */
async function createDeck(req, res) {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO decks (owner_id, name) VALUES ($1, $2) RETURNING *',
      [req.user.id, name]
    );
    res.status(201).json(toDeckDTO(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to create deck');
  }
}

/**
 * Get a specific deck by ID for the authenticated user
 */
async function getDeckById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM decks WHERE id = $1 AND owner_id = $2',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Deck not found' });
    }
    
    res.json(toDeckDTO(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  }
}

/**
 * Update a deck for the authenticated user
 */
async function updateDeck(req, res) {
  const { id } = req.params;
  const { name, public } = req.body;

  if (!name && public === undefined) {
    return res.status(400).json({ status: 'fail', message: 'Name or public field is required' });
  }
  
  try {
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    
    if (public !== undefined) {
      updates.push(`public = $${paramCount++}`);
      values.push(public);
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id, req.user.id);
    
    const result = await pool.query(
      `UPDATE decks SET ${updates.join(', ')} WHERE id = $${paramCount++} AND owner_id = $${paramCount++} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Deck not found' });
    }
    
    res.json(toDeckDTO(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to update deck');
  }
}

/**
 * Delete a deck for the authenticated user
 */
async function deleteDeck(req, res) {
  const { id } = req.params;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Verify deck ownership
    const deckCheck = await client.query(
      'SELECT id FROM decks WHERE id = $1 AND owner_id = $2',
      [id, req.user.id]
    );
    
    if (deckCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ status: 'fail', message: 'Deck not found' });
    }
    
    // Delete associated cards first
    await client.query('DELETE FROM cards WHERE deck_id = $1', [id]);
    
    // Delete the deck
    await client.query('DELETE FROM decks WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Failed to delete deck');
  } finally {
    client.release();
  }
}

/**
 * Get all public decks
 */
async function getPublicDecks(req, res) {
  try {
    const result = await pool.query('SELECT * FROM decks WHERE public = true ORDER BY created_at DESC');
    res.json(toDeckDTOArray(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  }
}

module.exports = {
  getAllDecks,
  createDeck,
  getDeckById,
  updateDeck,
  deleteDeck,
  getPublicDecks
};

