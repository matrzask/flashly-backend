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
 * Get all public decks with pagination and filters
 */
async function getPublicDecks(req, res) {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Parse filter parameters
    const nameFilter = req.query.name || '';
    const authorFilter = req.query.author || '';
    
    // Build dynamic WHERE clause
    const conditions = ['d.public = true'];
    const values = [];
    let paramCount = 1;
    
    if (nameFilter) {
      conditions.push(`d.name ILIKE $${paramCount++}`);
      values.push(`%${nameFilter}%`);
    }
    
    if (authorFilter) {
      conditions.push(`u.name ILIKE $${paramCount++}`);
      values.push(`%${authorFilter}%`);
    }
    
    const whereClause = conditions.join(' AND ');
    
    // Get total count for pagination metadata
    const countQuery = `
      SELECT COUNT(*) 
      FROM decks d 
      JOIN users u ON d.owner_id = u.id 
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    // Get paginated results with author information
    values.push(limit, offset);
    const dataQuery = `
      SELECT 
        d.id, 
        d.owner_id, 
        d.name, 
        d.public, 
        d.created_at, 
        d.updated_at,
        u.name as author_name
      FROM decks d
      JOIN users u ON d.owner_id = u.id
      WHERE ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    const result = await pool.query(dataQuery, values);
    
    res.json({
      data: toDeckDTOArray(result.rows),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  }
}

/**
 * Copy a public deck to the authenticated user's collection
 */
async function copyPublicDeck(req, res) {
  const { id } = req.params;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Verify the deck exists and is public
    const deckCheck = await client.query(
      'SELECT * FROM decks WHERE id = $1 AND public = true',
      [id]
    );
    
    if (deckCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ status: 'fail', message: 'Public deck not found' });
    }
    
    const originalDeck = deckCheck.rows[0];
    
    // Create a copy of the deck for the authenticated user
    const newDeck = await client.query(
      'INSERT INTO decks (owner_id, name, public) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, originalDeck.name + ' (Copy)', false]
    );
    
    // Copy all cards from the original deck
    await client.query(
      'INSERT INTO cards (deck_id, front, back) SELECT $1, front, back FROM cards WHERE deck_id = $2',
      [newDeck.rows[0].id, id]
    );
    
    await client.query('COMMIT');
    res.status(201).json(toDeckDTO(newDeck.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Failed to copy deck');
  } finally {
    client.release();
  }
}

module.exports = {
  getAllDecks,
  createDeck,
  getDeckById,
  updateDeck,
  deleteDeck,
  getPublicDecks,
  copyPublicDeck
};

